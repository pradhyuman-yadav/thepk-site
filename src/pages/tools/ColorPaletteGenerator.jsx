import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ColorPaletteGenerator = () => {
  const navigate = useNavigate();
  const [paletteType, setPaletteType] = useState('complementary');
  const [baseColor, setBaseColor] = useState('#3498db');
  const [colors, setColors] = useState([]);
  const [colorMode, setColorMode] = useState('hex');

  // Color utility functions
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const hslToRgb = (h, s, l) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  // Color theory palette generators
  const generateComplementary = (hex) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return [
      hex,
      rgbToHex(...Object.values(hslToRgb(hsl.h, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 90) % 360, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 270) % 360, hsl.s, hsl.l)))
    ];
  };

  const generateAnalogous = (hex) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return [
      rgbToHex(...Object.values(hslToRgb((hsl.h - 30) % 360, hsl.s, hsl.l))),
      hex,
      rgbToHex(...Object.values(hslToRgb((hsl.h + 30) % 360, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h - 60) % 360, hsl.s, Math.max(0, hsl.l - 15)))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 60) % 360, hsl.s, Math.min(100, hsl.l + 15))))
    ];
  };

  const generateTriadic = (hex) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return [
      hex,
      rgbToHex(...Object.values(hslToRgb((hsl.h + 120) % 360, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 240) % 360, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 60) % 360, hsl.s, Math.max(0, hsl.l - 20)))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 180) % 360, hsl.s, Math.min(100, hsl.l + 20))))
    ];
  };

  const generateTetradic = (hex) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return [
      hex,
      rgbToHex(...Object.values(hslToRgb((hsl.h + 60) % 360, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 240) % 360, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 120) % 360, hsl.s, Math.max(0, hsl.l - 15))))
    ];
  };

  const generateMonochromatic = (hex) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return [
      rgbToHex(...Object.values(hslToRgb(hsl.h, hsl.s, 20))),
      rgbToHex(...Object.values(hslToRgb(hsl.h, hsl.s, 40))),
      rgbToHex(...Object.values(hslToRgb(hsl.h, hsl.s, 60))),
      hex,
      rgbToHex(...Object.values(hslToRgb(hsl.h, hsl.s, Math.min(100, hsl.l + 20))))
    ];
  };

  const generateSplitComplementary = (hex) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return [
      hex,
      rgbToHex(...Object.values(hslToRgb((hsl.h + 150) % 360, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 210) % 360, hsl.s, hsl.l))),
      rgbToHex(...Object.values(hslToRgb((hsl.h + 30) % 360, hsl.s, Math.max(0, hsl.l - 15)))),
      rgbToHex(...Object.values(hslToRgb((hsl.h - 30) % 360, hsl.s, Math.min(100, hsl.l + 15))))
    ];
  };

  const generatePalette = () => {
    let newColors = [];

    switch (paletteType) {
      case 'complementary':
        newColors = generateComplementary(baseColor);
        break;
      case 'analogous':
        newColors = generateAnalogous(baseColor);
        break;
      case 'triadic':
        newColors = generateTriadic(baseColor);
        break;
      case 'tetradic':
        newColors = generateTetradic(baseColor);
        break;
      case 'monochromatic':
        newColors = generateMonochromatic(baseColor);
        break;
      case 'split-complementary':
        newColors = generateSplitComplementary(baseColor);
        break;
      default:
        newColors = generateComplementary(baseColor);
    }

    setColors(newColors);
  };

  const getColorFormat = (hex) => {
    switch (colorMode) {
      case 'hex':
        return hex;
      case 'rgb': {
        const rgb = hexToRgb(hex);
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      }
      case 'hsl': {
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      }
      default:
        return hex;
    }
  };

  const copyToClipboard = (color) => {
    navigator.clipboard.writeText(getColorFormat(color));
    alert(`Copied ${getColorFormat(color)} to clipboard!`);
  };

  const exportAsCSS = () => {
    if (colors.length === 0) return;
    let cssContent = ':root {\n';
    colors.forEach((color, index) => {
      cssContent += `  --color-${index + 1}: ${color};\n`;
    });
    cssContent += '}';

    navigator.clipboard.writeText(cssContent);
    alert('CSS variables copied to clipboard!');
  };

  const exportAsJson = () => {
    if (colors.length === 0) return;
    const jsonContent = JSON.stringify({
      paletteType,
      baseColor,
      colors: colors.map((color, index) => {
        const rgb = hexToRgb(color);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        return {
          id: `color-${index + 1}`,
          hex: color,
          rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
        };
      }),
      count: colors.length,
      generatedAt: new Date().toISOString()
    }, null, 2);

    navigator.clipboard.writeText(jsonContent);
    alert('JSON palette copied to clipboard!');
  };

  const downloadPaletteSwatch = () => {
    if (colors.length === 0) return;

    const canvas = document.createElement('canvas');
    const swatchHeight = 120;
    const swatchWidth = 200;
    canvas.width = swatchWidth * colors.length;
    canvas.height = swatchHeight;

    const ctx = canvas.getContext('2d');

    colors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(index * swatchWidth, 0, swatchWidth, swatchHeight);

      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(color, (index + 0.5) * swatchWidth, swatchHeight - 15);
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${paletteType}-palette.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaletteDescription = () => {
    const descriptions = {
      complementary: 'Uses colors opposite on the color wheel for maximum contrast and vibrance.',
      analogous: 'Uses colors adjacent on the color wheel for harmony and natural appearance.',
      triadic: 'Uses three colors equally spaced on the color wheel for balanced, vibrant designs.',
      tetradic: 'Uses four colors arranged in two complementary pairs for rich, varied designs.',
      monochromatic: 'Uses variations of a single color with different lightness levels for elegant designs.',
      'split-complementary': 'Uses a color and two colors adjacent to its complement for harmony with contrast.'
    };
    return descriptions[paletteType] || '';
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <button
          className="back-button"
          onClick={() => navigate('/tools')}
        >
          ← Back to Tools
        </button>
        <h1 className="tool-page-title">Color Palette Generator</h1>
      </div>

      <div className="tool-content">
        <div className="tool-description">
          <p>
            Generate harmonious color palettes based on color theory principles. Choose from various
            palette types to create professional, aesthetically pleasing color combinations for your designs.
          </p>
        </div>

        <div className="tool-interface">
          <div className="settings-section">
            <div className="setting-group">
              <label htmlFor="base-color">Base Color:</label>
              <div className="color-input-group">
                <input
                  type="color"
                  id="base-color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                />
                <input
                  type="text"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  placeholder="#3498db"
                />
              </div>
            </div>

            <div className="setting-group">
              <label htmlFor="palette-type">Palette Type:</label>
              <select
                id="palette-type"
                value={paletteType}
                onChange={(e) => setPaletteType(e.target.value)}
              >
                <option value="complementary">Complementary</option>
                <option value="analogous">Analogous</option>
                <option value="triadic">Triadic</option>
                <option value="tetradic">Tetradic</option>
                <option value="monochromatic">Monochromatic</option>
                <option value="split-complementary">Split Complementary</option>
              </select>
            </div>

            <div className="setting-group">
              <label htmlFor="color-format">Color Format:</label>
              <select
                id="color-format"
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value)}
              >
                <option value="hex">Hexadecimal (HEX)</option>
                <option value="rgb">RGB</option>
                <option value="hsl">HSL</option>
              </select>
            </div>

            <button
              className="generate-button"
              onClick={generatePalette}
            >
              Generate Palette
            </button>
          </div>

          {colors.length > 0 && (
            <div className="palette-display">
              <div className="palette-type-info">
                <h2>{paletteType.charAt(0).toUpperCase() + paletteType.slice(1).replace('-', ' ')}</h2>
                <p>{getPaletteDescription()}</p>
              </div>

              <div className="color-swatches-visual">
                {colors.map((color, index) => (
                  <div key={index} className="color-swatch-visual">
                    <div
                      className="color-box-large"
                      style={{ backgroundColor: color }}
                    />
                    <div className="color-details">
                      <p className="color-value">{getColorFormat(color)}</p>
                      <div className="color-actions">
                        <button
                          className="mini-button copy-button"
                          onClick={() => copyToClipboard(color)}
                          title="Copy color value"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="export-section">
                <h2>Export Palette</h2>
                <div className="export-buttons">
                  <button
                    className="export-button css-export"
                    onClick={exportAsCSS}
                  >
                    Export as CSS
                  </button>
                  <button
                    className="export-button json-export"
                    onClick={exportAsJson}
                  >
                    Export as JSON
                  </button>
                  <button
                    className="export-button swatch-export"
                    onClick={downloadPaletteSwatch}
                  >
                    Download Swatch
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="tool-info">
          <h2>Color Theory Explained</h2>
          <ul>
            <li><strong>Complementary:</strong> Colors opposite on the color wheel create high contrast and visual excitement</li>
            <li><strong>Analogous:</strong> Colors adjacent to each other create harmony and are easy on the eyes</li>
            <li><strong>Triadic:</strong> Three colors evenly spaced for vibrant yet balanced designs</li>
            <li><strong>Tetradic:</strong> Four colors in complementary pairs for complex, rich palettes</li>
            <li><strong>Monochromatic:</strong> Shades and tints of one color for sophisticated, cohesive designs</li>
            <li><strong>Split Complementary:</strong> A base color plus two colors adjacent to its complement for balanced harmony</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ColorPaletteGenerator;