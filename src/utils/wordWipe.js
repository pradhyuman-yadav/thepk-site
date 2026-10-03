/**
 * Word-by-word wipe transitions.
 *
 * Every word of an element wipes in (or out) at the same moment, each from a random direction.
 * The live React DOM is never split or mutated: we clone the element, split the clone's text into
 * word spans, lay the clone exactly over the original, hide the original while the clone animates,
 * then remove the clone. That keeps interactive pages (tools, chat) safe mid-animation.
 */

export const WIPE_MS = 520;
const MAX_WORDS = 1800; // beyond this, remaining text appears without a per-word wipe
const SKIP = 'svg, canvas, iframe, textarea, select, option, script, style, input, [data-no-wipe]';

// clip-path start (for wipe-in) per direction; wipe-out runs toward the same edge
const DIRECTIONS = [
  'inset(0 100% 0 0)', // from left
  'inset(0 0 0 100%)', // from right
  'inset(100% 0 0 0)', // from bottom
  'inset(0 0 100% 0)', // from top
];

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const randomDirection = () => DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

const textNodes = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.nodeValue.trim() && !node.parentElement?.closest(SKIP)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
};

/**
 * Which text nodes of the live element are on screen. Off-screen words cannot be seen during the
 * half-second wipe, so skipping them keeps long pages cheap. Clone and original share node order.
 */
const visibleFlags = (original) => {
  const top = -100;
  const bottom = window.innerHeight + 100;
  return textNodes(original).map((node) => {
    const rect = node.parentElement.getBoundingClientRect();
    return rect.bottom >= top && rect.top <= bottom;
  });
};

/** Wrap each word of the on-screen text nodes under `root` in a span with a random wipe direction. */
const splitWords = (root, visible) => {
  const nodes = textNodes(root);

  let count = 0;
  for (const [index, node] of nodes.entries()) {
    if (count >= MAX_WORDS) break;
    if (visible && visible[index] === false) continue;
    const fragment = document.createDocumentFragment();
    for (const part of node.nodeValue.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        continue;
      }
      const span = document.createElement('span');
      span.className = 'wipe-word';
      span.style.setProperty('--wipe-edge', randomDirection());
      span.textContent = part;
      fragment.appendChild(span);
      count += 1;
    }
    node.parentNode.replaceChild(fragment, node);
  }
};

/** Swap media that should not be duplicated (iframes reload, canvases clone blank) for empty boxes. */
const neutralizeMedia = (clone) => {
  clone.querySelectorAll('iframe, canvas, video').forEach((el) => {
    const box = document.createElement('div');
    box.style.width = `${el.offsetWidth || el.width || 0}px`;
    box.style.height = `${el.offsetHeight || el.height || 0}px`;
    el.replaceWith(box);
  });
  clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  clone.removeAttribute('id');
};

/**
 * Animate `el` in or out by laying a word-split clone over it.
 * @param {HTMLElement} el - element to animate (stays in place, hidden during the animation)
 * @param {'in'|'out'} mode
 * @returns {Promise<void>} resolves when the animation has finished and the clone is gone
 */
export const wipeElement = (el, mode) =>
  new Promise((resolve) => {
    if (!el?.isConnected || prefersReducedMotion() || !el.offsetParent) {
      resolve();
      return;
    }

    const visible = visibleFlags(el);
    const clone = el.cloneNode(true);
    neutralizeMedia(clone);
    splitWords(clone, visible);
    clone.setAttribute('aria-hidden', 'true');
    clone.dataset.wipeClone = '';
    clone.classList.add('wipe-layer', mode === 'in' ? 'wipe-in' : 'wipe-out');
    Object.assign(clone.style, {
      position: 'absolute',
      top: `${el.offsetTop}px`,
      left: `${el.offsetLeft}px`,
      width: `${el.offsetWidth}px`,
      margin: '0',
      pointerEvents: 'none',
      visibility: 'visible',
    });

    el.insertAdjacentElement('afterend', clone);
    const previousVisibility = el.style.visibility;
    el.style.visibility = 'hidden';

    const finish = () => {
      clone.remove();
      // After a wipe-out the element is about to be replaced, so keep it hidden until React swaps it
      if (mode === 'in') el.style.visibility = previousVisibility;
      resolve();
    };
    setTimeout(finish, WIPE_MS + 40);
  });

/**
 * Watch `root` for elements React adds later (loaded data, "show more", new chat messages)
 * and wipe each one in. Returns a disconnect function.
 */
export const watchForNewContent = (root) => {
  if (prefersReducedMotion()) return () => {};
  let lastKeyAt = 0;
  const onKey = () => {
    lastKeyAt = Date.now();
  };
  document.addEventListener('keydown', onKey, true);

  const observer = new MutationObserver((records) => {
    // Typing in a tool re-renders results on every keystroke; don't animate those
    if (Date.now() - lastKeyAt < 700) return;
    const added = new Set();
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node.nodeType !== 1 || 'wipeClone' in node.dataset) return;
        if (!node.textContent.trim()) return;
        if (/^(TR|TD|TH|TBODY|THEAD|OPTION)$/.test(node.nodeName)) return;
        added.add(node);
      });
    }
    // Only animate the outermost new elements
    for (const node of added) {
      let parent = node.parentElement;
      let nested = false;
      while (parent && parent !== root) {
        if (added.has(parent)) {
          nested = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!nested && node.isConnected) wipeElement(node, 'in');
    }
  });
  observer.observe(root, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    document.removeEventListener('keydown', onKey, true);
  };
};
