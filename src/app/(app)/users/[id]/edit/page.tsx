'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { apiClient } from '@/lib/api';
import SecurityConfirmation from '@/components/SecurityConfirmationModal';

const REQUIRED_EMAIL_DOMAIN = '@g.batstate-u.edu.ph';

interface UserRecord {
	id: number;
	full_name: string;
	username: string;
	system_role: 'admin' | 'team_member';
	email: string;
	phone: string | null;
	department: string | null;
}

export default function EditUserPage() {
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const userId = params.id;

	const { data: user, isLoading, error: loadError } = useSWR<UserRecord>(
		userId ? `/users/${userId}` : null
	);

	const [username, setUsername] = useState('');
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!user) return;

		setUsername(user.username ?? '');
		setFullName(user.full_name ?? '');
		setEmail(user.email ?? '');
		setPhone(user.phone ?? '');
	}, [user]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		setError('');

		if (!email.toLowerCase().endsWith(REQUIRED_EMAIL_DOMAIN)) {
			setError(`Email must end with ${REQUIRED_EMAIL_DOMAIN}`);
			return;
		}

		setConfirmOpen(true);
	};

	const handleConfirm = async (password?: string) => {
		setSaving(true);
		setError('');

		try {
			await apiClient(`/users/${userId}`, {
				method: 'PUT',
				body: JSON.stringify({
					username,
					full_name: fullName,
					email,
					phone: phone || null,
					password,
				}),
			});

			setConfirmOpen(false);
			router.push('/users');
		} catch (err: any) {
			setError(err.message);
			setConfirmOpen(false);
		} finally {
			setSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center text-muted">
				Loading...
			</div>
		);
	}

	if (loadError || !user) {
		return (
			<div className="flex h-full items-center justify-center text-muted">
				User not found.
			</div>
		);
	}

	return (
		<div className="flex h-full items-center justify-center">
			<div className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
				<form onSubmit={handleSubmit} className="flex flex-col gap-5">
					<div>
						<h1 className="text-xl font-semibold">Edit User</h1>
						<p className="mt-1 text-sm text-muted">
							Update this user&apos;s basic details.
						</p>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium">Full Name</label>
						<input
							type="text"
							required
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium">Username</label>
						<input
							type="text"
							required
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium">Email</label>
						<input
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							pattern={`.+${REQUIRED_EMAIL_DOMAIN.replace('.', '\\.')}$`}
							title={`Email must end with ${REQUIRED_EMAIL_DOMAIN}`}
							className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
						/>
						<p className="text-xs text-muted">
							Must be a {REQUIRED_EMAIL_DOMAIN} address.
						</p>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium">Phone</label>
						<input
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
							placeholder="Optional"
						/>
					</div>

					{error && <p className="text-sm text-danger">{error}</p>}

					<div className="flex gap-3">
						<button
							type="submit"
							disabled={saving}
							className="flex-1 rounded-lg bg-accent py-2.5 text-white font-medium hover:bg-accent-hover disabled:opacity-50"
						>
							{saving ? 'Saving...' : 'Save Changes'}
						</button>

						<button
							type="button"
							onClick={() => router.push('/users')}
							className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-text"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>

			<SecurityConfirmation
				open={confirmOpen}
				title="Save Changes"
				text={`Enter your password to confirm updating ${user.full_name}'s details.`}
				securityLevel="high"
				onConfirm={handleConfirm}
				onCancel={() => setConfirmOpen(false)}
			/>
		</div>
	);
}