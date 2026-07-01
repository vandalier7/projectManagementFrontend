'use client';

import { ReactNode } from 'react';

interface BoardAppBarProps {
	title: string;
	titleAdornment?: ReactNode;
	actions?: ReactNode;
}

export default function BoardAppBar({ title, titleAdornment, actions }: BoardAppBarProps) {
	return (
		<header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
			<div className="flex items-center gap-3">
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