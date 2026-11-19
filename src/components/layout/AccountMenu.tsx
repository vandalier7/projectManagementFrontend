'use client';

import { useCallback, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';
import type { User } from '@/types';

function initials(user: User): string {
	const source = user.full_name?.trim() || user.username;
	const parts = source.split(/\s+/).filter(Boolean);
	return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : source.slice(0, 2).toUpperCase();
}

/** Avatar button with the signed-in user's name and a log out action. */
export default function AccountMenu({ user, onLogout, loggingOut }: { user: User; onLogout: () => void; loggingOut: boolean }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useClickOutside(ref, useCallback(() => setOpen(false), []), open);

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen(v => !v)}
				className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent text-sm font-semibold text-white transition-opacity hover:opacity-90"
				aria-label="Account menu"
				aria-expanded={open}
			>
				{initials(user)}
			</button>

			{open && (
				<div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border bg-surface shadow-lg">
					<div className="border-b border-border px-4 py-3">
						<p className="m-0 text-sm font-medium text-text">{user.full_name || user.username}</p>
						<p className="m-0 text-xs text-muted">@{user.username}</p>
					</div>

					<button
						type="button"
						onClick={onLogout}
						disabled={loggingOut}
						className="cursor-pointer flex w-full items-center gap-2 rounded-b-lg px-4 py-3 text-sm font-medium text-danger transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
					>
						<LogOut size={16} />
						{loggingOut ? 'Logging out...' : 'Log Out'}
					</button>
				</div>
			)}
		</div>
	);
}
