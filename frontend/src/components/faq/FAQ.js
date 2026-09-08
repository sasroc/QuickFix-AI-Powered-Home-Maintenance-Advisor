import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Seo from '../common/Seo';
import './FAQ.css';

const faqSchemaQuestions = [
  { q: "What is QuickFixAI?", a: "QuickFixAI is an AI-powered home maintenance advisor that provides detailed repair guides and solutions for common household issues. Our platform uses advanced AI technology to help homeowners diagnose and fix problems around their homes." },
  { q: "What kind of repairs can QuickFixAI help with?", a: "QuickFixAI can help with a wide range of home repairs, from basic plumbing and electrical issues to more complex HVAC and structural problems. Our AI provides step-by-step guides, safety precautions, and troubleshooting tips for each repair." },
  { q: "Is it safe to follow AI-generated repair guides?", a: "While our AI provides detailed and accurate repair guides, we always recommend consulting with a professional for complex or potentially dangerous repairs. Our guides include safety warnings and indicate when to call a professional." },
  { q: "What is your refund policy?", a: "We offer a 24-hour no-questions-asked refund policy for new subscribers who haven't used any credits. The refund will be processed back to your original payment method within 3-5 business days." },
  { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel your monthly subscription at any time. You'll still have access until the end of your current billing period. Lifetime access is a one-time purchase and is non-refundable after 24 hours." },
  { q: "How does the subscription work?", a: "QuickFix AI Pro is available as a monthly subscription at $4.99/month (10 repair guides per month) or a one-time Lifetime payment of $49.99 for unlimited repairs forever. Both plans include unlimited repair history and access to the latest GPT model." },
];

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
        answer: "QuickFix AI Pro comes in two options: a monthly subscription at $4.99/month giving you 10 repair guides per month, or a one-time Lifetime payment of $49.99 for unlimited repairs forever. Both plans include unlimited repair history and the latest GPT model."
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
        question: "What AI model does QuickFixAI use?",
        answer: "All QuickFix AI Pro plans use the latest, best-value GPT model from OpenAI — giving you high-quality, detailed repair guides without overpaying for compute costs."
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
        answer: "Yes, you can cancel your monthly subscription at any time. If you cancel, you'll still have access until the end of your current billing period. Here's how to cancel:\n\nMethod 1 - Through Pricing Page:\n• Click 'Pricing' in the navigation bar\n• Click 'Manage Subscription' on your current plan\n• Follow the prompts to cancel\n\nMethod 2 - Through Account Settings:\n• Click the dropdown on your account in the navigation bar\n• Select 'Settings'\n• Click the 'Manage Subscription' button\n\nAfter cancellation, you'll receive a confirmation email with details about your remaining access period. The Lifetime plan is a one-time purchase and does not require cancellation."
      },
      {
        question: "Do unused repair guides roll over to the next month?",
        answer: "No, monthly repair guides reset at the start of each billing period. Lifetime plan users always have unlimited guides, so this doesn't apply."
      },
      {
        question: "What's the difference between Monthly and Lifetime?",
        answer: "The Monthly plan ($4.99/month) gives you 10 repair guides per month and you can cancel anytime. The Lifetime plan ($49.99 one-time) gives you unlimited repair guides forever — no monthly payments, no cancellation needed. Both include unlimited history and the latest GPT model."
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqSchemaQuestions.map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a }
    }))
  };

  return (
    <div className={`faq-container ${isDarkMode ? 'dark' : ''}`}>
      <Seo
        title="FAQ | QuickFix AI — Common Questions Answered"
        description="Find answers about QuickFix AI's home repair guidance, subscription plans, refund policy, and how the AI works. Repairs for plumbing, electrical, HVAC & more."
        jsonLd={faqSchema}
      />
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