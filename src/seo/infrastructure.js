/**
 * How thepk.in is served, as data. Rendered as a typeset flow on /pipeline (InfraFlow) and as plain
 * HTML for crawlers (server/render.js). `access` is 'open' (reachable without sign-in) or 'sign-in';
 * `url` links out (http) or within the site (path).
 */

// The request path, top to bottom
export const INFRA_PATH = [
  { name: 'Visitor', detail: 'Browser or API client' },
  { name: 'DNS', detail: 'GoDaddy records for thepk.in' },
  { name: 'Edge proxy', detail: 'Azure and Pangolin: SSL, routing', url: 'https://proxy.thepk.in', access: 'open' },
  { name: 'Home server', detail: 'Intel N150 mini PC, every service in Docker' },
];

// What the home server runs, by role
export const INFRA_GROUPS = [
  {
    name: 'Site',
    nodes: [
      { name: 'Frontend', detail: 'React and Vite, this site', url: '/', access: 'open' },
      { name: 'Backend API', detail: 'REST API and LLM proxy', url: 'https://api.thepk.in', access: 'open' },
      { name: 'SLM / LLM', detail: 'Llama 3.2 on Ollama', url: '/llm-chat', access: 'open' },
    ],
  },
  {
    name: 'Operations',
    nodes: [
      { name: 'Portainer', detail: 'Docker management', url: 'https://portainer.thepk.in', access: 'open' },
      { name: 'Squidex', detail: 'Headless CMS', url: 'https://squidex.thepk.in', access: 'open' },
      { name: 'n8n', detail: 'Workflow automation', url: 'https://n8n.thepk.in', access: 'open' },
      { name: 'Dashboard', detail: 'Homer service dashboard', access: 'sign-in' },
      { name: 'Excalidraw', detail: 'Architecture diagrams', access: 'sign-in' },
    ],
  },
];

/** One-line text version of the flow, for alt text and crawlers. */
export const infraSummary = () =>
  `${INFRA_PATH.map((n) => `${n.name} (${n.detail})`).join(', then ')}, which runs ${INFRA_GROUPS.map(
    (g) => `${g.name.toLowerCase()} services: ${g.nodes.map((n) => n.name).join(', ')}`
  ).join('; and ')}.`;
