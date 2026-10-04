/**
 * Site-wide SEO metadata, shared by the React app (src/hooks/useSeo.js) and the Node server (server/index.js).
 */

export const SITE_URL = 'https://thepk.in';
export const SITE_NAME = 'Pradhyuman Yadav';
export const DEFAULT_TITLE = 'Pradhyuman Yadav: AI/Software Engineer';
export const DEFAULT_DESCRIPTION =
  'Daily AI news briefs, developer tools, and notes on self-hosted AI infrastructure by Pradhyuman Yadav, AI/Software Engineer.';

export const PERSON = {
  name: 'Pradhyuman Yadav',
  jobTitle: 'AI/Software Engineer',
  url: `${SITE_URL}/about`,
  sameAs: ['https://www.linkedin.com/in/pradhyuman-yadav/', 'https://github.com/pradhyuman-yadav'],
};

// Primary nav, in display order. Labels are the public nav labels.
export const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/articles', label: 'Articles' },
  { path: '/tools', label: 'Tools' },
  { path: '/about', label: 'About Me' },
  { path: '/llm-chat', label: 'AI Chat (SLM)' },
  { path: '/pipeline', label: 'Pipeline' },
  { path: '/dc-metro', label: 'DC Metro' },
];

// Public (unprotected) self-hosted services, listed on /pipeline, in its server HTML and in llms.txt.
// Sign-in-protected services (docuseal, excalidraw, home, lightllm) are intentionally not listed.
export const SERVICES = [
  { name: 'API', url: 'https://api.thepk.in', description: 'Backend REST API for the site, including the self-hosted LLM endpoints behind AI Chat.' },
  { name: 'DC Metro', url: 'https://dc-metro.thepk.in', description: 'Real-time Washington DC Metro transit information.' },
  { name: 'n8n', url: 'https://n8n.thepk.in', description: 'Low-code workflow automation: event-driven triggers and multi-service integrations.' },
  { name: 'Portainer', url: 'https://portainer.thepk.in', description: 'Docker container management for the home server: monitoring, images, volumes and stack deployments.' },
  { name: 'Proxy', url: 'https://proxy.thepk.in', description: 'Reverse proxy that routes the thepk.in subdomains and terminates SSL.' },
  { name: 'Squidex', url: 'https://squidex.thepk.in', description: 'Headless CMS that stores the articles and the About page content.' },
];

// Meta for every static route. Article and topic pages build theirs from CMS data.
export const STATIC_ROUTES = {
  '/': { title: '', description: DEFAULT_DESCRIPTION },
  '/articles': {
    title: 'AI News Articles',
    description: 'Short daily briefs on AI models, research, funding, policy, and infrastructure, organized by company and topic.',
  },
  '/tools': {
    title: 'Developer Tools and Projects',
    description: 'Free browser-based developer tools (regex builder, JSON validator, API tester, Base64 converter, QR and password generators) and past projects.',
  },
  '/about': {
    title: 'About Pradhyuman Yadav',
    description: 'Pradhyuman Yadav is an AI/Software Engineer building LLM applications, backend systems, and self-hosted AI infrastructure.',
  },
  '/llm-chat': {
    title: 'AI Chat with a Self-Hosted Language Model',
    description: 'Chat with Llama 3.2 running on a self-hosted home server through Ollama, with streaming responses.',
  },
  '/pipeline': {
    title: 'Self-Hosted Infrastructure Pipeline',
    description: 'How thepk.in is served: DNS, an Azure reverse proxy, and a containerized home server running the frontend, API, and a local LLM.',
  },
  '/dc-metro': {
    title: 'DC Metro Real-Time Transit',
    description: 'Real-time Washington DC Metro transit information.',
  },
  '/privacy': {
    title: 'App Privacy Policy',
    description: 'Privacy policy for the apps and games published by Pradhyuman Yadav: what each app stores, what it sends, and how to reach me.',
  },
  '/tools/git-commit-generator': { title: 'Git Commit Message Generator', description: 'Turn a plain description of your changes into a clear git commit message.' },
  '/tools/code-formatter': { title: 'Code Formatter', description: 'Format and beautify JavaScript, Python, HTML, and CSS in the browser.' },
  '/tools/api-tester': { title: 'API Tester', description: 'Send REST requests with custom headers, query parameters, and bodies, and inspect status, timing, and response.' },
  '/tools/regex-builder': { title: 'Regex Builder and Tester', description: 'Build and test regular expressions with live matches, capture groups, replace, and a cheatsheet.' },
  '/tools/json-validator': { title: 'JSON Validator', description: 'Validate, format, and minify JSON in the browser.' },
  '/tools/base64-converter': { title: 'Base64 Encoder and Decoder', description: 'Encode and decode Base64 text and images, including URL-safe Base64.' },
  '/tools/color-palette': { title: 'Color Palette Generator', description: 'Generate complementary, analogous, triadic, and monochromatic palettes and export them as CSS, JSON, or PNG.' },
  '/tools/password-generator': { title: 'Password Generator', description: 'Generate strong random passwords locally in the browser.' },
  '/tools/2fa-generator': { title: '2FA Code Generator', description: 'Generate TOTP two-factor codes from a secret key in the browser.' },
  '/tools/qr-generator': { title: 'QR Code Generator', description: 'Create QR codes for links, text, contacts, and WiFi credentials.' },
  '/tools/portrait-processor': { title: 'Portrait Background Processor', description: 'Replace a portrait background with a solid color, gradient, or blur and export JPEG or PNG.' },
};

/**
 * Full document title for a page title.
 * @param {String} title - Page title, empty for the home page
 */
export const pageTitle = (title) => (title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE);

/**
 * Shorten text for a meta description (about 160 characters, cut at a word boundary).
 */
export const clampDescription = (text, max = 160) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 3);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:]$/, '')}...`;
};

/**
 * Absolute canonical URL for a path and optional query string.
 */
export const canonicalUrl = (path, search = '') => `${SITE_URL}${path === '/' ? '/' : path}${search}`;
