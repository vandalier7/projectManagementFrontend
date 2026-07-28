'use client';

import { LoaderCircle } from 'lucide-react';

interface PageLoadingProps {
	title?: string;
	description?: string;
}

export default function PageLoading({
	title = '',
	description = 'Please wait while we load the page.',
}: PageLoadingProps) {
	return (
		<div className="flex flex-1 items-center justify-center px-6 py-12">
			<div className="flex max-w-md flex-col items-center text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg">
					<LoaderCircle className="h-8 w-8 animate-spin text-muted" />
				</div>

				<h2 className="mt-6 text-xl font-semibold text-text">
					{title}
				</h2>

				<p className="mt-2 text-sm leading-6 text-muted">
					{description}
				</p>
			</div>
		</div>
	);
}