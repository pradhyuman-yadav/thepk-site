import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Articles from './pages/Articles';
import SingleArticle from './pages/SingleArticle';
import Tools from './pages/Tools';
import About from './pages/About';
import GitCommitGenerator from './pages/tools/GitCommitGenerator';
import CodeFormatter from './pages/tools/CodeFormatter';
import JsonValidator from './pages/tools/JsonValidator';
import PasswordGenerator from './pages/tools/PasswordGenerator';
import TwoFAGenerator from './pages/tools/TwoFAGenerator';
import QRGenerator from './pages/tools/QRGenerator';
import ColorPaletteGenerator from './pages/tools/ColorPaletteGenerator';
import APITester from './pages/tools/APITester';
import RegexBuilder from './pages/tools/RegexBuilder';
import Base64Converter from './pages/tools/Base64Converter';
import PortraitProcessor from './pages/tools/PortraitProcessor';
import LLMChat from './pages/LLMChat';
import Pipeline from './pages/Pipeline';
import DCMetro from './pages/DCMetro';
import NotFound from './pages/NotFound';
import { RouteSeo } from './hooks/useSeo';
import { wipeElement, watchForNewContent } from './utils/wordWipe';
import './styles/App.css';

const routeKey = (location) => location.pathname + location.search;

// Old page wipes out word by word, then the new page wipes in. Later content (loaded data,
// show more, new messages) wipes in as it appears.
function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const rootRef = useRef(null);

  useEffect(() => {
    if (routeKey(location) === routeKey(displayLocation)) return undefined;
    let cancelled = false;
    wipeElement(rootRef.current, 'out').then(() => {
      if (cancelled) return;
      window.scrollTo(0, 0);
      setDisplayLocation(location);
    });
    return () => {
      cancelled = true;
    };
  }, [location, displayLocation]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    root.style.visibility = '';
    const stopWatching = watchForNewContent(root);
    wipeElement(root, 'in');
    return stopWatching;
  }, [displayLocation]);

  return (
    <div ref={rootRef} className="route-root">
      <Routes location={displayLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/article/:id" element={<SingleArticle />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/about" element={<About />} />
        <Route path="/tools/git-commit-generator" element={<GitCommitGenerator />} />
        <Route path="/tools/code-formatter" element={<CodeFormatter />} />
        <Route path="/tools/json-validator" element={<JsonValidator />} />
        <Route path="/tools/password-generator" element={<PasswordGenerator />} />
        <Route path="/tools/2fa-generator" element={<TwoFAGenerator />} />
        <Route path="/tools/qr-generator" element={<QRGenerator />} />
        <Route path="/tools/color-palette" element={<ColorPaletteGenerator />} />
        <Route path="/tools/api-tester" element={<APITester />} />
        <Route path="/tools/regex-builder" element={<RegexBuilder />} />
        <Route path="/tools/base64-converter" element={<Base64Converter />} />
        <Route path="/tools/portrait-processor" element={<PortraitProcessor />} />
        <Route path="/llm-chat" element={<LLMChat />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/dc-metro" element={<DCMetro />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <RouteSeo />
        <Layout>
          <AnimatedRoutes />
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;