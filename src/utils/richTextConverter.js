/**
 * Utility functions for converting Squidex rich text format to HTML
 * This module provides reusable functions for converting complex rich text
 * content objects to properly formatted HTML
 */

import { SQUIDEX_URL, SQUIDEX_APP_NAME } from '../services/squidexClient.js';
import { categorizeArticle } from './categorize.js';

/**
 * Converts a rich text content object to HTML string
 * @param {Object|String} contentObj - The rich text object or string to convert
 * @returns {String} HTML representation of the content
 */
export const convertRichTextToHTML = (contentObj) => {
  if (typeof contentObj === 'string') return contentObj;
  if (!contentObj || typeof contentObj !== 'object') return '';

  if (contentObj.iv) {
    return convertRichTextToHTML(contentObj.iv);
  }

  if (contentObj.type === 'doc' && contentObj.content) {
    return contentObj.content.map(convertNodeToHTML).join('');
  }

  return '';
};

/**
 * Converts a single rich text node to HTML
 * @param {Object} node - The node to convert
 * @returns {String} HTML representation of the node
 */
export const convertNodeToHTML = (node) => {
  if (!node || !node.type) return '';

  switch (node.type) {
    case 'paragraph': {
      const paragraphContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      return `<p>${paragraphContent}</p>`;
    }

    case 'text': {
      let text = node.text || '';
      if (node.marks) {
        node.marks.forEach(mark => {
          switch (mark.type) {
            case 'bold':
              text = `<strong>${text}</strong>`;
              break;
            case 'italic':
              text = `<em>${text}</em>`;
              break;
            case 'underline':
              text = `<u>${text}</u>`;
              break;
            case 'code':
              text = `<code>${text}</code>`;
              break;
            case 'link':
              text = `<a href="${mark.attrs?.href || '#'}" target="_blank" rel="noopener noreferrer">${text}</a>`;
              break;
            default:
              // Handle other mark types gracefully
              break;
          }
        });
      }
      return text;
    }

    case 'bulletList': {
      const listItems = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      return `<ul>${listItems}</ul>`;
    }

    case 'orderedList': {
      const orderedItems = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      return `<ol>${orderedItems}</ol>`;
    }

    case 'listItem': {
      const itemContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      return `<li>${itemContent}</li>`;
    }

    case 'heading': {
      const headingContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      const level = node.attrs?.level || 1;
      return `<h${level}>${headingContent}</h${level}>`;
    }

    case 'image': {
      const imageSrc = node.attrs?.src || '';
      const imageAlt = node.attrs?.alt || '';
      const imageTitle = node.attrs?.title || '';
      const imageAlign = node.attrs?.align || 'center';

      let imageStyle = 'max-width: 100%; height: auto; margin: 2rem auto; display: block;';

      if (imageAlign === 'left') {
        imageStyle = 'max-width: 50%; height: auto; margin: 0 1.5rem 1rem 0; float: left;';
      } else if (imageAlign === 'right') {
        imageStyle = 'max-width: 50%; height: auto; margin: 0 0 1rem 1.5rem; float: right;';
      }

      return `<img src="${imageSrc}" alt="${imageAlt}" title="${imageTitle}" style="${imageStyle}" />`;
    }

    case 'hardBreak':
      return '<br>';

    case 'codeBlock': {
      const codeContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      const language = node.attrs?.language || '';
      return `<pre><code class="language-${language}">${codeContent}</code></pre>`;
    }

    case 'blockquote': {
      const quoteContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      return `<blockquote>${quoteContent}</blockquote>`;
    }

    case 'horizontalRule':
      return '<hr>';

    case 'table': {
      const tableContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      return `<table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">${tableContent}</table>`;
    }

    case 'tableRow': {
      const rowContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      return `<tr>${rowContent}</tr>`;
    }

    case 'tableCell': {
      const cellContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      return `<td style="border: 1px solid var(--border-color); padding: 0.5rem;">${cellContent}</td>`;
    }

    case 'tableHeader': {
      const headerContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
      return `<th style="border: 1px solid var(--border-color); padding: 0.5rem; font-weight: bold;">${headerContent}</th>`;
    }

    default:
      // Handle unknown node types gracefully
      if (node.content) {
        return node.content.map(convertNodeToHTML).join('');
      }
      return '';
  }
};

/**
 * Convert Squidex asset ID to asset URL
 * @param {String|Array} assetData - Asset ID or array containing asset ID
 * @returns {String|null} Asset URL or null
 */
