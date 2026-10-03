import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GitCommitGenerator = () => {
  const navigate = useNavigate();
  const [changes, setChanges] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCommitMessage = async () => {
    if (!changes.trim()) {
      alert('Please describe your changes first');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation (replace with actual API call)
    setTimeout(() => {
      const conventionalTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'];
      const randomType = conventionalTypes[Math.floor(Math.random() * conventionalTypes.length)];
      
      const generatedMessage = `${randomType}: ${changes.toLowerCase()}`;
      setCommitMessage(generatedMessage);
      setIsGenerating(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(commitMessage);
    alert('Commit message copied to clipboard!');
  };

  const clearAll = () => {
    setChanges('');
    setCommitMessage('');
    setIsGenerating(false);
  };

  const examples = [
    "Add user authentication system",
    "Fix login validation bug",
    "Update API documentation",
    "Refactor database connection logic",
    "Add unit tests for payment module"
  ];

  return (
    <div className="tool-page">
      <div className="tool-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/tools')}
        >
          ← Back to Tools
        </button>
        <h1 className="tool-page-title">Git Commit Generator</h1>
      </div>

      <div className="tool-content">
        <div className="tool-description">
          <p>
            Generate meaningful commit messages based on your changes. This tool helps you create 
            conventional commit messages that follow best practices and make your git history more readable.
          </p>
        </div>

        <div className="tool-interface">
          <div className="input-section">
            <label htmlFor="changes">Describe your changes:</label>
            <textarea
              id="changes"
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder="e.g., Add user authentication system with JWT tokens"
              rows={4}
            />
            
            <div className="examples">
              <h2>Examples:</h2>
              <div className="example-tags">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    className="example-tag"
                    onClick={() => setChanges(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="generate-button"
                onClick={generateCommitMessage}
                disabled={isGenerating || !changes.trim()}
              >
                {isGenerating ? 'Generating...' : 'Generate Commit Message'}
              </button>

              <button
                className="clear-button"
                onClick={clearAll}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="output-section">
            <label htmlFor="commit-message">Generated Commit Message:</label>
            <div className="output-container">
              <textarea
                id="commit-message"
                value={commitMessage}
                readOnly
                placeholder="Your generated commit message will appear here..."
                rows={3}
              />
              {commitMessage && (
                <button 
                  className="copy-button"
                  onClick={copyToClipboard}
                >
                  Copy to Clipboard
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="tool-info">
          <h2>Conventional Commit Format</h2>
          <p>
            This tool generates commit messages following the conventional commit specification:
          </p>
          <ul>
            <li><strong>feat:</strong> A new feature</li>
            <li><strong>fix:</strong> A bug fix</li>
            <li><strong>docs:</strong> Documentation only changes</li>
            <li><strong>style:</strong> Changes that do not affect the meaning of the code</li>
            <li><strong>refactor:</strong> A code change that neither fixes a bug nor adds a feature</li>
            <li><strong>test:</strong> Adding missing tests or correcting existing tests</li>
            <li><strong>chore:</strong> Changes to the build process or auxiliary tools</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GitCommitGenerator;
