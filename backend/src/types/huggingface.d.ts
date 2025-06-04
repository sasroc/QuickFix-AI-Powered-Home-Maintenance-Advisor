declare module '@huggingface/inference' {
  export interface TextGenerationParameters {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    repetition_penalty?: number;
    do_sample?: boolean;
    return_full_text?: boolean;
  }

  export interface TextGenerationResponse {
    generated_text: string;
  }

  export interface HfInferenceOptions {
    endpointUrl?: string;
  }

  export class HfInference {
    constructor(apiKey: string, options?: HfInferenceOptions);
    textGeneration(params: {
      model: string;
      inputs: string;
      parameters?: TextGenerationParameters;
    }): Promise<TextGenerationResponse>;
  }
} 