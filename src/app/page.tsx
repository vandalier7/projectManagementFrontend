'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';

export default function LandingPage() {
	const router = useRouter();
	const [fading, setFading] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setFading(true);

			setTimeout(() => {
				if (getToken()) {
					router.replace('/dashboard');
				} else {
					router.replace('/login');
				}
			}, 100);
		}, 500);

		return () => clearTimeout(timer);
	}, [router]);

	return (
		<main
			className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg"
			style={{
				opacity: fading ? 0 : 1,
				transition: 'opacity 500ms ease',
			}}
		>
			<Image
				src="/logo.png"
				alt="Project Dashboard"
				width={96}
				height={96}
				className="h-24 w-24 object-contain"
				priority
			/>

			<p className="m-0 text-xs font-mono uppercase tracking-widest text-muted">
				Project Management System
			</p>
		</main>
	);
}

