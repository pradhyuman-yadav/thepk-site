import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Base64Converter = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');
  const [outputType, setOutputType] = useState('text');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('converter');
  const [savedConversions, setSavedConversions] = useState(
    JSON.parse(localStorage.getItem('base64Conversions')) || []
  );

  const encode = () => {
    if (!input.trim()) {
      setError('Please enter text to encode');
      return;
    }

    try {
      const encoded = btoa(unescape(encodeURIComponent(input)));
      setOutput(encoded);
      setError(null);
    } catch (err) {
      setError('Failed to encode. Please check your input.');
    }
  };

  const decode = () => {
    if (!input.trim()) {
      setError('Please enter Base64 to decode');
      return;
    }

    try {
      const decoded = decodeURIComponent(escape(atob(input)));
      setOutput(decoded);
      setError(null);
    } catch (err) {
      setError('Invalid Base64 format. Please check your input.');
    }
  };

  const encodeToURL = () => {
    if (!input.trim()) {
      setError('Please enter text to encode');
      return;
    }

    try {
      const encoded = btoa(unescape(encodeURIComponent(input)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      setOutput(encoded);
      setError(null);
    } catch (err) {
      setError('Failed to encode. Please check your input.');
    }
  };

  const decodeFromURL = () => {
    if (!input.trim()) {
      setError('Please enter URL-safe Base64 to decode');
      return;
    }

    try {
      let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
      const padding = 4 - (base64.length % 4);
      if (padding !== 4) {
        base64 += '='.repeat(padding);
      }
      const decoded = decodeURIComponent(escape(atob(base64)));
      setOutput(decoded);
      setError(null);
    } catch (err) {
      setError('Invalid URL-safe Base64 format. Please check your input.');
    }
  };

  const encodeImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const base64String = event.target.result;
        setOutput(base64String);
        setError(null);
      } catch (err) {
        setError('Failed to encode image.');
      }
    };
    reader.readAsDataURL(file);
  };

  const decodeImage = () => {
    if (!input.trim()) {
      setError('Please enter Base64 image data to decode');
      return;
    }

    try {
      if (!input.startsWith('data:image')) {
        setError('Invalid image Base64 format. Should start with "data:image"');
        return;
      }
      setOutput(input);
      setError(null);
    } catch (err) {
      setError('Failed to process image data.');
    }
  };

  const downloadImage = () => {
    if (!output.startsWith('data:image')) {
      setError('No valid image data to download');
      return;
    }

    const link = document.createElement('a');
    link.href = output;
    link.download = 'image.png';
    link.click();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    alert('Copied to clipboard!');
  };

  const saveConversion = () => {
    if (!input.trim() || !output.trim()) {
      setError('Nothing to save');
      return;
    }

    const conversion = {
      id: Date.now(),
      input: input.substring(0, 50),
      output: output.substring(0, 50),
      mode,
      timestamp: new Date().toLocaleString()
    };

    const updated = [conversion, ...savedConversions];
    setSavedConversions(updated);
    localStorage.setItem('base64Conversions', JSON.stringify(updated));
    alert('Conversion saved successfully!');
  };

  const deleteConversion = (id) => {
    const updated = savedConversions.filter(c => c.id !== id);
    setSavedConversions(updated);
    localStorage.setItem('base64Conversions', JSON.stringify(updated));
  };

  const loadConversion = (conversion) => {
    setMode(conversion.mode);
    // We only save snippets, so show what was saved
    alert(`Saved at ${conversion.timestamp}\nInput: ${conversion.input}...\nOutput: ${conversion.output}...`);
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleExecute = () => {
    if (mode === 'encode') {
      encode();
    } else if (mode === 'decode') {
      decode();
    } else if (mode === 'encodeURL') {
      encodeToURL();
    } else if (mode === 'decodeURL') {
      decodeFromURL();
    }
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
        <h1 className="tool-page-title">Base64 Encoder/Decoder</h1>
      </div>

      <div className="tool-content">
        <div className="tool-description">
          <p>
            Convert text and images to and from Base64 encoding. Supports standard Base64,
            URL-safe Base64, and image to Base64 conversion. Save frequently used conversions for quick access.
          </p>
        </div>

        <div className="base64-converter-container">
          {/* Mode Selection */}
          <div className="mode-selector">
            <h3>Conversion Mode</h3>
            <div className="mode-buttons">
              <button
                className={`mode-button ${mode === 'encode' ? 'active' : ''}`}
                onClick={() => { setMode('encode'); setError(null); }}
              >
                Encode Text
              </button>
              <button
                className={`mode-button ${mode === 'decode' ? 'active' : ''}`}
                onClick={() => { setMode('decode'); setError(null); }}
              >
                Decode Text
              </button>
              <button
                className={`mode-button ${mode === 'encodeURL' ? 'active' : ''}`}
                onClick={() => { setMode('encodeURL'); setError(null); }}
              >
                URL-Safe Encode
              </button>
              <button
                className={`mode-button ${mode === 'decodeURL' ? 'active' : ''}`}
                onClick={() => { setMode('decodeURL'); setError(null); }}
              >
                URL-Safe Decode
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="base64-tabs">
            <button
              className={`base64-tab-button ${activeTab === 'converter' ? 'active' : ''}`}
              onClick={() => setActiveTab('converter')}
            >
              Converter
            </button>
            <button
              className={`base64-tab-button ${activeTab === 'image' ? 'active' : ''}`}
              onClick={() => setActiveTab('image')}
            >
              Image Converter
            </button>
            <button
              className={`base64-tab-button ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved ({savedConversions.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="base64-tab-content">
            {activeTab === 'converter' && (
              <div className="converter-section">
                <div className="converter-area">
                  <label htmlFor="input-text">Input:</label>
                  <textarea
                    id="input-text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter text to encode or Base64 to decode..."
                    className="converter-textarea"
                  />
                </div>

                <div className="converter-buttons">
                  <button className="convert-button" onClick={handleExecute}>
                    {mode === 'encode' ? 'Encode' : mode === 'decode' ? 'Decode' : mode === 'encodeURL' ? 'Encode (URL-Safe)' : 'Decode (URL-Safe)'}
                  </button>
                  <button className="clear-button" onClick={clearAll}>
                    Clear All
                  </button>
                </div>

                {error && (
                  <div className="error-message">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {output && (
                  <div className="output-section">
                    <label htmlFor="output-text">Output:</label>
                    <textarea
                      id="output-text"
                      value={output}
                      readOnly
                      className="converter-textarea output-textarea"
                    />
                    <div className="output-actions">
                      <button className="copy-button" onClick={copyToClipboard}>
                        Copy Output
                      </button>
                      <button className="save-button" onClick={saveConversion}>
                        Save Conversion
                      </button>
                    </div>
                  </div>
                )}

                <div className="info-box">
                  <h4>Mode Information:</h4>
                  {mode === 'encode' && (
                    <p><strong>Encode Text:</strong> Converts regular text to Base64 format. Supports Unicode characters.</p>
                  )}
                  {mode === 'decode' && (
                    <p><strong>Decode Text:</strong> Converts Base64 encoded text back to readable format.</p>
                  )}
                  {mode === 'encodeURL' && (
                    <p><strong>URL-Safe Encode:</strong> Creates Base64 suitable for URLs by replacing +, /, and = characters.</p>
                  )}
                  {mode === 'decodeURL' && (
                    <p><strong>URL-Safe Decode:</strong> Decodes URL-safe Base64 back to original text.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'image' && (
              <div className="image-section">
                <div className="image-converter-area">
                  <h3>Image to Base64</h3>
                  <div className="file-input-wrapper">
                    <label htmlFor="image-input">Select Image:</label>
                    <input
                      id="image-input"
                      type="file"
                      accept="image/*"
                      onChange={encodeImage}
                      className="file-input"
                    />
                  </div>

                  {output && output.startsWith('data:image') && (
                    <div className="image-preview-section">
                      <div className="image-preview">
                        <img src={output} alt="Encoded" className="preview-img" />
                      </div>
                      <div className="image-base64-output">
                        <label>Base64 Output:</label>
                        <textarea
                          value={output}
                          readOnly
                          className="converter-textarea"
                          style={{ maxHeight: '200px' }}
                        />
                        <div className="image-actions">
                          <button className="copy-button" onClick={copyToClipboard}>
                            Copy Base64
                          </button>
                          <button className="download-button" onClick={downloadImage}>
                            Download Image
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="error-message">
                      <strong>Error:</strong> {error}
                    </div>
                  )}
                </div>

                <div className="base64-to-image">
                  <h3>Base64 to Image</h3>
                  <label htmlFor="base64-input">Paste Base64 Image Data:</label>
                  <textarea
                    id="base64-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste Base64 image data (starting with 'data:image')..."
                    className="converter-textarea"
                  />
                  <button className="convert-button" onClick={decodeImage}>
                    Preview Image
                  </button>

                  {output && output.startsWith('data:image') && (
                    <div className="image-result">
                      <img src={output} alt="Decoded" className="result-img" />
                      <button className="download-button" onClick={downloadImage}>
                        Download Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="saved-section">
                {savedConversions.length === 0 ? (
                  <p className="no-items">No saved conversions yet</p>
                ) : (
                  <div className="saved-list">
                    {savedConversions.map((conversion) => (
                      <div key={conversion.id} className="saved-conversion-item">
                        <div className="conversion-info">
                          <div className="conversion-mode-badge">{conversion.mode === 'encode' ? '→' : '←'} {conversion.mode}</div>
                          <div className="conversion-details">
                            <p><strong>Input:</strong> {conversion.input}</p>
                            <p><strong>Output:</strong> {conversion.output}</p>
                            <span className="conversion-time">{conversion.timestamp}</span>
                          </div>
                        </div>
                        <div className="conversion-actions">
                          <button
                            className="action-btn load-btn"
                            onClick={() => loadConversion(conversion)}
                            title="Load conversion"
                          >
                            Info
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => deleteConversion(conversion.id)}
                            title="Delete conversion"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="tool-info">
          <h3>Base64 Converter Features</h3>
          <ul>
            <li><strong>Text Encoding/Decoding:</strong> Convert text to and from standard Base64</li>
            <li><strong>URL-Safe Encoding:</strong> Create Base64 suitable for use in URLs and filenames</li>
            <li><strong>Image Support:</strong> Convert images to Base64 and vice versa</li>
            <li><strong>Image Preview:</strong> View images before and after conversion</li>
            <li><strong>File Download:</strong> Download decoded images directly</li>
            <li><strong>Unicode Support:</strong> Handles special characters and emojis correctly</li>
            <li><strong>Copy to Clipboard:</strong> Quickly copy results for use elsewhere</li>
            <li><strong>Conversion History:</strong> Save and manage previous conversions</li>
          </ul>
        </div>

        <div className="base64-guide">
          <h3>What is Base64?</h3>
          <p>
            Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format.
            It uses 64 printable ASCII characters to encode data, making it safe for transmission over text-based protocols.
          </p>

          <h4>Use Cases:</h4>
          <ul>
            <li><strong>Email Attachments:</strong> Email systems traditionally only support ASCII text, so attachments are Base64 encoded</li>
            <li><strong>Data URLs:</strong> Embedding images directly in HTML/CSS without separate file requests</li>
            <li><strong>API Communication:</strong> Sending binary data through REST APIs as text</li>
            <li><strong>Configuration Files:</strong> Storing sensitive data like passwords in configuration files</li>
            <li><strong>URL Encoding:</strong> Safe transmission of binary data in URLs</li>
            <li><strong>Web Authentication:</strong> Basic authentication credentials are Base64 encoded</li>
          </ul>

          <h4>Base64 Character Set:</h4>
          <p><code>ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=</code></p>

          <h4>Standard vs URL-Safe Base64:</h4>
          <ul>
            <li><strong>Standard:</strong> Uses +, /, and = characters</li>
            <li><strong>URL-Safe:</strong> Replaces + with -, / with _, and removes padding (=)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Base64Converter;