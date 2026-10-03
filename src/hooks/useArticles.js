import { useState, useEffect } from 'react';
import { fetchSquidexArticles } from '../services/squidexClient';
import { processArticleList } from '../utils/richTextConverter';

// One fetch per page load, shared by Home, Articles, and SingleArticle.
let cached = null;
let inflight = null;

const loadArticles = () => {
  if (cached) return Promise.resolve(cached);
  inflight ??= fetchSquidexArticles()
    .then((raw) => {
      cached = processArticleList(raw);
      return cached;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

/**
 * Processed, categorized articles, newest first.
 * @returns {{articles: Array, loading: Boolean, error: String|null}}
 */
export const useArticles = () => {
  const [state, setState] = useState(() => ({ articles: cached || [], loading: !cached, error: null }));

  useEffect(() => {
    if (cached) return undefined;
    let active = true;
    loadArticles()
      .then((articles) => active && setState({ articles, loading: false, error: null }))
      .catch((err) => active && setState({ articles: [], loading: false, error: err.message }));
    return () => {
      active = false;
    };
  }, []);

  return state;
};
