import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useArticles } from '../hooks/useArticles';
import { useSeo } from '../hooks/useSeo';
import { relatedArticles } from '../utils/categorize';
import { formatArticleDate } from '../utils/dates';
import { clampDescription } from '../seo/siteMeta';

const ArticleSkeleton = () => (
  <div className="article-display skeleton" aria-hidden="true">
    <span className="skeleton-line skeleton-line--title" />
    <span className="skeleton-line skeleton-line--title short" />
    <span className="skeleton-line skeleton-line--meta" />
    {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="skeleton-line" />)}
  </div>
);

const Breadcrumb = ({ section }) => (
  <nav className="breadcrumb" aria-label="Breadcrumb">
    <ol>
      <li><Link to="/">Home</Link></li>
      <li><Link to="/articles">Articles</Link></li>
      {section && <li><Link to={`/articles?topic=${section.slug}`}>{section.label}</Link></li>}
    </ol>
  </nav>
);

const SingleArticle = () => {
  const { id } = useParams();
  const { articles, loading, error } = useArticles();
  const article = articles.find((a) => a.id === id);
  const section = article && (article.categories.find((c) => c.kind === 'topic') || article.categories[0]);
  const related = article ? relatedArticles(article, articles) : [];

  useSeo(
    article
      ? { title: article.title, description: clampDescription(article.summary), path: `/article/${article.id}`, type: 'article' }
      : null
  );

  if (loading) {
    return (
      <div className="single-article-page">
        <Breadcrumb />
        <ArticleSkeleton />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="single-article-page">
        <Breadcrumb />
        <p className="state-msg">
          {error ? 'This article could not be loaded right now.' : 'This article does not exist or was removed.'}{' '}
          <Link to="/articles" className="text-link">Browse all articles</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="single-article-page">
      <Breadcrumb section={section} />

      <article className="article-display">
        {article.featuredImage && (
          <figure className="article-featured-image">
            <img src={article.featuredImage} alt="" />
          </figure>
        )}

        <header className="art-header">
          <h1 className="art-title">{article.title}</h1>
          <div className="art-meta">
            <span>By <Link to="/about" rel="author">{article.author}</Link></span>
            <time dateTime={new Date(article.publishDate).toISOString()}>{formatArticleDate(article.publishDate)}</time>
            <span>{article.readingTime} min read</span>
          </div>
          {article.excerpt && <p className="art-excerpt">{article.excerpt}</p>}
        </header>

        <div className="art-body article-content" dangerouslySetInnerHTML={{ __html: article.content }} />

        <footer className="art-footer">
          <p className="art-filed">
            Filed under{' '}
            {article.categories.map((c, i) => (
              <React.Fragment key={c.slug}>
                {i > 0 && ', '}
                <Link to={`/articles?topic=${c.slug}`} className="text-link">{c.label}</Link>
              </React.Fragment>
            ))}
          </p>
          {article.lastModified && (
            <p className="art-updated">Last updated {formatArticleDate(article.lastModified)}</p>
          )}
        </footer>
      </article>

      {related.length > 0 && (
        <section className="related-articles" aria-labelledby="related-heading">
          <h2 id="related-heading" className="section-heading">Related articles</h2>
          <ul className="home-more">
            {related.map((a) => (
              <li key={a.id} className="home-more-item">
                <Link to={`/article/${a.id}`} className="home-more-title">{a.title}</Link>
                <time dateTime={new Date(a.publishDate).toISOString()} className="home-more-date">
                  {formatArticleDate(a.publishDate)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default SingleArticle;
