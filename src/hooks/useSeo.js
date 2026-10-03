import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { STATIC_ROUTES, SITE_NAME, pageTitle, canonicalUrl } from '../seo/siteMeta';

const setMeta = (attr, key, value) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
};

const setCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/**
 * Keep the document title, description, canonical, and social tags in sync after client-side navigation.
 * The server writes the same tags into the first HTML response (server/index.js).
 * @param {{title?: String, description?: String, path: String, search?: String, type?: String}} seo
 *   Pass null to skip (for example while data is loading).
 */
export const useSeo = (seo) => {
  const key = seo ? JSON.stringify(seo) : '';

  useEffect(() => {
    if (!key) return;
    const { title, description, path, search = '', type = 'website' } = JSON.parse(key);
    const fullTitle = pageTitle(title);
    const url = canonicalUrl(path, search);

    document.title = fullTitle;
    setCanonical(url);
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('name', 'twitter:title', fullTitle);
  }, [key]);
};

/**
 * Applies STATIC_ROUTES meta on navigation. Render it before <Routes> so page-level useSeo calls run after it.
 */
export const RouteSeo = () => {
  const { pathname } = useLocation();
  const route = STATIC_ROUTES[pathname];
  useSeo(route ? { ...route, path: pathname } : null);
  return null;
};
