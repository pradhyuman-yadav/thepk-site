import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegexBuilder = () => {
  const navigate = useNavigate();
  const [pattern, setPattern] = useState('');
  const [testString, setTestString] = useState('');
  const [flags, setFlags] = useState('g');
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [matchCount, setMatchCount] = useState(0);
  const [replaceWith, setReplaceWith] = useState('');
  const [replacedString, setReplacedString] = useState('');
  const [activeTab, setActiveTab] = useState('tester');
  const [savedRegex, setSavedRegex] = useState(
    JSON.parse(localStorage.getItem('savedRegex')) || []
  );

  const testRegex = () => {
    if (!pattern.trim()) {
      setError('Please enter a regex pattern');
      return;
    }

    if (!testString.trim()) {
      setError('Please enter a test string');
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const foundMatches = [];
      let match;

      if (flags.includes('g')) {
        let matchResult;
        while ((matchResult = regex.exec(testString)) !== null) {
          foundMatches.push({
            text: matchResult[0],
            index: matchResult.index,
            groups: matchResult.slice(1)
          });
        }
      } else {
        match = testString.match(regex);
        if (match) {
          foundMatches.push({
            text: match[0],
            index: match.index || testString.indexOf(match[0]),
            groups: match.slice(1)
          });
        }
      }

      setMatches(foundMatches);
      setMatchCount(foundMatches.length);
      setError(null);
    } catch (err) {
      setError(`Regex Error: ${err.message}`);
      setMatches([]);
      setMatchCount(0);
    }
  };

  const replaceMatches = () => {
    if (!pattern.trim()) {
      setError('Please enter a regex pattern');
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const result = testString.replace(regex, replaceWith);
      setReplacedString(result);
      setError(null);
    } catch (err) {
      setError(`Regex Error: ${err.message}`);
      setReplacedString('');
    }
  };

  const toggleFlag = (flag) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  const loadExample = (example) => {
    setPattern(example.pattern);
    setTestString(example.testString);
    setFlags(example.flags || 'g');
  };

  const saveRegex = () => {
    if (!pattern.trim()) {
      setError('Please enter a pattern before saving');
      return;
    }

    const newRegex = {
      id: Date.now(),
      pattern,
      flags,
      description: `/${pattern}/${flags}`,
      createdAt: new Date().toLocaleString()
    };

    const updated = [newRegex, ...savedRegex];
    setSavedRegex(updated);
    localStorage.setItem('savedRegex', JSON.stringify(updated));
    setError(null);
  };

  const deleteRegex = (id) => {
    const updated = savedRegex.filter(r => r.id !== id);
    setSavedRegex(updated);
    localStorage.setItem('savedRegex', JSON.stringify(updated));
  };

  const loadRegex = (regex) => {
    setPattern(regex.pattern);
    setFlags(regex.flags);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const examples = [
    {
      name: 'Email Address',
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      testString: 'user@example.com',
      flags: 'i'
    },
    {
      name: 'URL',
      pattern: 'https?://[^\\s]+',
      testString: 'Visit https://example.com for more info',
      flags: 'g'
    },
    {
      name: 'Phone Number',
      pattern: '^\\+?1?\\d{9,15}$',
      testString: '+1234567890',
      flags: ''
    },
    {
      name: 'Hex Color Code',
      pattern: '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})',
      testString: 'Use #FF5733 or #F57 for colors',
      flags: 'g'
    },
    {
      name: 'IP Address',
      pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
      testString: 'Server at 192.168.1.1 is active',
      flags: 'g'
    },
    {
      name: 'Username (alphanumeric + underscore)',
      pattern: '^[a-zA-Z0-9_]{3,20}$',
      testString: 'user_name_123',
      flags: ''
    }
  ];

  const flagDescriptions = {
    g: 'Global - Find all matches',
    i: 'Ignore Case - Case insensitive matching',
    m: 'Multiline - ^ and $ match line boundaries',
    s: 'Dot All - . matches newlines',
    u: 'Unicode - Unicode pattern matching'
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
        <h1 className="tool-page-title">Regex Builder</h1>
      </div>

      <div className="tool-content">
        <div className="tool-description">
          <p>
            Build, test, and debug regular expressions with live matching, pattern validation,
            and comprehensive flag options. Save your regex patterns for future use.
          </p>
        </div>

        <div className="regex-builder-container">
          {/* Pattern Input */}
          <div className="pattern-section">
            <h3>Regex Pattern</h3>
            <div className="pattern-input-group">
              <span className="pattern-prefix">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="^[a-z]+@[a-z]+\.[a-z]{2,}$"
                className="pattern-input"
              />
              <span className="pattern-suffix">/</span>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                maxLength="5"
                className="flags-input"
                placeholder="gim"
                title="Flags: g, i, m, s, u"
              />
            </div>

            {/* Flags */}
            <div className="flags-section">
              <p className="flags-label">Flags:</p>
              <div className="flags-grid">
                {Object.entries(flagDescriptions).map(([flag, description]) => (
                  <label key={flag} className="flag-checkbox">
                    <input
                      type="checkbox"
                      checked={flags.includes(flag)}
                      onChange={() => toggleFlag(flag)}
                    />
                    <span className="flag-text">{flag}</span>
                    <span className="flag-description">{description}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="regex-tabs">
            <button
              className={`regex-tab-button ${activeTab === 'tester' ? 'active' : ''}`}
              onClick={() => setActiveTab('tester')}
            >
              Test
            </button>
            <button
              className={`regex-tab-button ${activeTab === 'replace' ? 'active' : ''}`}
              onClick={() => setActiveTab('replace')}
            >
              Replace
            </button>
            <button
              className={`regex-tab-button ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved ({savedRegex.length})
            </button>
            <button
              className={`regex-tab-button ${activeTab === 'examples' ? 'active' : ''}`}
              onClick={() => setActiveTab('examples')}
            >
              Examples
            </button>
          </div>

          {/* Tab Content */}
          <div className="regex-tab-content">
            {activeTab === 'tester' && (
              <div className="tester-section">
                <label htmlFor="test-string">Test String:</label>
                <textarea
                  id="test-string"
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  placeholder="Enter text to test against the regex pattern..."
                  className="test-textarea"
                />
                <button className="test-button" onClick={testRegex}>
                  Test Pattern
                </button>

                {error && (
                  <div className="error-message">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {matchCount > 0 && (
                  <div className="match-results">
                    <div className="result-summary">
                      <span className="match-count">
                        Found {matchCount} match{matchCount !== 1 ? 'es' : ''}
                      </span>
                    </div>

                    <div className="matches-list">
                      {matches.map((match, index) => (
                        <div key={index} className="match-item">
                          <div className="match-info">
                            <span className="match-badge">{index + 1}</span>
                            <span className="match-text">{match.text}</span>
                            <span className="match-position">
                              @ {match.index}
                            </span>
                          </div>
                          {match.groups.length > 0 && (
                            <div className="match-groups">
                              <strong>Groups:</strong>
                              {match.groups.map((group, gIndex) => (
                                <span key={gIndex} className="group-item">
                                  ${gIndex + 1}: {group}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchCount === 0 && testString && !error && (
                  <div className="no-matches">No matches found</div>
                )}
              </div>
            )}

            {activeTab === 'replace' && (
              <div className="replace-section">
                <label htmlFor="test-string-replace">Test String:</label>
                <textarea
                  id="test-string-replace"
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  placeholder="Enter text to search and replace..."
                  className="test-textarea"
                />

                <label htmlFor="replace-with">Replace With:</label>
                <input
                  id="replace-with"
                  type="text"
                  value={replaceWith}
                  onChange={(e) => setReplaceWith(e.target.value)}
                  placeholder="Replacement text (use $1, $2, etc. for groups)"
                  className="replace-input"
                />

                <button className="replace-button" onClick={replaceMatches}>
                  Replace All
                </button>

                {error && (
                  <div className="error-message">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {replacedString && (
                  <div className="replace-result">
                    <div className="result-label">Result:</div>
                    <div className="result-output">
                      <pre>{replacedString}</pre>
                      <button
                        className="copy-result-button"
                        onClick={() => copyToClipboard(replacedString)}
                      >
                        Copy Result
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="saved-section">
                {savedRegex.length === 0 ? (
                  <p className="no-items">No saved regex patterns yet</p>
                ) : (
                  <div className="saved-list">
                    {savedRegex.map((regex) => (
                      <div key={regex.id} className="saved-regex-item">
                        <div className="saved-info">
                          <code className="saved-pattern">{regex.description}</code>
                          <span className="saved-date">{regex.createdAt}</span>
                        </div>
                        <div className="saved-actions">
                          <button
                            className="action-btn load-btn"
                            onClick={() => loadRegex(regex)}
                            title="Load pattern"
                          >
                            Load
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => deleteRegex(regex.id)}
                            title="Delete pattern"
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

            {activeTab === 'examples' && (
              <div className="examples-section">
                <div className="examples-grid">
                  {examples.map((example, index) => (
                    <div key={index} className="example-card">
                      <h4>{example.name}</h4>
                      <code className="example-pattern">{example.pattern}</code>
                      <p className="example-test">
                        <strong>Test:</strong> {example.testString}
                      </p>
                      <button
                        className="load-example-btn"
                        onClick={() => loadExample(example)}
                      >
                        Load Example
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          {pattern && (
            <button className="save-regex-button" onClick={saveRegex}>
              Save Pattern
            </button>
          )}
        </div>

        <div className="tool-info">
          <h3>Regex Builder Features</h3>
          <ul>
            <li><strong>Live Testing:</strong> Test patterns against strings in real-time</li>
            <li><strong>Match Visualization:</strong> See all matches with positions and groups</li>
            <li><strong>Replace Function:</strong> Test regex-based find and replace</li>
            <li><strong>Capture Groups:</strong> View and use captured groups with $1, $2, etc.</li>
            <li><strong>Flag Support:</strong> Global, case-insensitive, multiline, and more</li>
            <li><strong>Pattern Saving:</strong> Save frequently used patterns for quick access</li>
            <li><strong>Example Patterns:</strong> Pre-built patterns for common use cases</li>
            <li><strong>Error Handling:</strong> Clear error messages for invalid patterns</li>
          </ul>
        </div>

        <div className="regex-cheatsheet">
          <h3>Regex Cheatsheet</h3>
          <div className="cheatsheet-grid">
            <div className="cheatsheet-category">
              <h4>Character Classes</h4>
              <ul>
                <li><code>.</code> - Any character except newline</li>
                <li><code>[abc]</code> - a, b, or c</li>
                <li><code>[^abc]</code> - Not a, b, or c</li>
                <li><code>[a-z]</code> - a to z</li>
                <li><code>\d</code> - Digit (0-9)</li>
                <li><code>\w</code> - Word character</li>
                <li><code>\s</code> - Whitespace</li>
              </ul>
            </div>
            <div className="cheatsheet-category">
              <h4>Quantifiers</h4>
              <ul>
                <li><code>*</code> - 0 or more</li>
                <li><code>+</code> - 1 or more</li>
                <li><code>?</code> - 0 or 1</li>
                <li><code>{'{'}'n{'}'}</code> - Exactly n times</li>
                <li><code>{'{'}'n,{'}'}</code> - At least n times</li>
                <li><code>{'{'}'n,m{'}'}</code> - Between n and m times</li>
              </ul>
            </div>
            <div className="cheatsheet-category">
              <h4>Anchors & Boundaries</h4>
              <ul>
                <li><code>^</code> - Start of string</li>
                <li><code>$</code> - End of string</li>
                <li><code>\b</code> - Word boundary</li>
                <li><code>\B</code> - Non-word boundary</li>
              </ul>
            </div>
            <div className="cheatsheet-category">
              <h4>Groups & Alternation</h4>
              <ul>
                <li><code>(abc)</code> - Capture group</li>
                <li><code>(?:abc)</code> - Non-capture group</li>
                <li><code>a|b</code> - a or b</li>
                <li><code>(?&lt;name&gt;abc)</code> - Named capture group</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegexBuilder;