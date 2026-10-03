import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import TopicIndex from '../components/TopicIndex';
import { useArticles } from '../hooks/useArticles';
import { useSeo } from '../hooks/useSeo';
import { getCategory } from '../utils/categorize';
import { formatArticleDate } from '../utils/dates';
import { STATIC_ROUTES } from '../seo/siteMeta';

const PAGE_SIZE = 20;

const ListSkeleton = () => (
  <div aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="article-card skeleton">
        <span className="skeleton-line skeleton-line--title" />
        <span className="skeleton-line skeleton-line--meta" />
        <span className="skeleton-line" />
      </div>
    ))}
  </div>
);

const Articles = () => {
  const { articles, loading, error } = useArticles();
  const [searchParams] = useSearchParams();
  const topicSlug = searchParams.get('topic');
  const [shown, setShown] = useState({ topic: topicSlug, count: PAGE_SIZE });
  const visibleCount = shown.topic === topicSlug ? shown.count : PAGE_SIZE;

  const filtered = topicSlug ? articles.filter((a) => a.categories.some((c) => c.slug === topicSlug)) : articles;
  const topic = topicSlug && filtered.length ? getCategory(topicSlug) : null;

  useSeo(
    topic
      ? {
          title: `${topic.label} AI News`,
          description: `${filtered.length} short briefs about ${topic.label} from Pradhyuman Yadav's daily AI news.`,
          path: '/articles',
          search: `?topic=${topic.slug}`,
        }
      : { ...STATIC_ROUTES['/articles'], path: '/articles' }
  );

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="articles-page">
      <header className="page-header">
        <h1 className="page-title">{topic ? `${topic.label} articles` : 'Articles'}</h1>
        <p className="page-subtitle">
          {loading ? 'Loading articles' : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}`}
          {topic && (
            <>
              {' '}
              in {topic.label}. <Link to="/articles" className="text-link">Show all</Link>
            </>
          )}
        </p>
      </header>

      {articles.length > 0 && (
        <details className="topic-filter" open={Boolean(topicSlug)}>
          <summary>Browse by topic</summary>
          <TopicIndex articles={articles} active={topicSlug} />
        </details>
      )}

      {loading && <ListSkeleton />}
      {error && <p className="state-msg">Articles could not be loaded right now. Please try again in a minute.</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="state-msg">
          No articles in this topic yet. <Link to="/articles" className="text-link">Show all articles</Link>
        </p>
      )}

      <div className="articles-list">
        {visible.map((article) => (
          <article key={article.id} className="article-card">
            <h2 className="article-card-title">
              <Link to={`/article/${article.id}`}>{article.title}</Link>
            </h2>
            <div className="article-card-meta">
              <span>By {article.author}</span>
              <time dateTime={new Date(article.publishDate).toISOString()}>{formatArticleDate(article.publishDate)}</time>
              <span>{article.readingTime} min read</span>
            </div>
            <p className="article-card-excerpt">{article.summary}</p>
            <ul className="article-card-tags" aria-label="Topics">
              {article.categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/articles?topic=${c.slug}`} className="art-tag">{c.label}</Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {filtered.length > visibleCount && (
        <p className="articles-more">
          <button
            type="button"
            className="text-button"
            onClick={() => setShown({ topic: topicSlug, count: visibleCount + PAGE_SIZE })}
          >
            Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
          </button>
        </p>
      )}
    </div>
  );
};

export default Articles;
