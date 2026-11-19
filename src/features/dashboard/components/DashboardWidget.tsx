import type { ReactNode } from 'react';
import { PartyPopper } from 'lucide-react';

/**
 * Frame for a dashboard list widget: header with optional action, and a body
 * that switches between loading skeleton, error with retry, empty state and
 * the list itself.
 */
export default function DashboardWidget({
	title,
	action,
	isLoading,
	error,
	onRetry,
	errorMessage,
	isEmpty,
	empty,
	skeletonRows = 3,
	className = '',
	bodyClassName = 'flex-1',
	children,
}: {
	title: string;
	action?: ReactNode;
	isLoading: boolean;
	error: unknown;
	onRetry: () => void;
	errorMessage: string;
	isEmpty: boolean;
	empty: { title: string; subtitle: string };
	skeletonRows?: number;
	className?: string;
	bodyClassName?: string;
	children: ReactNode;
}) {
	return (
		<div className={`flex flex-col rounded-xl border border-border bg-surface shadow-sm ${className}`}>
			<div className="flex items-center justify-between border-b border-border px-4 py-2.5">
				<h2 className="text-sm font-semibold text-text">{title}</h2>
				{action}
			</div>

			<div className={`overflow-y-auto ${bodyClassName}`}>
				{isLoading ? (
					<div className="flex h-full flex-col gap-2 p-2">
						{Array.from({ length: skeletonRows }, (_, i) => (
							<div key={i} className="h-14 shrink-0 animate-pulse rounded bg-bg" />
						))}
					</div>
				) : error ? (
					<div className="flex h-full flex-col items-center justify-center px-6 text-center">
						<p className="text-sm font-medium text-danger">{errorMessage}</p>
						<button onClick={onRetry} className="mt-1 text-xs font-medium text-accent hover:text-accent-hover">
							Try again
						</button>
					</div>
				) : isEmpty ? (
					<div className="flex h-full flex-col items-center justify-center px-6 text-center">
						<PartyPopper className="mx-auto h-6 w-6 text-accent" />
						<p className="mt-2 text-sm font-medium text-text">{empty.title}</p>
						<p className="mt-0.5 text-xs text-muted">{empty.subtitle}</p>
					</div>
				) : (
					<div className="flex flex-col gap-2 p-2">{children}</div>
				)}
			</div>
		</div>
	);
}
