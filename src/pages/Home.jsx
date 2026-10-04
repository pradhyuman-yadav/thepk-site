import React from 'react';
import { Link } from 'react-router-dom';
import TopicIndex from '../components/TopicIndex';
import { useArticles } from '../hooks/useArticles';
import { formatArticleDate } from '../utils/dates';

// Hero copy. Keep in sync with HOME_HEADLINE / HOME_SUBTEXT in server/render.js.
const HEADLINE = 'Daily AI news briefs';
const SUBTEXT = 'Short briefs on AI models, research, funding, and policy, written by Pradhyuman Yadav, AI/Software Engineer.';
const MORE_COUNT = 6;

const LeadSkeleton = () => (
  <div className="home-lead skeleton" aria-hidden="true">
    <span className="skeleton-line skeleton-line--title" />
    <span className="skeleton-line skeleton-line--title short" />
    <span className="skeleton-line skeleton-line--meta" />
    <span className="skeleton-line" />
    <span className="skeleton-line" />
  </div>
);

const Home = () => {
  const { articles, loading, error } = useArticles();
  const [lead, ...rest] = articles;
  const more = rest.slice(0, MORE_COUNT);

  return (
    <div className="home-page">
      <header className="page-header home-masthead">
        <h1 className="page-title">{HEADLINE}</h1>
        <p className="page-subtitle">{SUBTEXT}</p>
      </header>

      <section className="home-section" aria-labelledby="latest-heading">
        <h2 id="latest-heading" className="visually-hidden">Latest article</h2>
        {loading && <LeadSkeleton />}
        {error && (
          <p className="state-msg">
            Articles could not be loaded right now. <Link to="/articles" className="text-link">Try the article index</Link>.
          </p>
        )}
        {!loading && !error && !lead && <p className="state-msg">No articles published yet.</p>}
        {lead && (
          <article className="home-lead">
            <h3 className="home-lead-title">
              <Link to={`/article/${lead.id}`}>{lead.title}</Link>
            </h3>
            <div className="art-meta">
              <span>By {lead.author}</span>
              <time dateTime={new Date(lead.publishDate).toISOString()}>{formatArticleDate(lead.publishDate)}</time>
              <span>{lead.readingTime} min read</span>
            </div>
            <p className="home-lead-summary">{lead.summary}</p>
            <Link to={`/article/${lead.id}`} className="text-link home-lead-cta">Read article</Link>
          </article>
        )}
      </section>

      {more.length > 0 && (
        <section className="home-section" aria-labelledby="more-heading">
          <h2 id="more-heading" className="section-heading">More articles</h2>
          <ol className="home-more">
            {more.map((a) => (
              <li key={a.id} className="home-more-item">
                <Link to={`/article/${a.id}`} className="home-more-title">{a.title}</Link>
                <time dateTime={new Date(a.publishDate).toISOString()} className="home-more-date">
                  {formatArticleDate(a.publishDate)}
                </time>
              </li>
            ))}
          </ol>
          <p className="home-all">
            <Link to="/articles" className="text-link">All articles ({articles.length})</Link>
          </p>
        </section>
      )}

      {articles.length > 0 && (
        <section className="home-section" aria-labelledby="topics-heading">
          <h2 id="topics-heading" className="section-heading">Browse by topic</h2>
          <TopicIndex articles={articles} />
        </section>
      )}

    </div>
  );
};

export default Home;
