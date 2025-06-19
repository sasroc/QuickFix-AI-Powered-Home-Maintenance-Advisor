import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import OpenAI from 'openai';
import admin from '../utils/firebaseAdmin';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Pre-defined responses for common home maintenance issues
const MAINTENANCE_RESPONSES: { [key: string]: any } = {
  'leaking pipe': {
    steps: [
      "Turn off the water supply to the affected area",
      "Locate the source of the leak",
      "Clean and dry the area around the leak",
      "Apply pipe repair tape or epoxy putty",
      "Test the repair by turning water back on"
    ],
    tools: [
      "Pipe wrench",
      "Pipe repair tape",
      "Epoxy putty",
      "Bucket",
      "Towels"
    ],
    materials: [
      "Pipe repair tape",
      "Epoxy putty",
      "Pipe sealant"
    ],
    estimatedTime: 60,
    confidenceScore: 85
  },
  'electrical outlet': {
    steps: [
      "Turn off power to the outlet at the circuit breaker",
      "Test the outlet with a voltage tester",
      "Remove the outlet cover and mounting screws",
      "Check for loose or damaged wires",
      "Replace or repair the outlet as needed"
    ],
    tools: [
      "Voltage tester",
      "Screwdriver",
      "Wire strippers",
      "Needle-nose pliers"
    ],
    materials: [
      "New outlet (if needed)",
      "Wire nuts",
      "Electrical tape"
    ],
    estimatedTime: 45,
    confidenceScore: 80
  },
  'running water': {
    steps: [
      "Turn off the water supply",
      "Locate the source of the leak",
      "Inspect pipes and connections",
      "Tighten loose connections or replace damaged parts",
      "Test the repair by turning water back on"
    ],
    tools: [
      "Pipe wrench",
      "Adjustable wrench",
      "Pipe cutter",
      "Bucket",
      "Towels"
    ],
    materials: [
      "Pipe sealant",
      "Pipe fittings",
      "Pipe tape"
    ],
    estimatedTime: 90,
    confidenceScore: 75
  }
};

