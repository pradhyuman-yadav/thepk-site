import React from 'react';
import InfraFlow from '../components/InfraFlow';
import { SERVICES } from '../seo/siteMeta';

const Pipeline = () => {
  const cards = [
    { label: 'User / Client', value: 'End user accessing the platform via browser or API client. Requests flow through the entire infrastructure.' },
    { label: 'DNS: GoDaddy', value: 'Manages DNS records for thepk.in. Routes traffic to Azure endpoints, handles global propagation.' },
    { label: 'Azure + Pangolin', value: 'SSL termination, reverse proxy, DDoS protection, CORS headers, rate limiting, failover routing.' },
    { label: 'Home Server', value: 'AZW MINI S Mini PC with an Intel N150 (4c, 3.6 GHz), 16 GB DDR4, 512 GB SSD. All services containerized.' },
    { label: 'Frontend: React/Vite', value: 'React 19 + Vite 7, React Router v7, responsive CSS, A4 design, dark mode, Squidex CMS integration.' },
    { label: 'Backend: REST API', value: 'API server with Squidex OAuth2 flow, API key auth, LLM proxy, rich text conversion, error handling.' },
    { label: 'SLM/LLM: MLOps', value: 'Llama 3.2 via Ollama. Streaming + non-streaming modes. Optimized for Intel N150 edge inference.' },
    { label: 'Portainer', value: 'Docker container management: real-time monitoring, image/volume management, stack deployments.' },
    { label: 'Squidex CMS', value: 'Headless CMS with GraphQL & REST APIs, content versioning, OAuth2 client credentials, multi-tenancy.' },
    { label: 'n8n Automation', value: 'Low-code workflow automation: event-driven triggers, multi-service integration, custom nodes.' },
    { label: 'Dashboard: Homer', value: 'Unified service dashboard for quick-access links, health status, and internal operations overview.' },
    { label: 'Excalidraw', value: 'Collaborative architecture diagrams, whiteboarding, multi-format export, version control for designs.' },
  ];

  const skills = [
    'Architecture Design', 'Docker & Containers', 'SSL/TLS Security', 'Reverse Proxy',
    'Cloud (Azure)', 'Self-Hosting', 'DNS Management', 'Performance',
    'ML Deployment', 'API Integration', 'Monitoring', 'Full-Stack Dev',
  ];

  return (
    <div className="pipeline-page">
      <header className="page-header">
        <h1 className="page-title">Infrastructure Pipeline</h1>
        <p className="page-subtitle">Vertical data flow through a distributed platform: DevOps &amp; hosting architecture</p>
      </header>

      <div className="pipeline-content">
        <InfraFlow />

        <h2 className="section-header">Services</h2>
        <div className="pipeline-cards-grid">
          {cards.map((card, i) => (
            <div key={i} className="info-card-np">
              <div className="info-card-label">{card.label}</div>
              <div className="info-card-value">{card.value}</div>
            </div>
          ))}
        </div>

        <h2 className="section-header" id="live-services">Live services</h2>
        <ul className="service-list">
          {SERVICES.map((s) => (
            <li key={s.url} className="service-item">
              <a href={s.url} className="service-name" target="_blank" rel="noopener noreferrer">
                {s.name}
              </a>
              <span className="service-host">{s.url.replace('https://', '')}</span>
              <p className="service-desc">{s.description}</p>
            </li>
          ))}
        </ul>

        <h2 className="section-header newspaper-section-header">Skills Demonstrated</h2>
        <div className="pipeline-skills-grid">
          {skills.map((skill, i) => (
            <div key={i} className="ps-item">{skill}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pipeline;
