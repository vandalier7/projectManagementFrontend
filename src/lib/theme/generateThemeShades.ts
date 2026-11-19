interface ThemeShades {
	accent: string;
	accentHover: string;
}

function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace('#', '');
	const bigint = parseInt(clean.length === 3
		? clean.split('').map(c => c + c).join('')
		: clean, 16);
	return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
	return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h = 0, s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	return [h * 360, s * 100, l * 100];
}

function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
	h /= 360; s /= 100; l /= 100;

	if (s === 0) {
		const v = l * 255;
		return [v, v, v];
	}

	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;

	return [
		hue2rgb(p, q, h + 1 / 3) * 255,
		hue2rgb(p, q, h) * 255,
		hue2rgb(p, q, h - 1 / 3) * 255,
	];
}

function clampLightness(l: number, delta: number): number {
	return Math.max(0, Math.min(100, l + delta));
}

// Derives a hover shade from a single base color by nudging its HSL
// lightness — darker if the color is already light, lighter if it's dark,
// so the hover state stays visually distinct either way.
export function generateThemeShades(baseHex: string): ThemeShades {
	const [h, s, l] = rgbToHsl(hexToRgb(baseHex));
	const direction = l > 60 ? -1 : 1;
	const hoverRgb = hslToRgb([h, s, clampLightness(l, direction * 12)]);

	return {
		accent: baseHex,
		accentHover: rgbToHex(hoverRgb),
	};
}

export function getLuminance(hex: string): number {
	const [r, g, b] = hexToRgb(hex);
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function getContrastColor(
	hex: string,
	lightValue = '#000000',
	darkValue = '#ffffff'
): string {
	return getLuminance(hex) > 0.6 ? lightValue : darkValue;
}