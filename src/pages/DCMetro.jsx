import React, { useRef, useEffect } from 'react';
import { useTheme } from '../contexts/theme';

const DCMetro = () => {
  const { isDarkMode } = useTheme();
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const theme = isDarkMode ? 'dark' : 'light';
    const send = () => iframe.contentWindow?.postMessage({ type: 'SET_THEME', theme }, 'https://dc-metro.thepk.in');
    iframe.addEventListener('load', send);
    send();
    return () => iframe.removeEventListener('load', send);
  }, [isDarkMode]);

  return (
    <div className="dcmetro-page">
      <header className="page-header">
        <h1 className="page-title">DC Metro</h1>
        <p className="page-subtitle">Real-time Washington DC Metro transit information</p>
      </header>
      <div className="dcmetro-embed">
        <div className="dcmetro-toolbar">
          <a
            href="https://dc-metro.thepk.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="dcmetro-open-btn"
          >
            Open full screen ↗
          </a>
        </div>
        <iframe
          ref={iframeRef}
          src="https://dc-metro.thepk.in/"
          title="DC Metro"
          className="dcmetro-iframe"
          allow="geolocation"
        />
      </div>
    </div>
  );
};

export default DCMetro;
