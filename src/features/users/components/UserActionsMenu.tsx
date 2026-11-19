'use client';

import { useEffect, useRef } from 'react';
import { KeyRound, MoreVertical, Pencil, UserMinus } from 'lucide-react';
import type { User } from '@/types';

interface UserActionsMenuProps {
	user: User;
	open: boolean;
	onToggle: () => void;
	onClose: () => void;
	onEdit: (user: User) => void;
	onForcePasswordChange: (user: User) => void;
	onRemove: (user: User) => void;
	removing: boolean;
}

/** The ⋮ menu on a user row: edit, reset password, delete. */
export default function UserActionsMenu({
	user,
	open,
	onToggle,
	onClose,
	onEdit,
	onForcePasswordChange,
	onRemove,
	removing,
}: UserActionsMenuProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) return;

		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') onClose();
		}

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [open, onClose]);

	return (
		<div className="relative shrink-0" ref={containerRef}>
			<button
				onClick={onToggle}
				disabled={removing}
				className="cursor-pointer shrink-0 text-muted hover:text-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed p-1 rounded-md hover:bg-bg"
				title="More actions"
				aria-haspopup="menu"
				aria-expanded={open}
			>
				<MoreVertical className="h-4 w-4" />
			</button>

			{open && (
				<div
					role="menu"
					className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg"
				>
					<button
						role="menuitem"
						onClick={() => {
							onClose();
							onEdit(user);
						}}
						className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg cursor-pointer"
					>
						<Pencil className="h-4 w-4 text-muted" />
						Edit Details
					</button>

					<button
						role="menuitem"
						onClick={() => {
							onClose();
							onForcePasswordChange(user);
						}}
						className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg cursor-pointer"
					>
						<KeyRound className="h-4 w-4 text-muted" />
						Change Password
					</button>

					<button
						role="menuitem"
						onClick={() => {
							onClose();
							onRemove(user);
						}}
						className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-bg cursor-pointer"
					>
						<UserMinus className="h-4 w-4" />
						Delete User
					</button>
				</div>
			)}
		</div>
	);
}