const convertAssetToUrl = (assetData) => {
  if (!assetData) return null;

  // Handle array of assets (Squidex returns arrays for asset fields)
  if (Array.isArray(assetData)) {
    if (assetData.length === 0) return null;
    assetData = assetData[0]; // Get first asset
  }

  // If it's already a URL, return it
  if (typeof assetData === 'string' && assetData.startsWith('http')) {
    return assetData;
  }

  // If it's an object with ID property
  if (typeof assetData === 'object' && assetData?.id) {
    return `${SQUIDEX_URL}/api/assets/${SQUIDEX_APP_NAME}/${assetData.id}`;
  }

  // If it's just an asset ID string
  if (typeof assetData === 'string') {
    return `${SQUIDEX_URL}/api/assets/${SQUIDEX_APP_NAME}/${assetData}`;
  }

  return null;
};

/**
 * Process article data from Squidex API to standard format
 * @param {Object} rawArticle - Raw article from API
 * @returns {Object} Processed article with converted content
 */
export const processArticleData = (rawArticle) => {
  const content = normalizeDashes(convertRichTextToHTML(rawArticle.data?.content?.iv)) || 'No content available';
  const title = normalizeDashes(rawArticle.data?.title?.iv) || 'Untitled';
  const excerpt = normalizeDashes(rawArticle.data?.excerpt?.iv || '');
  const tags = [rawArticle.data?.tags?.iv || []].flat(2).filter((t) => typeof t === 'string' && t.trim());
  const text = htmlToPlainText(content);

  return {
    id: rawArticle.id,
    title,
    content,
    excerpt,
    // Excerpt when the CMS has one, otherwise the opening of the article. Used for cards and meta descriptions.
    summary: excerpt || truncateWords(text, 32),
    author: rawArticle.data?.author?.iv || 'Unknown',
    publishDate: rawArticle.data?.publishDate?.iv || rawArticle.lastModified || rawArticle.created,
    slug: rawArticle.data?.slug?.iv || '',
    tags,
    categories: categorizeArticle({ title, text, tags }),
    featuredImage: convertAssetToUrl(rawArticle.data?.featuredImage?.iv),
    status: rawArticle.data?.status?.iv || rawArticle.status || 'draft',
    created: rawArticle.created,
    lastModified: rawArticle.lastModified,
    // Additional metadata for complete display
    wordCount: countWords(content),
    readingTime: estimateReadingTime(content)
  };
};

/**
 * Process and sort a list of raw articles, newest first.
 * @param {Array} rawArticles - Raw items from the Squidex blog schema
 * @returns {Array} Processed articles
 */
export const processArticleList = (rawArticles) =>
  rawArticles
    .map(processArticleData)
    .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

/**
 * Replace em and en dashes with a plain hyphen (house style bans them in visible text).
 * @param {String} value - Text or HTML
 * @returns {String} Normalized text
 */
export const normalizeDashes = (value) =>
  typeof value === 'string'
    ? value.replace(/\s*[\u2014\u2015]\s*/g, ' - ').replace(/\u2013/g, '-')
    : value;

/**
 * Strip tags and decode the common entities to get readable plain text.
 * @param {String} html - HTML string
 * @returns {String} Plain text
 */
export const htmlToPlainText = (html) =>
  (html || '')
    .replace(/<\/(p|h[1-6]|li|blockquote|pre)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Cut text to a word limit, adding an ellipsis when shortened.
 * @param {String} text - Plain text
 * @param {Number} limit - Max words
 * @returns {String} Shortened text
 */
export const truncateWords = (text, limit) => {
  const words = (text || '').split(/\s+/).filter(Boolean);
  return words.length <= limit ? words.join(' ') : `${words.slice(0, limit).join(' ').replace(/[,.;:]$/, '')}...`;
};

/**
 * Count words in HTML content (strips HTML tags)
 * @param {String} html - HTML string
 * @returns {Number} Word count
 */
const countWords = (html) => {
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.split(/\s+/).length;
};

/**
 * Estimate reading time based on word count
 * Assumes average reading speed of 200 words per minute
 * @param {String} html - HTML string
 * @returns {Number} Reading time in minutes
 */
const estimateReadingTime = (html) => {
  const wordCount = countWords(html);
  return Math.max(1, Math.ceil(wordCount / 200));
};

export default {
  convertRichTextToHTML,
  convertNodeToHTML,
  processArticleData,
  processArticleList,
  countWords,
  estimateReadingTime
};