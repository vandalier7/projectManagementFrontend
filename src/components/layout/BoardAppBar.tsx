'use client';

import { ReactNode, useEffect, useState } from 'react';

interface BoardAppBarProps {
	title: string;
	titleAdornment?: ReactNode;
	actions?: ReactNode;
	logoUrl?: string | null;
}

const DEFAULT_LOGO_URL = '/default-logo.jpg';
const DEFAULT_LOGO_GRACE_MS = 250;

export default function BoardAppBar({ title, titleAdornment, actions, logoUrl }: BoardAppBarProps) {

	const [loaded, setLoaded] = useState(false);
	const [showDefault, setShowDefault] = useState(false);

	// Don't commit to the default logo the instant logoUrl is null — that's
	// also the state during the brief window before the real project logo
	// has loaded. Wait a short grace period; if the real logoUrl shows up
	// before it elapses, we skip the default entirely and avoid a flash.
	useEffect(() => {
		if (logoUrl) {
			setShowDefault(false);
			return;
		}

		const timeout = setTimeout(() => setShowDefault(true), DEFAULT_LOGO_GRACE_MS);
		return () => clearTimeout(timeout);
	}, [logoUrl]);

	const resolvedLogoUrl = logoUrl ?? (showDefault ? DEFAULT_LOGO_URL : null);

	return (
		<header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
			<div className="flex items-center gap-3">
				{resolvedLogoUrl && (
					<img
						key={resolvedLogoUrl}
						src={resolvedLogoUrl}
						alt=""
						onLoad={() => setLoaded(true)}
						className={`h-full max-h-12 w-auto object-contain py-1 transition-opacity duration-300 ${
							loaded ? 'opacity-100' : 'opacity-0'
						}`}
					/>
				)}

				<h1 className="m-0 text-lg font-semibold text-text">
					{title}
				</h1>
				{titleAdornment}
			</div>

			{actions && (
				<div className="flex items-center gap-2">
					{actions}
				</div>
			)}
		</header>
	);
}