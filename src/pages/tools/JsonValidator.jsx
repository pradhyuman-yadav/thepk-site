import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JsonValidator = () => {
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [formattedJson, setFormattedJson] = useState('');

  const validateJson = () => {
    if (!jsonInput.trim()) {
      alert('Please enter JSON data to validate');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setValidationResult({
        isValid: true,
        message: 'Valid JSON!',
        errorCount: 0
      });
      setFormattedJson(JSON.stringify(parsed, null, 2));
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: `Invalid JSON: ${error.message}`,
        errorCount: 1
      });
      setFormattedJson('');
    }
  };

  const minifyJson = () => {
    if (!jsonInput.trim()) {
      alert('Please enter JSON data first');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setFormattedJson(JSON.stringify(parsed));
    } catch {
      alert('Please fix JSON errors before minifying');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedJson);
    alert('JSON copied to clipboard!');
  };

  const clearAll = () => {
    setJsonInput('');
    setFormattedJson('');
    setValidationResult(null);
  };

  const examples = [
    {
      name: "Simple Object",
      json: '{"name":"John","age":30,"city":"New York"}'
    },
    {
      name: "Array of Objects",
      json: '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]'
    },
    {
      name: "Nested Structure",
      json: '{"user":{"name":"John","profile":{"age":30,"email":"john@example.com"}}}'
    }
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
        <h1 className="tool-page-title">JSON Validator</h1>
      </div>

      <div className="tool-content">
        <div className="tool-description">
          <p>
            Validate and format JSON data. Check for syntax errors, format JSON with proper indentation, 
            and convert between different JSON formats.
          </p>
        </div>

        <div className="tool-interface">
          <div className="input-section">
            <label htmlFor="json-input">Enter JSON data:</label>
            <textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Enter your JSON data here..."
              rows={8}
            />
            
            <div className="examples">
              <h2>Examples:</h2>
              <div className="example-buttons">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    className="example-button"
                    onClick={() => setJsonInput(example.json)}
                  >
                    {example.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="validate-button"
                onClick={validateJson}
                disabled={!jsonInput.trim()}
              >
                Validate JSON
              </button>
              <button
                className="minify-button"
                onClick={minifyJson}
                disabled={!jsonInput.trim()}
              >
                Minify JSON
              </button>
              <button
                className="clear-button"
                onClick={clearAll}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="validation-result">
            {validationResult && (
              <div className={`result-message ${validationResult.isValid ? 'success' : 'error'}`}>
                <strong>{validationResult.message}</strong>
                {validationResult.errorCount > 0 && (
                  <span> ({validationResult.errorCount} error{validationResult.errorCount !== 1 ? 's' : ''})</span>
                )}
              </div>
            )}
          </div>

          <div className="output-section">
            <label htmlFor="formatted-json">Formatted/Minified JSON:</label>
            <div className="output-container">
              <textarea
                id="formatted-json"
                value={formattedJson}
                readOnly
                placeholder="Formatted JSON will appear here..."
                rows={8}
              />
              {formattedJson && (
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
          <h2>JSON Validation Features</h2>
          <ul>
            <li><strong>Syntax Validation:</strong> Check for proper JSON syntax</li>
            <li><strong>Error Reporting:</strong> Detailed error messages with line numbers</li>
            <li><strong>Formatting:</strong> Pretty-print JSON with proper indentation</li>
            <li><strong>Minification:</strong> Remove unnecessary whitespace</li>
            <li><strong>Copy to Clipboard:</strong> Easy copying of formatted JSON</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JsonValidator;
