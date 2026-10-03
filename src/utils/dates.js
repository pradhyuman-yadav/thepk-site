// Articles publish late evening US Pacific time, so dates are shown in the author's timezone.
// A fixed zone also keeps the server-rendered HTML and the browser in agreement.
const SITE_TIME_ZONE = 'America/Los_Angeles';

/**
 * Article date as "September 21, 2026".
 * @param {String|Date} value
 * @returns {String}
 */
export const formatArticleDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: SITE_TIME_ZONE })
    : '';
