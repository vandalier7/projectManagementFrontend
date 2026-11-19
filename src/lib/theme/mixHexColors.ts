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

// Blends `tintHex` into `baseHex` at `tintRatio` (0–1). Used to wash a
// neutral surface color with a small amount of the project's theme color,
// without touching the base token itself.
export function mixHexColors(baseHex: string, tintHex: string, tintRatio: number): string {
	const [r1, g1, b1] = hexToRgb(baseHex);
	const [r2, g2, b2] = hexToRgb(tintHex);

	return rgbToHex([
		r1 * (1 - tintRatio) + r2 * tintRatio,
		g1 * (1 - tintRatio) + g2 * tintRatio,
		b1 * (1 - tintRatio) + b2 * tintRatio,
	]);
}