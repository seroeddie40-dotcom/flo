/**
 * Dynamically darkens or lightens a hex color by a given percentage.
 * @param hex - The base color hex (e.g. "#004369" or "004369")
 * @param percent - The percentage to change (-100 to 100). Negative to darken, positive to lighten.
 * @returns The adjusted hex color (e.g. "#1a5b80")
 */
export function adjustBrightness(hex: string, percent: number): string {
  if (!hex) return '#000000';
  
  // Clean the hex string
  let cleanHex = hex.replace(/^\s*#|\s*$/g, '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.replace(/(.)/g, '$1$1');
  }
  
  // Fallback if hex is invalid
  if (cleanHex.length !== 6) {
    return hex;
  }

  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return hex;
  }

  const factor = percent / 100;
  
  if (factor > 0) {
    // Scaling towards white (255)
    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);
  } else if (factor < 0) {
    // Scaling towards black (0)
    r = Math.round(r * (1 + factor));
    g = Math.round(g * (1 + factor));
    b = Math.round(b * (1 + factor));
  }

  const rHex = Math.min(255, Math.max(0, r)).toString(16).padStart(2, '0');
  const gHex = Math.min(255, Math.max(0, g)).toString(16).padStart(2, '0');
  const bHex = Math.min(255, Math.max(0, b)).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}
