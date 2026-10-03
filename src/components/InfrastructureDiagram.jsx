import React from 'react';

// Animated diagram of how thepk.in is hosted. Colors come from CSS (see .infrastructure-diagram in App.css).
const InfrastructureDiagram = () => {
  // Back wires SVG (static gray template) - Exact layout from flow.svg
  const backWiresSVG = `
    <svg viewBox="0 0 1636.18 2181.34" xmlns="http://www.w3.org/2000/svg">
      <defs>
      </defs>

      <!-- BACK WIRES - Static Gray Template (NO ARROWHEADS) -->

      <!-- Request Originator node (USER/Originator) -->
      <circle cx="881.49" cy="108.05" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="881.49" y="113" text-anchor="middle" font-size="26" font-weight="700" fill="#666" pointer-events="none">USER</text>
      <text x="881.49" y="136" text-anchor="middle" font-size="16" fill="#999" pointer-events="none">Originator</text>

      <!-- Originator to DNS (curved horizontal) -->
      <path d="M 961.49 108.05 Q 1150 100, 1343.12 89.53" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- DNS/GoDaddy node -->
      <circle cx="1423.12" cy="89.53" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="1423.12" y="95" text-anchor="middle" font-size="26" font-weight="700" fill="#666" pointer-events="none">DNS</text>
      <text x="1423.12" y="118" text-anchor="middle" font-size="15" fill="#999" pointer-events="none">GoDaddy</text>

      <!-- Originator to Azure (downward) -->
      <path d="M 881.49 188.05 Q 881.49 320, 872.01 465.72" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Azure Server node (SSL/Proxy) -->
      <circle cx="872.01" cy="545.72" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="872.01" y="550" text-anchor="middle" font-size="26" font-weight="700" fill="#666" pointer-events="none">Azure</text>
      <text x="872.01" y="573" text-anchor="middle" font-size="15" fill="#999" pointer-events="none">SSL/Proxy</text>

      <!-- Azure to Home Server (downward) -->
      <path d="M 872.01 625.72 Q 872.01 800, 870.10 919.70" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Home Server node (hub) -->
      <circle cx="870.10" cy="999.70" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="870.10" y="1004" text-anchor="middle" font-size="26" font-weight="700" fill="#666" pointer-events="none">Home</text>
      <text x="870.10" y="1027" text-anchor="middle" font-size="15" fill="#999" pointer-events="none">Server</text>

      <!-- Service Rows from Home Server - Curved connections -->
      <!-- Service 1 (159.71, 1637.43) - Frontend -->
      <path d="M 790 1020 Q 150 1150, 159.71 1557.43" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Service 2 (352.72, 1637.43) - Backend -->
      <path d="M 800 1039 Q 370 1150, 352.72 1557.43" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Service 3 (550.23, 1641.03) - SLM/LLM -->
      <path d="M 815 1058 Q 550 1360, 550.23 1561.03" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Service 4 (636.81, 2032.45) - Portainer -->
      <path d="M 828 1070 Q 650 1500, 636.81 1952.45" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Service 5 (847.40, 2029.75) - Squidex -->
      <path d="M 870 1080 Q 870 1520, 847.40 1949.75" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Service 6 (1063.85, 2024.33) - n8n -->
      <path d="M 900 1075 Q 1050 1320, 1063.85 1944.33" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Service 7 (1272.19, 2024.33) - Dashboard -->
      <path d="M 930 1056 Q 1250 1200, 1272.19 1944.33" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Service 8 (1474.21, 2026.14) - Excalidraw -->
      <path d="M 948 1025 Q 1450 1150, 1474.21 1946.14" fill="none" stroke-width="4" stroke="#d5d5d5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- PUBLIC SERVICES BOX -->
      <rect x="60" y="1500" width="620" height="240" fill="none" stroke="#d5d5d5" stroke-width="2" stroke-dasharray="8,4" />
      <text x="265" y="1530" text-anchor="middle" font-size="18" font-weight="600" fill="#666" pointer-events="none">PUBLIC</text>

      <!-- Service 1: Frontend - PUBLIC (159.71, 1637.43) -->
      <circle cx="159.71" cy="1637.43" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="159.71" y="1642" text-anchor="middle" font-size="26" font-weight="600" fill="#666" pointer-events="none">Frontend</text>
      <text x="159.71" y="1666" text-anchor="middle" font-size="13" fill="#999" pointer-events="none">React/Vite</text>

      <!-- Service 2: Backend - PRIVATE (352.72, 1637.43) -->
      <circle cx="352.72" cy="1637.43" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="352.72" y="1642" text-anchor="middle" font-size="26" font-weight="600" fill="#666" pointer-events="none">Backend</text>
      <text x="352.72" y="1666" text-anchor="middle" font-size="13" fill="#999" pointer-events="none">API</text>

      <!-- Service 3: SLM/LLM - PUBLIC (550.23, 1641.03) -->
      <circle cx="550.23" cy="1641.03" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="550.23" y="1646" text-anchor="middle" font-size="26" font-weight="600" fill="#666" pointer-events="none">SLM/LLM</text>
      <text x="550.23" y="1670" text-anchor="middle" font-size="13" fill="#999" pointer-events="none">MLOps</text>

      <!-- PRIVATE SERVICES BOX -->
      <rect x="540" y="1890" width="1040" height="240" fill="none" stroke="#d5d5d5" stroke-width="2" stroke-dasharray="8,4" />
      <text x="960" y="1920" text-anchor="middle" font-size="18" font-weight="600" fill="#666" pointer-events="none">PRIVATE</text>

      <!-- Service 4: Portainer - PRIVATE (636.81, 2032.45) -->
      <circle cx="636.81" cy="2032.45" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="636.81" y="2037" text-anchor="middle" font-size="26" font-weight="600" fill="#666" pointer-events="none">Portainer</text>
      <text x="636.81" y="2061" text-anchor="middle" font-size="13" fill="#999" pointer-events="none">Docker Mgmt</text>

      <!-- Service 5: Squidex - PRIVATE (847.40, 2029.75) -->
      <circle cx="847.40" cy="2029.75" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="847.40" y="2034" text-anchor="middle" font-size="26" font-weight="600" fill="#666" pointer-events="none">Squidex</text>
      <text x="847.40" y="2058" text-anchor="middle" font-size="13" fill="#999" pointer-events="none">CMS</text>

      <!-- Service 6: n8n - PRIVATE (1063.85, 2024.33) -->
      <circle cx="1063.85" cy="2024.33" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="1063.85" y="2027" text-anchor="middle" font-size="26" font-weight="600" fill="#666" pointer-events="none">N8N</text>
      <text x="1063.85" y="2058" text-anchor="middle" font-size="13" fill="#999" pointer-events="none">Automation</text>

      <!-- Service 7: Dashboard - PRIVATE (1272.19, 2024.33) -->
      <circle cx="1272.19" cy="2024.33" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="1272.19" y="2029" text-anchor="middle" font-size="26" font-weight="600" fill="#666" pointer-events="none">Dashboard</text>
      <text x="1272.19" y="2053" text-anchor="middle" font-size="13" fill="#999" pointer-events="none">Homer</text>

      <!-- Service 8: Excalidraw - PRIVATE (1474.21, 2026.14) -->
      <circle cx="1474.21" cy="2026.14" r="80" fill="none" stroke="#d5d5d5" stroke-width="2" />
      <text x="1474.21" y="2031" text-anchor="middle" font-size="26" font-weight="600" fill="#666" pointer-events="none">Excalidraw</text>
      <text x="1474.21" y="2055" text-anchor="middle" font-size="13" fill="#999" pointer-events="none">Diagrams</text>
    </svg>
  `;

  // Front wires SVG (animated colored with gradient mask - Exact layout from flow.svg)
  const frontWiresSVG = `
    <svg viewBox="0 0 1636.18 2181.34" xmlns="http://www.w3.org/2000/svg">
      <style>
        @keyframes slideMask {
          0% { y: -100%; }
          100% { y: 100%; }
        }
        .mask-rect {
          animation: slideMask 10s ease-in-out infinite;
        }
      </style>

      <defs>
        <!-- Vertical gradient mask for top-to-bottom spotlight effect -->
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="white" stop-opacity="0" />
          <stop offset="80%" stop-color="white" stop-opacity="1" />
          <stop offset="80%" stop-color="white" stop-opacity="0" />
        </linearGradient>

        <!-- Mask for animated wires -->
        <mask id="gradientMask">
          <rect class="mask-rect" width="100%" height="100%" fill="url(#gradient)" x="0" y="0" />
        </mask>
      </defs>

      <!-- FRONT WIRES - Animated Colored (Only on pipes and node outlines, NO ARROWHEADS) -->

      <!-- Originator to DNS (curved horizontal, animated) -->
      <path d="M 961.49 108.05 Q 1150 100, 1343.12 89.53" fill="none" stroke-width="4" stroke="#4CAF50" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />

      <!-- DNS/GoDaddy node outline (animated) -->
      <circle cx="1423.12" cy="89.53" r="80" fill="none" stroke="#2196F3" stroke-width="2" mask="url(#gradientMask)" />

      <!-- Originator to Azure (downward, animated) -->
      <path d="M 881.49 188.05 Q 881.49 320, 872.01 465.72" fill="none" stroke-width="4" stroke="#FF9800" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />

      <!-- Azure Server node outline (animated) -->
      <circle cx="872.01" cy="545.72" r="80" fill="none" stroke="#FF9800" stroke-width="2" mask="url(#gradientMask)" />

      <!-- Azure to Home Server (downward, animated) -->
      <path d="M 872.01 625.72 Q 872.01 800, 870.10 919.70" fill="none" stroke-width="4" stroke="#2196F3" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />

      <!-- Home Server node outline (animated) -->
      <circle cx="870.10" cy="999.70" r="80" fill="none" stroke="#2196F3" stroke-width="2" mask="url(#gradientMask)" />

      <!-- Service Rows (animated) - Curved connections -->
      <!-- Pipe to Service 1 (Frontend) -->
      <path d="M 790 1020 Q 150 1150, 159.71 1557.43" fill="none" stroke-width="4" stroke="#E91E63" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />
      <!-- Pipe to Service 2 (Backend) -->
      <path d="M 800 1039 Q 370 1150, 352.72 1557.43" fill="none" stroke-width="4" stroke="#9C27B0" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />
      <!-- Pipe to Service 3 (SLM/LLM) -->
      <path d="M 815 1058 Q 550 1360, 550.23 1561.03" fill="none" stroke-width="4" stroke="#3F51B5" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />
      <!-- Pipe to Service 4 (Portainer) -->
      <path d="M 828 1070 Q 650 1500, 636.81 1952.45" fill="none" stroke-width="4" stroke="#00BCD4" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />
      <!-- Pipe to Service 5 (Squidex) -->
      <path d="M 870 1080 Q 870 1520, 847.40 1949.75" fill="none" stroke-width="4" stroke="#2196F3" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />
      <!-- Pipe to Service 6 (n8n) -->
      <path d="M 900 1075 Q 1050 1320, 1063.85 1944.33" fill="none" stroke-width="4" stroke="#673AB7" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />
      <!-- Pipe to Service 7 (Dashboard) -->
      <path d="M 930 1056 Q 1250 1200, 1272.19 1944.33" fill="none" stroke-width="4" stroke="#009688" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />
      <!-- Pipe to Service 8 (Excalidraw) -->
      <path d="M 948 1025 Q 1450 1150, 1474.21 1946.14" fill="none" stroke-width="4" stroke="#4CAF50" stroke-linecap="round" stroke-linejoin="round" mask="url(#gradientMask)" />

      <!-- PUBLIC SERVICES BOX (animated) -->
      <rect x="60" y="1500" width="620" height="240" fill="none" stroke="#4CAF50" stroke-width="2" stroke-dasharray="8,4" mask="url(#gradientMask)" />

      <!-- PRIVATE SERVICES BOX (animated) -->
      <rect x="540" y="1890" width="1040" height="240" fill="none" stroke="#2196F3" stroke-width="2" stroke-dasharray="8,4" mask="url(#gradientMask)" />

      <!-- Service node outlines (animated) -->
      <!-- Frontend -->
      <circle cx="159.71" cy="1637.43" r="80" fill="none" stroke="#E91E63" stroke-width="2" mask="url(#gradientMask)" />
      <!-- Backend -->
      <circle cx="352.72" cy="1637.43" r="80" fill="none" stroke="#9C27B0" stroke-width="2" mask="url(#gradientMask)" />
      <!-- SLM/LLM -->
      <circle cx="550.23" cy="1641.03" r="80" fill="none" stroke="#3F51B5" stroke-width="2" mask="url(#gradientMask)" />
      <!-- Portainer -->
      <circle cx="636.81" cy="2032.45" r="80" fill="none" stroke="#00BCD4" stroke-width="2" mask="url(#gradientMask)" />
      <!-- Squidex -->
      <circle cx="847.40" cy="2029.75" r="80" fill="none" stroke="#2196F3" stroke-width="2" mask="url(#gradientMask)" />
      <!-- n8n -->
      <circle cx="1063.85" cy="2024.33" r="80" fill="none" stroke="#673AB7" stroke-width="2" mask="url(#gradientMask)" />
      <!-- Dashboard -->
      <circle cx="1272.19" cy="2024.33" r="80" fill="none" stroke="#009688" stroke-width="2" mask="url(#gradientMask)" />
      <!-- Excalidraw -->
      <circle cx="1474.21" cy="2026.14" r="80" fill="none" stroke="#4CAF50" stroke-width="2" mask="url(#gradientMask)" />
    </svg>
  `;

  return (
    <div
      className="infrastructure-diagram"
      role="img"
      aria-label="Request flow: user, GoDaddy DNS, Azure SSL proxy, then a home server running public services (frontend, backend API, SLM/LLM) and private services (Portainer, Squidex, n8n, Homer dashboard, Excalidraw)."
    >
      <div className="wire-wrap">
        {/* Back wires - static template */}
        <div className="back-wires-embed" dangerouslySetInnerHTML={{ __html: backWiresSVG }} />
        {/* Front wires - animated sweep, paused under prefers-reduced-motion */}
        <div className="front-wires-embed" dangerouslySetInnerHTML={{ __html: frontWiresSVG }} />
      </div>
    </div>
  );
};

export default InfrastructureDiagram;
