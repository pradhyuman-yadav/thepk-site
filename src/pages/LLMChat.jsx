import React, { useState, useEffect, useRef, useCallback } from 'react';

const LLMChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm an AI assistant powered by a locally deployed open-source SLM/LLM. I can help you with various tasks. Feel free to ask me anything!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const messagesBoxRef = useRef(null);

  const BACKEND_URL = 'https://api.thepk.in';
  const API_KEY = 'your-secure-api-key-change-this-in-production';

  useEffect(() => {
    const init = async () => {
      await checkBackendHealth();
      await fetchModels();
    };
    init();
  }, []);

  useEffect(() => {
    if (messagesBoxRef.current) {
      messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (!response.ok) throw new Error('Backend service is not available');
    } catch {
      setError('Warning: Backend service may not be available.');
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/llm/models`, {
        headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        throw new Error(`${response.status} ${JSON.stringify(d.detail || '')}`);
      }
      const data = await response.json();
      if (!data.models || !Array.isArray(data.models)) throw new Error('Invalid models response');
      if (data.models.length === 0) throw new Error('No models available. Ensure Ollama is running.');
      setModels(data.models);
      setSelectedModel(data.models[0].name);
      setError('');
    } catch (err) {
      setError('Failed to load models: ' + err.message);
    }
  };

  const processStreamLine = useCallback((line, onText) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) return;
    if (trimmed.startsWith('data: ')) {
      try {
        const data = JSON.parse(trimmed.slice(6));
        if (data.done === true) return;
        if (data.text) onText(data.text);
        else if (typeof data === 'string') onText(data);
      } catch {
        // ignore malformed lines
      }
    }
  }, []);

  const handleStreamingResponse = async (messageId, prompt) => {
    const response = await fetch(`${BACKEND_URL}/api/llm/stream`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selectedModel, prompt, stream: true })
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`HTTP ${response.status}: ${txt || 'Stream failed'}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    const assistantMsg = { id: messageId + 1, role: 'assistant', content: '', timestamp: new Date() };
    setMessages(prev => [...prev, assistantMsg]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) {
          buffer.split('\n').forEach(line => processStreamLine(line, t => {
            fullText += t;
            setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: fullText } : m));
          }));
        }
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      lines.forEach(line => processStreamLine(line, t => {
        fullText += t;
        setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: fullText } : m));
      }));
    }

    const final = decoder.decode();
    if (final) {
      (buffer + final).split('\n').forEach(line => processStreamLine(line, t => {
        fullText += t;
        setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: fullText } : m));
      }));
    }
  };

  const handleNonStreamingResponse = async (messageId, prompt) => {
    const response = await fetch(`${BACKEND_URL}/api/llm/generate`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selectedModel, prompt, stream: false })
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`HTTP ${response.status}: ${txt || 'Generate failed'}`);
    }
    const data = await response.json();
    let responseText = '';
    if (typeof data === 'string') responseText = data;
    else if (data.text) responseText = data.text;
    else if (data.response) responseText = data.response;
    else if (data.generated_text) responseText = data.generated_text;
    else if (data.content) responseText = data.content;
    else {
      const first = Object.values(data).find(v => typeof v === 'string');
      responseText = first || JSON.stringify(data);
    }
    if (!responseText.trim()) throw new Error('Empty response from model');
    setMessages(prev => [...prev, { id: messageId + 1, role: 'assistant', content: responseText, timestamp: new Date() }]);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedModel || isLoading) return;

    const prompt = inputValue.trim();
    setMessages(prev => [...prev, { id: prev.length + 1, role: 'user', content: prompt, timestamp: new Date() }]);
    setInputValue('');
    setIsLoading(true);
    setError('');

    try {
      if (isStreaming) {
        await handleStreamingResponse(messages.length + 1, prompt);
      } else {
        await handleNonStreamingResponse(messages.length + 1, prompt);
      }
    } catch (err) {
      setError('Error: ' + err.message);
      setMessages(prev => [...prev, { id: prev.length + 1, role: 'assistant', content: `Error: ${err.message}`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="llm-chat-page">
      <header className="page-header">
        <h1 className="page-title">AI Chat</h1>
        <p className="page-subtitle">Locally deployed SLM/LLM, an MLOps showcase</p>
      </header>

      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="chat-sidebar-section">
            <label className="chat-label" htmlFor="model-select">Model</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="model-select"
            >
              {models.map(model => (
                <option key={model.name} value={model.name}>{model.name}</option>
              ))}
            </select>
          </div>

          <div className="chat-sidebar-section">
            <label className="chat-label">
              <input
                type="checkbox"
                checked={isStreaming}
                onChange={(e) => setIsStreaming(e.target.checked)}
                style={{ marginRight: '.4rem' }}
              />
              Streaming Response
            </label>
          </div>

          <div className="chat-sidebar-section">
            <h3 className="chat-sidebar-heading">MLOps Skills</h3>
            <ul className="chat-sidebar-list">
              <li>Model serving &amp; inference optimization</li>
              <li>Streaming &amp; non-streaming responses</li>
              <li>API authentication &amp; security</li>
              <li>Error handling &amp; resilience</li>
            </ul>
          </div>

          <div className="chat-sidebar-section">
            <h3 className="chat-sidebar-heading">Hardware</h3>
            <p className="chat-sidebar-body">AZW MINI S Mini PC</p>
            <ul className="chat-sidebar-list">
              <li><strong>CPU:</strong> Intel N150 (4c, 3.6 GHz)</li>
              <li><strong>RAM:</strong> 16 GB DDR4</li>
              <li><strong>Storage:</strong> 512 GB SSD</li>
            </ul>
          </div>
        </div>

        <div className="chat-main">
          {error && (
            <div className="chat-error-banner">
              <p>{error}</p>
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          <div className="messages-box" ref={messagesBoxRef}>
            {messages.map(message => (
              <div key={message.id} className={`msg msg-${message.role}`}>
                <div className="msg-bubble">{message.content}</div>
                <span className="msg-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="msg msg-assistant">
                <div className="msg-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="chat-form">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="chat-input-field"
              disabled={isLoading || models.length === 0}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={isLoading || !inputValue.trim() || models.length === 0}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LLMChat;
