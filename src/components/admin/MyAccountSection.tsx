'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { setUser as persistUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import SecurityConfirmation from '@/components/SecurityConfirmationModal';

interface MyAccountSectionProps {
	user: User;
	onUserUpdated: (user: User) => void;
}

export default function MyAccountSection({ user, onUserUpdated }: MyAccountSectionProps) {
	// --- Email ---
	const [newEmail, setNewEmail] = useState('');
	const [emailError, setEmailError] = useState('');
	const [emailSuccess, setEmailSuccess] = useState('');
	const [emailConfirmOpen, setEmailConfirmOpen] = useState(false);
	const [emailSaving, setEmailSaving] = useState(false);

	const handleEmailSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setEmailError('');
		setEmailSuccess('');

		if (!newEmail || newEmail === user.email) {
			setEmailError('Enter a new, different email address.');
			return;
		}

		setEmailConfirmOpen(true);
	};

	const handleEmailConfirm = async (password?: string) => {
		setEmailSaving(true);
		setEmailError('');

		try {
			const updated = await apiClient('/profile/change-email', {
				method: 'POST',
				body: JSON.stringify({ email: newEmail, password }),
			});

			persistUser(updated);
			onUserUpdated(updated);
			setEmailConfirmOpen(false);
			setNewEmail('');
			setEmailSuccess('Email updated successfully.');
		} catch (err: any) {
			setEmailError(err.message ?? 'Failed to update email.');
			setEmailConfirmOpen(false);
		} finally {
			setEmailSaving(false);
		}
	};

	// --- Password ---
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [passwordSuccess, setPasswordSuccess] = useState('');
	const [passwordSaving, setPasswordSaving] = useState(false);

	const handlePasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordError('');
		setPasswordSuccess('');

		if (newPassword.length < 6) {
			setPasswordError('New password must be at least 6 characters.');
			return;
		}

		if (newPassword !== confirmPassword) {
			setPasswordError('New password and confirmation do not match.');
			return;
		}

		setPasswordSaving(true);

		try {
			await apiClient('/admin/change-password', {
				method: 'POST',
				body: JSON.stringify({
					current_password: currentPassword,
					password: newPassword,
					password_confirmation: confirmPassword,
				}),
			});

			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setPasswordSuccess('Password changed successfully.');
		} catch (err: any) {
			setPasswordError(err.message ?? 'Failed to change password.');
		} finally {
			setPasswordSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<form
				onSubmit={handleEmailSubmit}
				className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
			>
				<div className="flex flex-col gap-1">
					<span className="text-sm font-semibold text-text">Email</span>
					<p className="m-0 text-xs text-muted">
						Current: <span className="font-medium text-text">{user.email}</span>
					</p>
				</div>

				<label className="flex flex-col gap-1.5">
					<span className="text-xs text-muted">New email address</span>
					<input
						type="email"
						required
						value={newEmail}
						onChange={(e) => setNewEmail(e.target.value)}
						className="rounded border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
						placeholder={user.email}
					/>
				</label>

				{emailError && <p className="m-0 text-xs text-danger">{emailError}</p>}
				{emailSuccess && <p className="m-0 text-xs text-green-600">{emailSuccess}</p>}

				<button
					type="submit"
					disabled={emailSaving}
					className="self-start rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
				>
					Save Email
				</button>
			</form>

			<form
				onSubmit={handlePasswordSubmit}
				className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
			>
				<div className="flex flex-col gap-1">
					<span className="text-sm font-semibold text-text">Password</span>
					<p className="m-0 text-xs text-muted">
						Change the password used to log in.
					</p>
				</div>

				<label className="flex flex-col gap-1.5">
					<span className="text-xs text-muted">Current password</span>
					<input
						type="password"
						required
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						className="rounded border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
					/>
				</label>

				<label className="flex flex-col gap-1.5">
					<span className="text-xs text-muted">New password</span>
					<input
						type="password"
						required
						minLength={6}
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						className="rounded border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
					/>
				</label>

				<label className="flex flex-col gap-1.5">
					<span className="text-xs text-muted">Confirm new password</span>
					<input
						type="password"
						required
						minLength={6}
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className="rounded border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
					/>
				</label>

				{passwordError && <p className="m-0 text-xs text-danger">{passwordError}</p>}
				{passwordSuccess && <p className="m-0 text-xs text-green-600">{passwordSuccess}</p>}

				<button
					type="submit"
					disabled={passwordSaving}
					className="self-start rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
				>
					{passwordSaving ? 'Saving...' : 'Change Password'}
				</button>
			</form>

			<SecurityConfirmation
				open={emailConfirmOpen}
				title="Change Email"
				text={`Enter your password to confirm changing your email to ${newEmail}.`}
				securityLevel="high"
				onConfirm={handleEmailConfirm}
				onCancel={() => setEmailConfirmOpen(false)}
			/>
		</div>
	);
}