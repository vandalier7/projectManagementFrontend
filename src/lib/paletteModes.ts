// @/lib/paletteModes.ts

// Two flat palettes used only to pick readable bg/surface/text/border
// values for a given accent color's luminance. Not tied to any site-wide
// dark mode setting — purely local to theme-color-driven previews.
export const PALETTE_FOR_LIGHT_ACCENT = {
	bg: '#f5ede7',
	surface: '#fff7f2',
	border: '#E0E0E0',
	text: '#261716',
	muted: '#6f5a56',
};

export const PALETTE_FOR_DARK_ACCENT = {
	bg: '#111111',
	surface: '#1C1C1C',
	border: '#2E2E2E',
	text: '#F0F0F0',
	muted: '#888888',
};