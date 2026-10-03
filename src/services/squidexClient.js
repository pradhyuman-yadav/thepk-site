/**
 * Squidex client shared by the browser bundle and the Node server (server/index.js).
 * Keep this file free of React and DOM APIs so both runtimes can import it.
 */

// Vite replaces import.meta.env at build time; in Node it is undefined, so fall back to process.env.
const viteEnv = import.meta.env || {};
const nodeEnv = globalThis.process?.env || {};
const readEnv = (key) => viteEnv[key] || nodeEnv[key];

export const SQUIDEX_APP_NAME = 'platform';
export const SQUIDEX_CLIENT_ID = readEnv('VITE_SQUIDEX_CLIENT_ID') || 'platform:platform-cms';
export const SQUIDEX_CLIENT_SECRET = readEnv('VITE_SQUIDEX_CLIENT_SECRET') || '4tcz1yi7yusapvyyuqfiqjdodgkqxiiyoxafkcyapkgx';
export const SQUIDEX_URL = readEnv('VITE_SQUIDEX_URL') || 'https://squidex.thepk.in';

// In-memory token cache
let _tokenCache = null;
let _tokenExpiry = 0;

// Get access token from Squidex (cached)
export const getSquidexToken = async () => {
  const now = Date.now();
  if (_tokenCache && now < _tokenExpiry) return _tokenCache;

  const response = await fetch(`${SQUIDEX_URL}/identity-server/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SQUIDEX_CLIENT_ID,
      client_secret: SQUIDEX_CLIENT_SECRET,
      scope: 'squidex-api',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText}. Response: ${errorText}`);
  }

  const data = await response.json();
  _tokenCache = data.access_token;
  _tokenExpiry = now + (data.expires_in - 60) * 1000;
  return _tokenCache;
};

// Fetch raw articles from the Squidex "blog" schema
export const fetchSquidexArticles = async () => {
  const token = await getSquidexToken();
  const response = await fetch(`${SQUIDEX_URL}/api/content/${SQUIDEX_APP_NAME}/blog`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}. Response: ${errorText}`);
  }

  const data = await response.json();
  return data.items || [];
};
