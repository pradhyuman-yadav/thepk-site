import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const APITester = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [params, setParams] = useState([{ key: '', value: '' }]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [statusCode, setStatusCode] = useState(null);
  const [activeTab, setActiveTab] = useState('headers');
  const [responseTab, setResponseTab] = useState('body');
  const [savedRequests, setSavedRequests] = useState(
    JSON.parse(localStorage.getItem('apiRequests')) || []
  );

  const addHeaderRow = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeaderRow = (index) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const addParamRow = () => {
    setParams([...params, { key: '', value: '' }]);
  };

  const removeParamRow = (index) => {
    setParams(params.filter((_, i) => i !== index));
  };

  const updateParam = (index, field, value) => {
    const newParams = [...params];
    newParams[index][field] = value;
    setParams(newParams);
  };

  const buildUrlWithParams = () => {
    let finalUrl = url;
    const queryParams = params.filter(p => p.key && p.value);

    if (queryParams.length > 0) {
      const queryString = queryParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&');
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
    }

    return finalUrl;
  };

  const buildHeaders = () => {
    const headerObj = {};
    headers.forEach(h => {
      if (h.key && h.value) {
        headerObj[h.key] = h.value;
      }
    });
    return headerObj;
  };

  const sendRequest = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);
    setResponseTime(null);

    try {
      const startTime = performance.now();
      const finalUrl = buildUrlWithParams();
      const requestOptions = {
        method,
        headers: buildHeaders(),
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        try {
          requestOptions.body = body;
        } catch (e) {
          setError('Invalid request body');
          setLoading(false);
          return;
        }
      }

      const res = await fetch(finalUrl, requestOptions);
      const endTime = performance.now();

      const contentType = res.headers.get('content-type');
      let responseData;

      if (contentType && contentType.includes('application/json')) {
        responseData = await res.json();
      } else if (contentType && contentType.includes('text')) {
        responseData = await res.text();
      } else {
        responseData = await res.text();
      }

      setStatusCode(res.status);
      setResponse({
        data: responseData,
        headers: Object.fromEntries(res.headers),
        status: res.status,
        statusText: res.statusText
      });
      setResponseTime((endTime - startTime).toFixed(2));
    } catch (err) {
      setError(err.message || 'Failed to send request. Check URL and CORS settings.');
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (jsonString) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  const saveRequest = () => {
    if (!url.trim()) {
      setError('Please enter a URL before saving');
      return;
    }

    const request = {
      id: Date.now(),
      name: `${method} ${url}`,
      url,
      method,
      headers,
      body,
      params,
      timestamp: new Date().toLocaleString()
    };

    const updated = [request, ...savedRequests];
    setSavedRequests(updated);
    localStorage.setItem('apiRequests', JSON.stringify(updated));
    alert('Request saved successfully!');
  };

  const loadRequest = (req) => {
    setUrl(req.url);
    setMethod(req.method);
    setHeaders(req.headers);
    setBody(req.body);
    setParams(req.params);
  };

  const deleteRequest = (id) => {
    const updated = savedRequests.filter(r => r.id !== id);
    setSavedRequests(updated);
    localStorage.setItem('apiRequests', JSON.stringify(updated));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusColor = (code) => {
    if (code >= 200 && code < 300) return '#4CAF50';
    if (code >= 300 && code < 400) return '#2196F3';
    if (code >= 400 && code < 500) return '#FF9800';
    return '#F44336';
  };

  const loadSampleRequest = (type) => {
    const samples = {
      jsonplaceholder: {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET'
      },
      postData: {
        url: 'https://jsonplaceholder.typicode.com/posts',
        method: 'POST',
        body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }, null, 2)
      },
      github: {
        url: 'https://api.github.com/users/github',
        method: 'GET'
      }
    };

    const sample = samples[type];
    if (sample) {
      setUrl(sample.url);
      setMethod(sample.method);
      if (sample.body) setBody(sample.body);
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
        <h1 className="tool-page-title">API Testing Tool</h1>
      </div>

      <div className="tool-content">
        <div className="tool-description">
          <p>
            Test REST APIs with full support for HTTP methods, headers, parameters, and request bodies.
            Save requests for later use, view detailed responses, and debug your API integrations.
          </p>
        </div>

        <div className="api-tester-container">
          {/* Request Section */}
          <div className="api-request-section">
            <h2>Request</h2>

            {/* URL Bar */}
            <div className="url-bar">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="method-select"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter API URL (e.g., https://api.example.com/users)"
                className="url-input"
              />
              <button
                className="send-button"
                onClick={sendRequest}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            {/* Sample Requests */}
            <div className="sample-requests">
              <button
                className="sample-button"
                onClick={() => loadSampleRequest('jsonplaceholder')}
              >
                Sample GET
              </button>
              <button
                className="sample-button"
                onClick={() => loadSampleRequest('postData')}
              >
                Sample POST
              </button>
              <button
                className="sample-button"
                onClick={() => loadSampleRequest('github')}
              >
                GitHub API
              </button>
            </div>

            {/* Tabs */}
            <div className="api-tabs">
              <button
                className={`tab-button ${activeTab === 'headers' ? 'active' : ''}`}
                onClick={() => setActiveTab('headers')}
              >
                Headers ({headers.filter(h => h.key).length})
              </button>
              <button
                className={`tab-button ${activeTab === 'params' ? 'active' : ''}`}
                onClick={() => setActiveTab('params')}
              >
                Params ({params.filter(p => p.key).length})
              </button>
              <button
                className={`tab-button ${activeTab === 'body' ? 'active' : ''}`}
                onClick={() => setActiveTab('body')}
              >
                Body
              </button>
              <button
                className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                Saved ({savedRequests.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'headers' && (
                <div className="headers-section">
                  <div className="headers-list">
                    {headers.map((header, index) => (
                      <div key={index} className="header-row">
                        <input
                          type="text"
                          placeholder="Header Name"
                          value={header.key}
                          onChange={(e) => updateHeader(index, 'key', e.target.value)}
                          className="header-input"
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={header.value}
                          onChange={(e) => updateHeader(index, 'value', e.target.value)}
                          className="header-input"
                        />
                        <button
                          className="remove-button"
                          onClick={() => removeHeaderRow(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="add-button" onClick={addHeaderRow}>
                    + Add Header
                  </button>
                </div>
              )}

              {activeTab === 'params' && (
                <div className="params-section">
                  <div className="params-list">
                    {params.map((param, index) => (
                      <div key={index} className="param-row">
                        <input
                          type="text"
                          placeholder="Parameter Name"
                          value={param.key}
                          onChange={(e) => updateParam(index, 'key', e.target.value)}
                          className="param-input"
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={param.value}
                          onChange={(e) => updateParam(index, 'value', e.target.value)}
                          className="param-input"
                        />
                        <button
                          className="remove-button"
                          onClick={() => removeParamRow(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="add-button" onClick={addParamRow}>
                    + Add Parameter
                  </button>
                </div>
              )}

              {activeTab === 'body' && (
                <div className="body-section">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Request body (JSON, XML, or plain text)"
                    className="body-textarea"
                    disabled={!['POST', 'PUT', 'PATCH'].includes(method)}
                  />
                  {!['POST', 'PUT', 'PATCH'].includes(method) && (
                    <p className="body-note">Body is only used with POST, PUT, and PATCH methods</p>
                  )}
                  {body && ['POST', 'PUT', 'PATCH'].includes(method) && (
                    <button
                      className="format-button"
                      onClick={() => setBody(formatJson(body))}
                    >
                      Format JSON
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="saved-section">
                  {savedRequests.length === 0 ? (
                    <p className="no-requests">No saved requests yet</p>
                  ) : (
                    <div className="saved-list">
                      {savedRequests.map((req) => (
                        <div key={req.id} className="saved-item">
                          <div className="saved-info">
                            <span className={`method-badge ${req.method}`}>
                              {req.method}
                            </span>
                            <span className="saved-name">{req.name}</span>
                            <span className="saved-time">{req.timestamp}</span>
                          </div>
                          <div className="saved-actions">
                            <button
                              className="action-button load"
                              onClick={() => loadRequest(req)}
                              title="Load request"
                            >
                              Load
                            </button>
                            <button
                              className="action-button delete"
                              onClick={() => deleteRequest(req.id)}
                              title="Delete request"
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

            {/* Save Button */}
            {url && (
              <button className="save-request-button" onClick={saveRequest}>
                Save Request
              </button>
            )}
          </div>

          {/* Response Section */}
          <div className="api-response-section">
            <h2>Response</h2>

            {error && (
              <div className="error-box">
                <strong>Error:</strong> {error}
              </div>
            )}

            {statusCode && (
              <div className="response-meta">
                <div className="status-info">
                  <span className="label">Status Code:</span>
                  <span
                    className="status-code"
                    style={{ color: getStatusColor(statusCode) }}
                  >
                    {statusCode} {response.statusText}
                  </span>
                </div>
                {responseTime && (
                  <div className="time-info">
                    <span className="label">Response Time:</span>
                    <span className="time-value">{responseTime}ms</span>
                  </div>
                )}
                <div className="size-info">
                  <span className="label">Size:</span>
                  <span className="size-value">
                    {JSON.stringify(response.data).length} bytes
                  </span>
                </div>
              </div>
            )}

            {response && (
              <>
                <div className="response-tabs">
                  <button
                    className={`tab-button ${responseTab === 'body' ? 'active' : ''}`}
                    onClick={() => setResponseTab('body')}
                  >
                    Body
                  </button>
                  <button
                    className={`tab-button ${responseTab === 'headers' ? 'active' : ''}`}
                    onClick={() => setResponseTab('headers')}
                  >
                    Headers
                  </button>
                </div>

                {responseTab === 'body' && (
                  <div className="response-body">
                    <pre className="response-content">
                      {typeof response.data === 'object'
                        ? JSON.stringify(response.data, null, 2)
                        : response.data}
                    </pre>
                    <button
                      className="copy-response-button"
                      onClick={() => copyToClipboard(
                        typeof response.data === 'object'
                          ? JSON.stringify(response.data, null, 2)
                          : response.data
                      )}
                    >
                      Copy Response
                    </button>
                  </div>
                )}

                {responseTab === 'headers' && (
                  <div className="response-headers">
                    <table className="headers-table">
                      <tbody>
                        {Object.entries(response.headers).map(([key, value]) => (
                          <tr key={key}>
                            <td className="header-key">{key}</td>
                            <td className="header-value">{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {!response && !error && !statusCode && (
              <div className="empty-response">
                <p>Response will appear here after sending a request</p>
              </div>
            )}
          </div>
        </div>

        <div className="tool-info">
          <h3>API Testing Features</h3>
          <ul>
            <li><strong>HTTP Methods:</strong> GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS</li>
            <li><strong>Headers Management:</strong> Add custom headers for authentication and content negotiation</li>
            <li><strong>Query Parameters:</strong> Build query strings without manual URL editing</li>
            <li><strong>Request Body:</strong> Support for JSON, XML, and plain text payloads</li>
            <li><strong>Response Analysis:</strong> View response body, headers, status code, and timing</li>
            <li><strong>Request History:</strong> Save and load previous requests for quick testing</li>
            <li><strong>JSON Formatting:</strong> Auto-format JSON request bodies for readability</li>
            <li><strong>Sample Requests:</strong> Quick access to popular public APIs for testing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default APITester;