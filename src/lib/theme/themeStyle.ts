import type { CSSProperties } from 'react';
import { generateThemeShades, getContrastColor } from './generateThemeShades';
import { mixHexColors } from './mixHexColors';

// Base colours the tinted --surface / --border are mixed from. They match the
// app's default :root values and are deliberately not switched by accent
// lightness.
const BASE_SURFACE = '#fff7f2';
const BASE_BORDER = '#E0E0E0';

// How much accent gets blended in. Border is tinted more than surface so it
// stays visible against the (more subtly tinted) cards.
const SURFACE_TINT_RATIO = 0.08;
const BORDER_TINT_RATIO = 0.18;

/**
 * CSS variable overrides that theme a subtree from one project colour.
 * Used by the board shell and by the settings page's live preview, so both
 * always match.
 */
export function buildThemeStyle(themeColor: string): CSSProperties {
	const shades = generateThemeShades(themeColor);

	return {
		'--accent': shades.accent,
		'--accent-hover': shades.accentHover,
		'--accent-foreground': getContrastColor(shades.accent),
		'--surface': mixHexColors(BASE_SURFACE, shades.accent, SURFACE_TINT_RATIO),
		'--border': mixHexColors(BASE_BORDER, shades.accent, BORDER_TINT_RATIO),
	} as CSSProperties;
}
