import React from 'react';
import { Link } from 'react-router-dom';
import { INFRA_PATH, INFRA_GROUPS, infraSummary } from '../seo/infrastructure';

// Typeset infrastructure flow: the request path as a column of nodes joined by ink rules, then the
// home server branching into Site and Operations services. Real text, so the word wipe and the
// background fill treat it like any other content. A pulse runs down the rules to show the request
// direction (static under reduced motion).

const NodeName = ({ node }) => {
  if (!node.url) return <span className="infra-name">{node.name}</span>;
  if (node.url.startsWith('/')) {
    return (
      <Link to={node.url} className="infra-name infra-link">
        {node.name}
      </Link>
    );
  }
  return (
    <a href={node.url} className="infra-name infra-link" target="_blank" rel="noopener noreferrer">
      {node.name}
    </a>
  );
};

const Node = ({ node }) => (
  <div className="infra-node">
    <NodeName node={node} />
    <span className="infra-detail">{node.detail}</span>
    {node.access && <span className={`infra-access infra-access--${node.access}`}>{node.access === 'open' ? 'Open' : 'Sign-in'}</span>}
  </div>
);

// A rule between nodes; `data-backdrop-block` keeps background type out of the pulse lane
const Connector = ({ step }) => (
  <span className="infra-connector" style={{ '--step': step }} data-backdrop-block="" aria-hidden="true">
    <span className="infra-pulse" />
  </span>
);

const InfraFlow = () => (
  <figure className="infra-flow" aria-label={`How thepk.in is served: ${infraSummary()}`}>
    <ol className="infra-path">
      {INFRA_PATH.map((node, i) => (
        <li key={node.name} className="infra-step">
          {i > 0 && <Connector step={i} />}
          <Node node={node} />
        </li>
      ))}
    </ol>
    <Connector step={INFRA_PATH.length} />
    <div className="infra-groups">
      {INFRA_GROUPS.map((group) => (
        <section key={group.name} className="infra-group" aria-label={`${group.name} services`}>
          <h3 className="infra-group-name">{group.name}</h3>
          <ul className="infra-group-list">
            {group.nodes.map((node) => (
              <li key={node.name}>
                <Node node={node} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </figure>
);

export default InfraFlow;
