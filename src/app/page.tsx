'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser } from '@/lib/auth';

export default function LandingPage() {
	const router = useRouter();
	const [fading, setFading] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setFading(true);

			setTimeout(() => {
				const token = getToken();

				if (!token) {
					router.replace('/login');
					return;
				}

				const user = getUser();

				if (user && !user.profile_completed) {
					router.replace('/complete-profile');
					return;
				}

				if (user && user.must_change_password) {
					router.replace('/change-password');
					return;
				}

				router.replace('/dashboard');
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
				width={960}
				height={960}
				className="h-48 w-48 object-contain"
				priority
			/>

			<p className="m-0 text-xs font-mono uppercase tracking-widest text-muted">
				Project Management System
			</p>
		</main>
	);
}