import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './FAQ.css';

const faqCategories = [
  {
    title: "Getting Started",
    icon: "🚀",
    questions: [
      {
        question: "What is QuickFixAI?",
        answer: "QuickFixAI is an AI-powered home maintenance advisor that provides detailed repair guides and solutions for common household issues. Our platform uses advanced AI technology to help homeowners diagnose and fix problems around their homes."
      },
      {
        question: "How does the subscription work?",
        answer: "We offer three subscription tiers: Starter, Pro, and Premium. Each tier comes with a different number of repair guides per month and access to different AI model capabilities. You can choose between monthly or annual billing, with annual plans offering significant savings."
      }
    ]
  },
  {
    title: "Features & Capabilities",
    icon: "🛠️",
    questions: [
      {
        question: "What kind of repairs can QuickFixAI help with?",
        answer: "QuickFixAI can help with a wide range of home repairs, from basic plumbing and electrical issues to more complex HVAC and structural problems. Our AI provides step-by-step guides, safety precautions, and troubleshooting tips for each repair."
      },
      {
        question: "What's the difference between the AI models?",
        answer: "Our Starter plan uses GPT-4.1 Nano for basic repairs, Pro plan uses GPT-4o Mini for more detailed solutions, and Premium plan uses GPT-4o for the most comprehensive and expert-level guidance."
      }
    ]
  },
  {
    title: "Safety & Best Practices",
    icon: "🛡️",
    questions: [
      {
        question: "Is it safe to follow AI-generated repair guides?",
        answer: "While our AI provides detailed and accurate repair guides, we always recommend consulting with a professional for complex or potentially dangerous repairs. Our guides include safety warnings and when to call a professional."
      }
    ]
  },
  {
    title: "Account & Billing",
    icon: "💳",
    questions: [
      {
        question: "What is your refund policy?",
        answer: "We offer a 24-hour no-questions-asked refund policy for new subscribers. If you subscribe to any plan and haven't used any credits within 24 hours of your subscription, you're eligible for a full refund. Here's how it works:\n\n• You have 24 hours from the time of subscription to request a refund\n• You must not have used any of your repair guide credits\n• The refund will be processed back to your original payment method within 3-5 business days\n• Your subscription will be cancelled and your account will be downgraded to the free tier\n\nTo request a refund, go to your account settings and look for the refund option if you're eligible, or contact our support team."
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes, you can cancel your subscription at any time. If you cancel, you'll still have access to your plan until the end of your current billing period. Here's how to cancel:\n\nMethod 1 - Through Pricing Page:\n• Click 'Pricing' in the navigation bar\n• Scroll down to your current plan\n• Click 'Manage Subscription'\n• Follow the prompts to cancel\n\nMethod 2 - Through Account Settings:\n• Click the dropdown on your account in the navigation bar\n• Select 'Settings'\n• Scroll down to find the 'Manage Subscription' button\n• Click it and follow the cancellation prompts\n\nAfter cancellation, you'll receive a confirmation email with details about your remaining access period."
      },
      {
        question: "Do unused repair guides roll over to the next month?",
        answer: "No, repair guides do not roll over to the next month. Each month, your guide count resets to ensure fair usage across all subscribers."
      },
      {
        question: "Can I upgrade or downgrade my plan?",
        answer: "Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate will apply at the start of your next billing cycle."
      }
    ]
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Getting Started');
  const { isDarkMode } = useTheme();

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const currentCategory = faqCategories.find(cat => cat.title === activeCategory);

  return (
    <div className={`faq-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="quickfix-gradient-bg" />
      <div className="faq-content-wrapper">
        <div className="faq-header">
          <h1 className="faq-title">Frequently Asked Questions</h1>
          <p className="faq-subtitle">Find answers to common questions about QuickFixAI</p>
        </div>

        <div className="faq-content">
          <div className="faq-categories">
            {faqCategories.map((category) => (
              <button
                key={category.title}
                className={`category-button ${activeCategory === category.title ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.title)}
              >
                <span className="category-icon">{category.icon}</span>
                {category.title}
              </button>
            ))}
          </div>

          <div className="faq-list">
            {currentCategory.questions.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${openIndex === index ? 'open' : ''}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="question-text">{faq.question}</span>
                  <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
                </button>
                <div className="faq-answer">
                  <div className="answer-content">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 