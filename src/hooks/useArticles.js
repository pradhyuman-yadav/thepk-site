import { useState, useEffect } from 'react';
import { fetchSquidexArticles } from '../services/squidexClient';
import { processArticleList } from '../utils/richTextConverter';

// The production server inlines a compact article list (bodies omitted except the article being
// viewed) as window.__INITIAL_ARTICLES__, so the first page renders without a CMS round trip.
// The full list is then fetched once in the background and shared by every page.
let cached = null;
let full = false;
let inflight = null;
let initialised = false;

const ensureInitial = () => {
  if (initialised) return;
  initialised = true;
  if (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_ARTICLES__)) cached = window.__INITIAL_ARTICLES__;
};

const loadFullArticles = () => {
  inflight ??= fetchSquidexArticles()
    .then((raw) => {
      cached = processArticleList(raw);
      full = true;
      return cached;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

/** Test helper: forget cached articles so each test starts from a clean state. */
export const resetArticlesCache = () => {
  cached = null;
  full = false;
  inflight = null;
  initialised = false;
};

/**
 * Processed, categorized articles, newest first.
 * `complete` is false while only the inlined list (without most bodies) is available.
 * @returns {{articles: Array, loading: Boolean, error: String|null, complete: Boolean}}
 */
export const useArticles = () => {
  const [state, setState] = useState(() => {
    ensureInitial();
    return { articles: cached || [], loading: !cached, error: null, complete: full };
  });

  useEffect(() => {
    if (full) {
      if (!state.complete) setState({ articles: cached, loading: false, error: null, complete: true });
      return undefined;
    }
    let active = true;
    loadFullArticles()
      .then((articles) => active && setState({ articles, loading: false, error: null, complete: true }))
      .catch((err) => {
        if (!active) return;
        // Keep showing the inlined list if the CMS is unreachable
        setState((prev) => ({ ...prev, loading: false, error: prev.articles.length ? null : err.message, complete: true }));
      });
    return () => {
      active = false;
    };
    // Runs once per mount; later mounts read the shared cache
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
};
