/**
 * Brand Color Utilities
 * Manages dynamic brand color system across the application
 */

/**
 * Convert hex color to RGB values
 * @param hex - Hex color code (e.g., "#8252e9")
 * @returns RGB values as string (e.g., "130, 82, 233")
 */
export function hexToRgb(hex: string): string {
  if (!hex || typeof hex !== 'string') return '130, 82, 233'; // Default fallback
  
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle shorthand hex (e.g. #03F)
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `${r}, ${g}, ${b}`;
  }

  // Parse standard hex values
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  
  return `${r}, ${g}, ${b}`;
}

/**
 * Update brand color CSS variables globally
 * @param color - Hex color code (e.g., "#8252e9")
 */
export function updateBrandColor(color: string): void {
  if (!color) return;
  const root = document.documentElement;
  const rgb = hexToRgb(color);
  
  // Set primary color
  root.style.setProperty('--brand-primary', color);
  root.style.setProperty('--brand-primary-rgb', rgb);
  
  // Set opacity variations
  root.style.setProperty('--brand-primary-10', `rgba(${rgb}, 0.1)`);
  root.style.setProperty('--brand-primary-20', `rgba(${rgb}, 0.2)`);
  root.style.setProperty('--brand-primary-30', `rgba(${rgb}, 0.3)`);
  root.style.setProperty('--brand-primary-50', `rgba(${rgb}, 0.5)`);
  root.style.setProperty('--brand-primary-80', `rgba(${rgb}, 0.8)`);
}

/**
 * Get current brand color from CSS variables
 * @returns Current brand color hex code
 */
export function getBrandColor(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--brand-primary')
    .trim();
}

/**
 * Initialize brand color system
 * Should be called on app startup
 * @param color - Initial brand color
 */
export function initBrandColors(color: string = '#8252e9'): void {
  updateBrandColor(color);
}

/**
 * Generate color variations for a given hex color
 * @param hex - Base hex color
 * @returns Object with color variations
 */
export function generateColorVariations(hex: string) {
  const rgb = hexToRgb(hex);
  
  return {
    base: hex,
    rgb: rgb,
    opacity10: `rgba(${rgb}, 0.1)`,
    opacity20: `rgba(${rgb}, 0.2)`,
    opacity30: `rgba(${rgb}, 0.3)`,
    opacity50: `rgba(${rgb}, 0.5)`,
    opacity80: `rgba(${rgb}, 0.8)`,
  };
}

/**
 * Check if a color is light or dark
 * @param hex - Hex color code
 * @returns true if light, false if dark
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.split(',').map(v => parseInt(v.trim()));
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
}

/**
 * Get contrasting text color (black or white) for a background color
 * @param hex - Background hex color
 * @returns '#000000' or '#ffffff'
 */
export function getContrastColor(hex: string): string {
  return isLightColor(hex) ? '#000000' : '#ffffff';
}
