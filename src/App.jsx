import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import './styles/App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <RouteSeo />
        <Layout>
          <Routes>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;