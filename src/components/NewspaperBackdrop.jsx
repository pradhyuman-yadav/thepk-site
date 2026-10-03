import { useEffect, useRef } from 'react';
import { layout, drawLayout } from 'render-tag';
import { useArticles } from '../hooks/useArticles';
import { useTheme } from '../contexts/theme';
import { htmlToPlainText, truncateWords } from '../utils/richTextConverter';
import { formatArticleDate } from '../utils/dates';

/**
 * Full-viewport broadsheet drawn on a canvas behind the page: masthead, banner headline and
 * columns of real article headlines, decks and body text. Purely decorative (aria-hidden, no
 * pointer events); the washed-out look comes from CSS opacity on the canvas.
 */

const MIN_COLUMN = 210;
const GUTTER = 22;
const MARGIN = 24;
// Headline sizes cycle so neighbouring stories differ; the sequence is fixed, so redraws are stable
const HEADLINE_SIZES = [30, 19, 25, 16, 22, 34, 18];

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const baseStyle = (ink) => `<style>
  p, h1, h2, h3 { margin: 0; color: ${ink}; }
  .kicker { font: 700 9px 'Courier New', monospace; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
  h2 { font-family: 'Playfair Display', 'Times New Roman', serif; font-weight: 900; line-height: 1.05; margin-bottom: 6px; }
  .deck { font: italic 13px/1.35 'Times New Roman', Georgia, serif; margin-bottom: 6px; }
  .body { font: 11px/1.45 'Times New Roman', Georgia, serif; text-align: justify; margin-bottom: 16px; }
</style>`;

const storyHtml = (article, index) => {
  const size = HEADLINE_SIZES[index % HEADLINE_SIZES.length];
  const kicker = article.categories?.[0]?.label;
  const text = htmlToPlainText(article.content) || article.summary || '';
  return `${kicker ? `<p class="kicker">${escapeHtml(kicker)}</p>` : ''}
    <h2 style="font-size:${size}px">${escapeHtml(article.title)}</h2>
    ${index % 3 === 0 ? `<p class="deck">${escapeHtml(truncateWords(article.summary, 22))}</p>` : ''}
    <p class="body">${escapeHtml(truncateWords(text, 60 + (index % 4) * 35))}</p>`;
};

// Fill one column with consecutive stories until it is taller than the space available
const fillColumn = (articles, startIndex, width, maxHeight, ink) => {
  let html = '';
  let i = startIndex;
  let result = null;
  // Cap the loop so an empty or tiny article list cannot spin forever
  for (let guard = 0; guard < 12; guard += 1) {
    html += storyHtml(articles[i % articles.length], i);
    i += 1;
    result = layout({ html: baseStyle(ink) + html, width });
    if (result.height > maxHeight) break;
  }
  return { result, nextIndex: i };
};

const drawRule = (ctx, x1, y1, x2, y2, ink, widthPx = 1) => {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = widthPx;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
};

const paint = (canvas, articles, ink) => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (!articles.length) return;

  const innerWidth = width - MARGIN * 2;

  // Masthead
  const mastheadSize = Math.max(44, Math.min(width / 9, 150));
  const masthead = layout({
    html: `<style>h1 { margin: 0; text-align: center; color: ${ink}; font: 900 ${mastheadSize}px/1 'Playfair Display', serif; letter-spacing: -1px; }</style><h1>THEPK.IN</h1>`,
    width: innerWidth,
  });
  let y = MARGIN;
  drawRule(ctx, MARGIN, y, width - MARGIN, y, ink, 3);
  y += 10;
  ctx.save();
  ctx.translate(MARGIN, y);
  drawLayout({ layout: masthead, width: innerWidth, ctx, renderShadows: false });
  ctx.restore();
  y += masthead.height + 8;

  // Dateline strip between double rules
  drawRule(ctx, MARGIN, y, width - MARGIN, y, ink, 1);
  const dateline = layout({
    html: `<style>p { margin: 0; color: ${ink}; font: 700 10px 'Courier New', monospace; letter-spacing: 2px; text-transform: uppercase; display: flex; }</style><p>${escapeHtml(formatArticleDate(articles[0].publishDate))} &#160;&#160; Daily AI news &#160;&#160; ${articles.length} articles</p>`,
    width: innerWidth,
  });
  ctx.save();
  ctx.translate(MARGIN, y + 6);
  drawLayout({ layout: dateline, width: innerWidth, ctx, renderShadows: false });
  ctx.restore();
  y += dateline.height + 12;
  drawRule(ctx, MARGIN, y, width - MARGIN, y, ink, 1);
  drawRule(ctx, MARGIN, y + 3, width - MARGIN, y + 3, ink, 1);
  y += 16;

  // Banner headline from the newest article, across the full width
  const bannerSize = Math.max(30, Math.min(width / 18, 76));
  const banner = layout({
    html: `<style>h2 { margin: 0; color: ${ink}; font: 900 ${bannerSize}px/1.02 'Playfair Display', serif; }</style><h2>${escapeHtml(articles[0].title)}</h2>`,
    width: innerWidth,
  });
  ctx.save();
  ctx.translate(MARGIN, y);
  drawLayout({ layout: banner, width: innerWidth, ctx, renderShadows: false });
  ctx.restore();
  y += banner.height + 14;
  drawRule(ctx, MARGIN, y, width - MARGIN, y, ink, 1);
  y += 14;

  // Columns of stories, separated by vertical rules
  const columns = Math.max(2, Math.floor((innerWidth + GUTTER) / (MIN_COLUMN + GUTTER)));
  const columnWidth = (innerWidth - GUTTER * (columns - 1)) / columns;
  const available = height - y;
  let storyIndex = 1;
  for (let c = 0; c < columns; c += 1) {
    const x = MARGIN + c * (columnWidth + GUTTER);
    const { result, nextIndex } = fillColumn(articles, storyIndex, columnWidth, available, ink);
    storyIndex = nextIndex;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, columnWidth, available);
    ctx.clip();
    ctx.translate(x, y);
    drawLayout({ layout: result, width: columnWidth, ctx, renderShadows: false });
    ctx.restore();
    if (c > 0) drawRule(ctx, x - GUTTER / 2, y, x - GUTTER / 2, height, ink, 1);
  }
};

const NewspaperBackdrop = () => {
  const canvasRef = useRef(null);
  const { articles } = useArticles();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    let timer = null;

    const draw = () => {
      if (cancelled) return;
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1A1A1A';
      try {
        paint(canvas, articles, ink);
      } catch (err) {
        // The backdrop is decoration; never let a layout failure break the page
        console.warn('Newspaper backdrop could not render:', err);
      }
    };

    // render-tag measures with canvas metrics, so the display face must be loaded first
    Promise.all([
      document.fonts.load("900 40px 'Playfair Display'"),
      document.fonts.load("italic 13px 'Times New Roman'"),
    ])
      .catch(() => {})
      // Draw when the browser is idle so the backdrop never delays the page itself
      .then(() => (window.requestIdleCallback ? window.requestIdleCallback(draw, { timeout: 1500 }) : setTimeout(draw, 300)));

    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(draw, 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [articles, isDarkMode]);

  return <canvas ref={canvasRef} className="newspaper-backdrop" aria-hidden="true" />;
};

export default NewspaperBackdrop;
