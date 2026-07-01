'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageNoticeProps {
	icon: LucideIcon;
	title: string;
	description: string;
	children?: ReactNode;
}

export default function PageNotice({
	icon: Icon,
	title,
	description,
	children,
}: PageNoticeProps) {
	return (
		<div className="flex flex-1 items-center justify-center px-6 py-12">
			<div className="flex max-w-md flex-col items-center text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg">
					<Icon className="h-8 w-8 text-muted" />
				</div>

				<h2 className="mt-6 text-xl font-semibold text-text">
					{title}
				</h2>

				<p className="mt-2 text-sm leading-6 text-muted">
					{description}
				</p>

				{children && (
					<div className="mt-6 flex items-center gap-2">
						{children}
					</div>
				)}
			</div>
		</div>
	);
}