// Pages that bring their own palette and type, with the same layout and motion as the rest of the
// site. The skin is an attribute on <html>; CSS ("Flightline skin" in App.css) swaps the tokens.
// Keep in sync with the inline script in index.html, which applies it before first paint.
export const SKINS = { '/flightline': 'flightline' };

export const skinFor = (pathname) => SKINS[pathname] || null;

export const applySkin = (pathname) => {
  const skin = skinFor(pathname);
  if (skin) document.documentElement.setAttribute('data-skin', skin);
  else document.documentElement.removeAttribute('data-skin');
};
