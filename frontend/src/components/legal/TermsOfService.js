import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Legal.css';

function TermsOfService() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`legal-page ${isDarkMode ? 'dark' : ''}`}>
      <div className="legal-content">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using QuickFix AI, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
        </section>

        <section>
          <h2>2. Use License</h2>
          <p>Permission is granted to temporarily use QuickFix AI for personal, non-commercial purposes. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software contained in QuickFix AI</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        <section>
          <h2>3. Disclaimer</h2>
          <p>The materials on QuickFix AI are provided on an 'as is' basis. QuickFix AI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        </section>

        <section>
          <h2>4. Limitations</h2>
          <p>In no event shall QuickFix AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on QuickFix AI.</p>
        </section>

        <section>
          <h2>5. Accuracy of Materials</h2>
          <p>The materials appearing on QuickFix AI could include technical, typographical, or photographic errors. QuickFix AI does not warrant that any of the materials on its website are accurate, complete, or current. QuickFix AI may make changes to the materials contained on its website at any time without notice.</p>
        </section>

        <section>
          <h2>6. Links</h2>
          <p>QuickFix AI has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by QuickFix AI of the site.</p>
        </section>

        <section>
          <h2>7. Modifications</h2>
          <p>QuickFix AI may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</p>
        </section>

        <section>
          <h2>8. Governing Law</h2>
          <p>These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
        </section>
      </div>
    </div>
  );
}

export default TermsOfService; 