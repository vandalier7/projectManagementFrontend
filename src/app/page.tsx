'use client';

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
            className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3"
            style={{
                opacity: fading ? 0 : 1,
                transition: 'opacity 500ms ease',
            }}
        >
            <span className="text-8xl">⬡</span>
            <p className="text-xs text-muted font-mono tracking-widest uppercase m-0">Project Management System</p>
        </main>
    );
}