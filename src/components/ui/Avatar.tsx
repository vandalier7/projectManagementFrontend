'use client';

import { useState } from 'react';

/** "Jane Dela Cruz" → "JD". Safe for null names (pending invites have none). */
export function getInitials(name: string | null | undefined): string {
	if (!name) return '';
	return name
		.split(' ')
		.filter(Boolean)
		.map(part => part[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

/** Profile picture, falling back to initials if there's no image or it fails to load. */
export default function Avatar({
	name,
	src,
	className = 'h-10 w-10 text-sm',
}: {
	name: string | null | undefined;
	src?: string | null;
	/** Size and text size classes. */
	className?: string;
}) {
	const [failed, setFailed] = useState(false);

	if (src && !failed) {
		// eslint-disable-next-line @next/next/no-img-element -- avatars come from arbitrary hosts
		return <img src={src} alt={name ?? ''} onError={() => setFailed(true)} className={`${className} rounded-full object-cover shrink-0`} />;
	}

	return (
		<div className={`${className} rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold shrink-0`}>
			{getInitials(name)}
		</div>
	);
}