export const analyzeIssue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { description, image, uid } = req.body;

    if (!description && !image) {
      throw new AppError('Either description or image is required', 400);
    }

    if (!uid) {
      throw new AppError('User ID (uid) is required', 400);
    }

    // Fetch user plan and credits from Firestore
    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new AppError('User not found', 404);
    }
    const userData = userSnap.data();
    const plan = userData?.plan || 'starter';
    let credits = userData?.credits ?? 0;
    if (credits <= 0) {
      return res.status(403).json({ message: 'You have no credits remaining. Please upgrade your plan.' });
    }

    // Deduct a credit
    await userRef.update({ credits: credits - 1 });

    // Select model based on plan
    let model = 'gpt-4.1-nano';
    if (plan === 'pro') model = 'gpt-4o-mini';
    else if (plan === 'premium') model = 'gpt-4o';

    logger.info('Processing repair request:', { hasDescription: !!description, hasImage: !!image, plan, model });

    // Initialize response object
    const response: any = {
      steps: [],
      tools: [],
      materials: [],
      estimatedTime: 0,
      confidenceScore: 0
    };

    // Process text input if provided
    if (description) {
      logger.debug('Processing text input:', description);
      
      const prompt = `You are a home maintenance expert. Analyze this issue and provide a detailed repair guide.

Issue: ${description}

Please provide a repair guide with the following sections:
1. A list of numbered steps for the repair
2. Required tools
3. Required materials
4. Estimated time in minutes
5. Confidence score (0-100)

Format your response exactly like this:
STEPS:
1. [Step 1]
2. [Step 2]
...

TOOLS:
- [Tool 1]
- [Tool 2]
...

MATERIALS:
- [Material 1]
- [Material 2]
...

TIME: [number] minutes
CONFIDENCE: [number]`;

      try {
        logger.debug('Sending request to OpenAI API...');
        
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: "You are a home maintenance expert assistant that provides detailed repair guides. Be concise but thorough in your responses."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 800,
          top_p: 0.9,
        });

        const generatedText = completion.choices[0]?.message?.content;
        
        if (!generatedText) {
          throw new Error('No response from OpenAI API');
        }

        logger.debug('Generated text:', generatedText);

        // Parse the model's response
        response.steps = parseSteps(generatedText);
        response.tools = extractTools(generatedText);
        response.materials = extractMaterials(generatedText);
        response.estimatedTime = extractTime(generatedText);
        response.confidenceScore = extractConfidence(generatedText);

        // If no steps were found, provide a default response
        if (response.steps.length === 0) {
          logger.warn('No steps found in AI response, using default response');
          response.steps = [
            "Assess the damage and identify the root cause",
            "Gather necessary tools and materials",
            "Follow safety precautions",
            "Perform the repair",
            "Test the repair to ensure it works correctly"
          ];
          response.tools = ["Basic hand tools", "Safety equipment"];
          response.materials = ["Replacement parts as needed"];
          response.estimatedTime = 60;
          response.confidenceScore = 50;
        }

        logger.info('Successfully processed text input', {
          stepsCount: response.steps.length,
          toolsCount: response.tools.length,
          materialsCount: response.materials.length
        });
      } catch (error) {
        logger.error('Error processing text input:', error);
        if (error instanceof Error) {
          logger.error('Error details:', {
            message: error.message,
            stack: error.stack
          });
        }
        // Return a default response instead of throwing an error
        response.steps = [
          "Assess the damage and identify the root cause",
          "Gather necessary tools and materials",
          "Follow safety precautions",
          "Perform the repair",
          "Test the repair to ensure it works correctly"
        ];
        response.tools = ["Basic hand tools", "Safety equipment"];
        response.materials = ["Replacement parts as needed"];
        response.estimatedTime = 60;
        response.confidenceScore = 50;
      }
    }

    // Process image if provided
    if (image) {
      logger.debug('Processing image input');
      
      try {
        // Optimize image size if it's too large
        let optimizedImage = image;
        if (image.length > 1000000) { // If image is larger than ~1MB
          logger.debug('Image is large, optimizing...');
          // For now, we'll just log this. In a production environment,
          // you might want to implement actual image compression
          logger.debug('Large image detected, consider implementing image compression');
        }

        // Create a comprehensive prompt that includes both image and text analysis
        const imagePrompt = `You are a home maintenance expert. Analyze this image and the provided description to create a detailed repair guide.

${description ? `Issue Description: ${description}` : 'Please analyze the image to identify the maintenance or repair issue.'}

Please provide a repair guide with the following sections:
1. A list of numbered steps for the repair
2. Required tools
3. Required materials
4. Estimated time in minutes
5. Confidence score (0-100)

Format your response exactly like this:
STEPS:
1. [Step 1]
2. [Step 2]
...

TOOLS:
- [Tool 1]
- [Tool 2]
...

MATERIALS:
- [Material 1]
- [Material 2]
...

TIME: [number] minutes
CONFIDENCE: [number]`;

        const messages: any[] = [
          {
            role: "system",
            content: "You are a home maintenance expert assistant that provides detailed repair guides. Analyze images carefully to identify issues and provide accurate repair instructions. Be concise but thorough in your responses."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: imagePrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: optimizedImage
                }
              }
            ]
          }
        ];

        logger.debug('Sending image analysis request to OpenAI Vision API...');
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // Use GPT-4o for vision capabilities
          messages,
          temperature: 0.5,
          max_tokens: 800,
          top_p: 0.9,
        });

        const generatedText = completion.choices[0]?.message?.content;
        
        if (!generatedText) {
          throw new Error('No response from OpenAI Vision API');
        }

        logger.debug('Generated image analysis text:', generatedText);

        // Parse the model's response for image analysis
        const imageSteps = parseSteps(generatedText);
        const imageTools = extractTools(generatedText);
        const imageMaterials = extractMaterials(generatedText);
        const imageTime = extractTime(generatedText);
        const imageConfidence = extractConfidence(generatedText);

        // If we have both text and image, combine the results intelligently
        if (description && imageSteps.length > 0) {
          // Use image analysis results if they're more detailed
          if (imageSteps.length > response.steps.length) {
            response.steps = imageSteps;
            response.tools = imageTools;
            response.materials = imageMaterials;
            response.estimatedTime = imageTime;
            response.confidenceScore = imageConfidence;
          }
          // Otherwise keep the text analysis results
        } else if (imageSteps.length > 0) {
          // Use image analysis results if no text description
          response.steps = imageSteps;
          response.tools = imageTools;
          response.materials = imageMaterials;
          response.estimatedTime = imageTime;
          response.confidenceScore = imageConfidence;
        }

        // Store a reference to the image instead of the full image data to reduce response size
        response.imageAnalysis = "Image analyzed successfully";

        logger.info('Successfully processed image input', {
          stepsCount: response.steps.length,
          toolsCount: response.tools.length,
          materialsCount: response.materials.length,
          hasImageAnalysis: true
        });
      } catch (error) {
        logger.error('Error processing image input:', error);
        if (error instanceof Error) {
          logger.error('Error details:', {
            message: error.message,
            stack: error.stack
          });
        }
        // If image analysis fails, still include a reference but use text analysis results
        response.imageAnalysis = "Image analysis failed, using text description";
      }
    }

    res.json(response);
  } catch (error) {
    logger.error('Error in analyzeIssue:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to analyze repair issue', 500));
    }
  }
};

// Helper functions for parsing model responses
function parseSteps(text: string): string[] {
  try {
    const stepsMatch = text.match(/STEPS:\n([\s\S]*?)(?=TOOLS:|$)/);
    if (!stepsMatch) {
      logger.warn('No steps found in AI response');
      return [];
    }

    const stepsText = stepsMatch[1];
    return stepsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
  } catch (error) {
    logger.error('Error parsing steps:', error);
    return [];
  }
}

function extractTools(text: string): string[] {
  try {
    const toolsMatch = text.match(/TOOLS:\n([\s\S]*?)(?=MATERIALS:|$)/);
    if (!toolsMatch) {
      logger.warn('No tools found in AI response');
      return [];
    }

    return toolsMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  } catch (error) {
    logger.error('Error extracting tools:', error);
    return [];
  }
}

function extractMaterials(text: string): string[] {
  try {
    const materialsMatch = text.match(/MATERIALS:\n([\s\S]*?)(?=TIME:|$)/);
    if (!materialsMatch) {
      logger.warn('No materials found in AI response');
      return [];
    }

    return materialsMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  } catch (error) {
    logger.error('Error extracting materials:', error);
    return [];
  }
}

function extractTime(text: string): number {
  try {
    const timeMatch = text.match(/TIME:\s*(\d+)/);
    return timeMatch ? parseInt(timeMatch[1], 10) : 0;
  } catch (error) {
    logger.error('Error extracting time:', error);
    return 0;
  }
}

function extractConfidence(text: string): number {
  try {
    const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/);
    return confidenceMatch ? parseInt(confidenceMatch[1], 10) : 0;
  } catch (error) {
    logger.error('Error extracting confidence:', error);
    return 0;
  }
} 