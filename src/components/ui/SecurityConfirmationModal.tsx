'use client';

import { useState, useEffect, useRef } from 'react';

export type SecurityLevel = 'low' | 'high';

interface SecurityConfirmationProps {
	open: boolean;
	title: string;
	text: string;
	securityLevel: SecurityLevel;
	onConfirm: (password?: string) => Promise<void> | void;
	onCancel: () => void;
}

export default function SecurityConfirmation({
	open,
	title,
	text,
	securityLevel,
	onConfirm,
	onCancel,
}: SecurityConfirmationProps) {
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Reset local state every time the modal is (re)opened
	useEffect(() => {
		if (open) {
			setPassword('');
			setError(null);
			setLoading(false);
		}
	}, [open]);

	useEffect(() => {
		if (open && securityLevel === 'high') {
			inputRef.current?.focus();
		}
	}, [open, securityLevel]);

	if (!open) return null;

	const handleConfirm = async () => {
		if (securityLevel === 'high' && !password) {
			setError('Password is required.');
			return;
		}

		setError(null);
		setLoading(true);

		try {
			await onConfirm(securityLevel === 'high' ? password : undefined);
		} catch (err: any) {
			setError(err.message ?? 'Something went wrong.');
			setLoading(false);
			return;
		}

		setLoading(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleConfirm();
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
		>
			<div
				className="w-full max-w-sm rounded-xl border border-border bg-surface px-6 py-6 shadow-lg"
				onClick={e => e.stopPropagation()}
				onKeyDown={handleKeyDown}
			>
				<div className="flex items-center gap-2">
					<h2 className="m-0 text-base font-semibold text-text">
						{title}
					</h2>
					{/* {securityLevel === 'high' && (
						<span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
							High security
						</span>
					)} */}
				</div>

				<p className="mt-3 text-sm text-muted">{text}</p>

				{securityLevel === 'high' && (
					<div className="mt-4 flex flex-col gap-1.5">
						<label
							htmlFor="security-confirm-password"
							className="text-xs font-medium text-muted"
						>
							Confirm your password to proceed
						</label>
						<input
							ref={inputRef}
							id="security-confirm-password"
							type="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							autoComplete="current-password"
							disabled={loading}
							className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-accent disabled:opacity-60"
						/>
					</div>
				)}

				{error && (
					<p className="mt-3 text-sm text-danger">{error}</p>
				)}

				<div className="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onClick={onCancel}
						disabled={loading}
						className="rounded px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
					>
						Cancel
					</button>

					<button
						type="button"
						onClick={handleConfirm}
						disabled={loading}
						className="rounded bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? 'Confirming...' : 'Confirm'}
					</button>
				</div>
			</div>
		</div>
	);
}