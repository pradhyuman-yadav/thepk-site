import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CodeFormatter = () => {
  const navigate = useNavigate();
  const [inputCode, setInputCode] = useState('');
  const [formattedCode, setFormattedCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isFormatting, setIsFormatting] = useState(false);

  const formatCode = () => {
    if (!inputCode.trim()) {
      alert('Please enter some code to format');
      return;
    }

    setIsFormatting(true);
    
    // Simulate formatting (replace with actual formatting logic)
    setTimeout(() => {
      let formatted = inputCode;
      
      switch (language) {
        case 'javascript':
          formatted = formatJavaScript(inputCode);
          break;
        case 'python':
          formatted = formatPython(inputCode);
          break;
        case 'html':
          formatted = formatHTML(inputCode);
          break;
        case 'css':
          formatted = formatCSS(inputCode);
          break;
        default:
          formatted = inputCode;
      }
      
      setFormattedCode(formatted);
      setIsFormatting(false);
    }, 1000);
  };

  const formatJavaScript = (code) => {
    // Simple JavaScript formatting
    return code
      .replace(/;\s*/g, ';\n')
      .replace(/{\s*/g, '{\n  ')
      .replace(/}\s*/g, '\n}\n')
      .replace(/,\s*/g, ',\n  ')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  };

  const formatPython = (code) => {
    // Simple Python formatting
    return code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  };

  const formatHTML = (code) => {
    // Simple HTML formatting
    return code
      .replace(/></g, '>\n<')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  };

  const formatCSS = (code) => {
    // Simple CSS formatting
    return code
      .replace(/{\s*/g, '{\n  ')
      .replace(/}\s*/g, '\n}\n')
      .replace(/;\s*/g, ';\n  ')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedCode);
    alert('Formatted code copied to clipboard!');
  };

  const clearAll = () => {
    setInputCode('');
    setFormattedCode('');
    setIsFormatting(false);
  };

  const examples = {
    javascript: `function calculateTotal(items){let total=0;for(let i=0;i<items.length;i++){total+=items[i].price;}return total;}`,
    python: `def calculate_total(items):total=0;for item in items:total+=item.price;return total`,
    html: `<div><h1>Title</h1><p>Content</p></div>`,
    css: `.container{width:100%;height:auto;background-color:#fff;margin:0;padding:20px;}`
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/tools')}
        >
          ← Back to Tools
        </button>
        <h1 className="tool-page-title">Code Formatter</h1>
      </div>

      <div className="tool-content">
        <div className="tool-description">
          <p>
            Format and beautify your code across multiple languages. This tool helps you maintain 
            consistent code style and improve readability.
          </p>
        </div>

        <div className="tool-interface">
          <div className="language-selector">
            <label htmlFor="language">Select Language:</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
          </div>

          <div className="input-section">
            <label htmlFor="input-code">Enter your code:</label>
            <textarea
              id="input-code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder={`Enter your ${language} code here...`}
              rows={8}
            />
            
            <div className="action-buttons">
              <button
                className="example-button"
                onClick={() => setInputCode(examples[language])}
              >
                Load Example
              </button>

              <button
                className="format-button"
                onClick={formatCode}
                disabled={isFormatting || !inputCode.trim()}
              >
                {isFormatting ? 'Formatting...' : 'Format Code'}
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
            <label htmlFor="formatted-code">Formatted Code:</label>
            <div className="output-container">
              <textarea
                id="formatted-code"
                value={formattedCode}
                readOnly
                placeholder="Your formatted code will appear here..."
                rows={8}
              />
              {formattedCode && (
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
          <h2>Supported Languages</h2>
          <ul>
            <li><strong>JavaScript:</strong> Adds proper indentation and line breaks</li>
            <li><strong>Python:</strong> Cleans up whitespace and formatting</li>
            <li><strong>HTML:</strong> Formats tags and indentation</li>
            <li><strong>CSS:</strong> Organizes properties and selectors</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CodeFormatter;
