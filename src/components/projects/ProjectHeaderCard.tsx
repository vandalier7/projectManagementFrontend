'use client';

import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';

const DEFAULT_BANNER_URL = '/project-banner-placeholder.jpg';

interface ProjectHeaderCardProps {
	project: {
		name: string;
		status: string;
		description?: string | null;
		lead?: { full_name: string } | null;
	};
	bannerUrl?: string | null;
	themeColor?: string | null;
}

function useImageBrightness(src: string): { brightness: number | null; loaded: boolean } {
	const [brightness, setBrightness] = useState<number | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoaded(false);
		setBrightness(null);

		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = src;

		img.onload = () => {
			if (cancelled) return;
			setLoaded(true);

			try {
				const canvas = document.createElement('canvas');
				const size = 32;
				canvas.width = size;
				canvas.height = size;

				const ctx = canvas.getContext('2d');
				if (!ctx) return;

				ctx.drawImage(img, 0, 0, size, size);
				const { data } = ctx.getImageData(0, 0, size, size);

				let total = 0;
				const pixelCount = data.length / 4;

				for (let i = 0; i < data.length; i += 4) {
					total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
				}

				if (!cancelled) setBrightness(total / pixelCount);
			} catch {
				if (!cancelled) setBrightness(null);
			}
		};

		img.onerror = () => {
			if (!cancelled) setLoaded(true);
		};

		return () => {
			cancelled = true;
		};
	}, [src]);

	return { brightness, loaded };
}

// Converts a #RRGGBB hex string to an rgba() string at the given alpha.
// Falls back to a neutral gray if the hex is missing/malformed so callers
// don't need to guard every call site.
function withAlpha(hex: string | null | undefined, alpha: number): string {
	const clean = (hex ?? '').replace('#', '');
	const isValid = /^[0-9a-fA-F]{6}$/.test(clean);
	const r = isValid ? parseInt(clean.substring(0, 2), 16) : 148;
	const g = isValid ? parseInt(clean.substring(2, 4), 16) : 163;
	const b = isValid ? parseInt(clean.substring(4, 6), 16) : 184;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ProjectHeaderCard({
	project,
	bannerUrl,
	themeColor,
}: ProjectHeaderCardProps) {
	const displayBanner = bannerUrl ?? DEFAULT_BANNER_URL;
	const { brightness, loaded } = useImageBrightness(displayBanner);

	const isLight = brightness !== null && brightness > 150;
	const textColorClass = isLight ? 'text-gray-900' : 'text-white';
	const mutedTextColorClass = isLight ? 'text-gray-700/80' : 'text-white/80';

	// Legibility wash is always pure black or white based on banner
	// brightness — no longer tinted by themeColor.
	const overlayGradient = isLight
		? 'linear-gradient(to right, rgba(255,255,255,0.75), rgba(255,255,255,0) 90%)'
		: 'linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0) 90%)';

	return (
		<div
			className="relative bg-muted/20 border border-border rounded-xl p-6 flex flex-col overflow-hidden min-h-[320px]"
			style={themeColor ? { backgroundColor: withAlpha(themeColor, 0.1) } : undefined}
		>

			<img
				src={displayBanner}
				alt=""
				className={`absolute inset-0 h-full w-full object-cover object-right-bottom transition-opacity duration-200 ${
					loaded ? 'opacity-100' : 'opacity-0'
				}`}
			/>

			{loaded && (
				<div
					className="absolute inset-0"
					style={{ background: overlayGradient }}
				/>
			)}

			<div
				className={`relative flex items-center justify-between transition-opacity duration-200 ${
					loaded ? 'opacity-100' : 'opacity-0'
				}`}
			>
				<h1 className={`text-3xl font-bold ${textColorClass}`}>
					{project.name}
				</h1>

				<span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border border-current/30 ${textColorClass}`}>
					{project.status}
				</span>
			</div>

			{project.description && (
				<p
					className={`relative mt-4 leading-relaxed flex-1 transition-opacity duration-200 ${mutedTextColorClass} ${
						loaded ? 'opacity-100' : 'opacity-0'
					}`}
					style={{
						display: '-webkit-box',
						WebkitLineClamp: 5,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
					}}
				>
					{project.description}
				</p>
			)}

			<div
				className={`relative flex items-center gap-2 mt-6 text-sm transition-opacity duration-200 ${
					loaded ? 'opacity-100' : 'opacity-0'
				}`}
			>
				<Crown size={16} className={textColorClass} />
				<span className={mutedTextColorClass}>
					Project Lead
				</span>
				<span className={`font-semibold ${textColorClass}`}>
					{project.lead?.full_name ?? '—'}
				</span>
			</div>
		</div>
	);
}