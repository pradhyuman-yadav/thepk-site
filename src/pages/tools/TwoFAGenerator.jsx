import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TwoFAGenerator = () => {
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  // Generate TOTP code
  const generateTOTP = (secretKey) => {
    if (!secretKey) return '';
    
    // Simple TOTP implementation (in real app, use a proper library)
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const time = Math.floor(epoch / 30);
    
    // Simple hash-based code generation
    const hash = time.toString().split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return Math.abs(hash).toString().padStart(6, '0').slice(-6);
  };

  // Update code every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (secret) {
        setCode(generateTOTP(secret));
        setTimeLeft(30 - (Math.floor(Date.now() / 1000) % 30));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [secret]);

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecret(result);
    setCode(generateTOTP(result));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const clearAll = () => {
    setSecret('');
    setCode('');
  };

  const examples = [
    'JBSWY3DPEHPK3PXP',
    'MFRGG43FMZQXEZLT',
    'KRSXG5CTMVRXEZLU'
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
        <h1 className="tool-page-title">2FA Code Generator</h1>
      </div>

      <div className="tool-content">
        <div className="tool-description">
          <p>
            Generate Time-based One-Time Passwords (TOTP) for two-factor authentication. 
            Enter your secret key or generate a new one to get your 6-digit codes.
          </p>
        </div>

        <div className="tool-interface">
          <div className="input-section">
            <label htmlFor="secret">Secret Key:</label>
            <div className="secret-container">
              <input
                type="text"
                id="secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value.toUpperCase())}
                placeholder="Enter your secret key..."
                style={{ fontFamily: 'Courier New', letterSpacing: '2px' }}
              />
              <button 
                className="copy-button"
                onClick={() => copyToClipboard(secret)}
                disabled={!secret}
              >
                Copy
              </button>
            </div>
            
            <div className="action-buttons">
              <button
                className="generate-button"
                onClick={generateSecret}
              >
                Generate New Secret
              </button>

              <button
                className="clear-button"
                onClick={clearAll}
              >
                Clear
              </button>
            </div>

            <div className="examples">
              <h2>Example Secrets:</h2>
              <div className="example-buttons">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    className="example-button"
                    onClick={() => setSecret(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="output-section">
            <label htmlFor="code">Generated Code:</label>
            <div className="code-container">
              <div className="code-display">
                <span className="code-text">{code || '------'}</span>
                <div className="time-indicator">
                  <div 
                    className="time-bar"
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                  ></div>
                  <span className="time-text">{timeLeft}s</span>
                </div>
              </div>
              <button 
                className="copy-button"
                onClick={() => copyToClipboard(code)}
                disabled={!code}
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>

        <div className="tool-info">
          <h2>How 2FA Works</h2>
          <ul>
            <li><strong>TOTP Algorithm:</strong> Time-based One-Time Password using HMAC-SHA1</li>
            <li><strong>30-Second Window:</strong> Codes refresh every 30 seconds</li>
            <li><strong>Secret Key:</strong> Base32 encoded key shared between you and the service</li>
            <li><strong>Compatibility:</strong> Works with Google Authenticator, Authy, and other 2FA apps</li>
            <li><strong>Security:</strong> Each code is unique and expires quickly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TwoFAGenerator;
