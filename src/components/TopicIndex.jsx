import React from 'react';
import { Link } from 'react-router-dom';
import { countCategories } from '../utils/categorize';

/**
 * Topic links grouped into Companies and Topics, with article counts.
 * @param {{articles: Array, active?: String}} props - active is the selected topic slug, if any
 */
const TopicIndex = ({ articles, active }) => {
  const counts = countCategories(articles);
  const groups = [
    { label: 'Companies', items: counts.filter((c) => c.kind === 'company') },
    { label: 'Topics', items: counts.filter((c) => c.kind === 'topic') },
  ].filter((g) => g.items.length);

  return (
    <nav className="topic-index" aria-label="Article topics">
      {groups.map((group) => (
        <div key={group.label} className="topic-group">
          <h3 className="topic-group-label">{group.label}</h3>
          <ul className="topic-list">
            {group.items.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/articles?topic=${c.slug}`}
                  className={`topic-link${active === c.slug ? ' active' : ''}`}
                  aria-current={active === c.slug ? 'page' : undefined}
                >
                  {c.label} <span className="topic-count">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export default TopicIndex;
