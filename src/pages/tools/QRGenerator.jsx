import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QRGenerator = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [qrSize, setQrSize] = useState(200);
  const [qrUrl, setQrUrl] = useState('');

  const generateQR = () => {
    if (!text.trim()) {
      alert('Please enter some text to generate QR code');
      return;
    }

    // Using qr-server.com API for QR code generation
    const encodedText = encodeURIComponent(text);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodedText}`;
    setQrUrl(qrCodeUrl);
  };

  const downloadQR = () => {
    if (!qrUrl) return;

    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = 'qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAll = () => {
    setText('');
    setQrUrl('');
    setQrSize(200);
  };

  const examples = [
    'https://thepk.in',
    'Hello World!',
    'mailto:example@email.com',
    'tel:+1234567890',
    'WIFI:T:WPA;S:MyNetwork;P:password123;;'
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
        <h1 className="tool-page-title">QR Code Generator</h1>
      </div>

      <div className="tool-content">
        <div className="tool-description">
          <p>
            Generate QR codes from text, URLs, or other data. Perfect for sharing links, 
            contact information, WiFi credentials, and more.
          </p>
        </div>

        <div className="tool-interface">
          <div className="input-section">
            <label htmlFor="text">Enter text or URL:</label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text, URL, or other data..."
              rows={4}
            />
            
            <div className="size-control">
              <label htmlFor="size">QR Code Size: {qrSize}px</label>
              <input
                type="range"
                id="size"
                min="100"
                max="500"
                value={qrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value))}
              />
            </div>

            <div className="examples">
              <h2>Examples:</h2>
              <div className="example-buttons">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    className="example-button"
                    onClick={() => setText(example)}
                  >
                    {example.length > 30 ? example.substring(0, 30) + '...' : example}
                  </button>
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="generate-button"
                onClick={generateQR}
                disabled={!text.trim()}
              >
                Generate QR Code
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
            <label htmlFor="qr-code">Generated QR Code:</label>
            <div className="qr-container">
              {qrUrl ? (
                <div className="qr-display">
                  <img 
                    src={qrUrl} 
                    alt="Generated QR Code"
                    className="qr-image"
                  />
                  <div className="qr-actions">
                    <button 
                      className="download-button"
                      onClick={downloadQR}
                    >
                      Download PNG
                    </button>
                    <button 
                      className="copy-button"
                      onClick={() => navigator.clipboard.writeText(qrUrl)}
                    >
                      Copy Image URL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="qr-placeholder">
                  <p>Your QR code will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="tool-info">
          <h2>QR Code Types</h2>
          <ul>
            <li><strong>URL:</strong> Direct links to websites</li>
            <li><strong>Text:</strong> Plain text messages</li>
            <li><strong>Email:</strong> mailto: links for email addresses</li>
            <li><strong>Phone:</strong> tel: links for phone numbers</li>
            <li><strong>WiFi:</strong> WIFI:T:WPA;S:NetworkName;P:Password;;</li>
            <li><strong>SMS:</strong> sms: links for text messages</li>
            <li><strong>Contact:</strong> vCard format for contact information</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
