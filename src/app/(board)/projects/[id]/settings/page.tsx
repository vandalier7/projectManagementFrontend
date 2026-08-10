'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { useSetBoardTitle, useSetBoardLogo, useSetBoardThemeColor, useBoardState, useSetBoardState } from '@/components/layout/AppBarActionsContext';
import ProjectGuard from '@/components/feedback/ProjectGuard';
import ProjectHeaderCard from '@/components/projects/ProjectHeaderCard';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectDashboardPreview from '@/components/projects/ProjectDashboardPreview';
import ProjectDetailsForm from '@/components/projects/ProjectDetailsForm';
import { useMemo } from 'react';
import { generateThemeShades, getContrastColor } from '@/lib/generateThemeShades';
import { mixHexColors } from '@/lib/mixHexColors';

interface Project {
	id: number;
	name: string;
	description: string | null;
	status: string;
	start_date: string | null;
	end_date: string | null;
	budget: string | null;
	spent: string | null;
	is_system: boolean;
	banner_url: string | null;
	logo_url: string | null;
	theme_color: string | null;
	lead_id: number;
	lead?: { id: number; full_name: string; department: string | null } | null;
	tasks: { id: number; status: 'todo' | 'in_progress' | 'submitted' | 'done' | 'closed'; due_date: string | null }[];
	members: { id: number; user: { id: number; full_name: string } }[];
}

// TODO: replace with your real chipStyles import — this is a placeholder
// so the ProjectCard preview renders with *some* styling in the meantime.
const chipStyles: Record<string, string> = {
	active: 'bg-green-100 text-green-700',
	on_hold: 'bg-yellow-100 text-yellow-700',
	completed: 'bg-blue-100 text-blue-700',
};

// Fallback shown in the picker before any color has ever been extracted or set.
const DEFAULT_COLOR_INPUT = '#6366F1';

// Fixed base surface color that the tinted --surface override is mixed from.
// Matches the app's default :root --surface. Intentionally NOT palette-switched
// based on accent lightness.
const BASE_SURFACE = '#fff7f2';

// Fixed base border color that the tinted --border override is mixed from.
// Matches the app's default :root --border.
const BASE_BORDER = '#E0E0E0';

// Wash ratios: how much accent gets blended into each base color.
// Border is tinted a bit stronger than surface so it stays visible against
// the (more subtly tinted) card background.
const SURFACE_TINT_RATIO = 0.08;
const BORDER_TINT_RATIO = 0.18;

interface DummySettingProps {
	title: string;
	description: string;
	defaultEnabled?: boolean;
	canEdit: boolean; // admin/lead
}

export function DummySetting({
	title,
	description,
	defaultEnabled = false,
	canEdit,
}: DummySettingProps) {
	const [enabled, setEnabled] = useState(defaultEnabled);

	return (
		<div className="flex flex-col gap-2 rounded-xl border-border p-4">
			<div className="flex items-center justify-between gap-4">
				<span className="text-sm font-medium text-text">
					{title}
				</span>

				<label className="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						className="sr-only peer"
						checked={enabled}
						disabled={!canEdit}
						onChange={() => setEnabled(prev => !prev)}
					/>
					{/* Track: bg-accent here is just a solid fill color, not text-on-accent,
					    so there's no contrast/readability concern — no text-accent-foreground needed. */}
					<div
						className="
							h-5 w-9 rounded-full bg-muted transition-colors
							peer-checked:bg-accent
							peer-disabled:opacity-50
						"
					/>
					{/* Knob: intentionally always bg-white regardless of accent, for contrast against the track */}
					<div
						className="
							absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white
							transition-transform
							peer-checked:translate-x-4
						"
					/>
				</label>
			</div>

			<p className="text-xs text-muted leading-relaxed">
				{description}
			</p>

			{!canEdit && (
				<p className="text-[11px] text-muted opacity-70">
					Only admins/leads can change this setting.
				</p>
			)}
		</div>
	);
}

const REDIRECT_DELAY_MS = 4000;

export default function ProjectSettingsPage() {
	const params = useParams();
	const router = useRouter();
	const projectId = params.id;

	const [user, setUser] = useState<User | null>(null);
	const [confirmText, setConfirmText] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isDeleted, setIsDeleted] = useState(false);

	const [bannerFile, setBannerFile] = useState<File | null>(null);
	const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
	const [bannerUploading, setBannerUploading] = useState(false);
	const [bannerError, setBannerError] = useState<string | null>(null);
	const bannerInputRef = useRef<HTMLInputElement>(null);

	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
	const [logoUploading, setLogoUploading] = useState(false);
	const [logoError, setLogoError] = useState<string | null>(null);
	const logoInputRef = useRef<HTMLInputElement>(null);

	// null = no pending edit; picker shows project.theme_color (or the default) instead.
	const [pendingColor, setPendingColor] = useState<string | null>(null);
	const [colorSaving, setColorSaving] = useState(false);
	const [colorError, setColorError] = useState<string | null>(null);



	useEffect(() => {
		setUser(getUser());
	}, []);

	const { data: project, error, isLoading, mutate } = useSWR<Project>(
		user ? `/projects/${projectId}?user=${user.id}` : null
	);

	useSetBoardTitle(project?.name ? `${project.name} / Settings` : null);
	useSetBoardLogo(logoPreviewUrl ?? project?.logo_url ?? null);

	useEffect(() => {
		if (!isDeleted) return;

		const timeout = setTimeout(() => {
			router.push('/projects');
		}, REDIRECT_DELAY_MS);

		return () => clearTimeout(timeout);
	}, [isDeleted, router]);

	const isAdmin = user?.system_role === 'admin';
	const canConfirmDelete = project ? confirmText === project.name : false;
	const isLead = project?.lead?.id === user?.id;

	// What the color picker + previews should actually show: a pending edit
	// takes priority, then whatever's saved on the project, then the default.
	const activeColor = pendingColor ?? project?.theme_color ?? DEFAULT_COLOR_INPUT;
	const hasColorChange = pendingColor !== null && pendingColor !== (project?.theme_color ?? DEFAULT_COLOR_INPUT);

	// Push the active color (including any unsaved pending edit, so the
	// shell previews live while picking) up into the shared board context,
	// so BoardShell can tint the sidebar/appbar to match this page's preview.
	useSetBoardThemeColor(project ? activeColor : null);

	// Scoped, page-local theme override (NOT wired into any shared layout/shell).
	// Tints --accent / --accent-hover / --accent-foreground / --surface / --border
	// from fixed base colors. No light/dark palette flip.
	const previewThemeStyle = useMemo(() => {
		const shades = generateThemeShades(activeColor);
		const tintedSurface = mixHexColors(BASE_SURFACE, shades.accent, SURFACE_TINT_RATIO);
		const tintedBorder = mixHexColors(BASE_BORDER, shades.accent, BORDER_TINT_RATIO);

		return {
			'--accent': shades.accent,
			'--accent-hover': shades.accentHover,
			'--accent-foreground': getContrastColor(shades.accent),
			'--surface': tintedSurface,
			'--border': tintedBorder,
		} as React.CSSProperties;
	}, [activeColor]);

	const handleDelete = async () => {
		if (!project || !canConfirmDelete) return;

		setIsDeleting(true);
		setDeleteError(null);

		try {
			await apiClient(`/projects/${project.id}`, { method: 'DELETE' });
			setIsDeleted(true);
		} catch (err) {
			setDeleteError(err instanceof Error ? err.message : 'Failed to delete project.');
			setIsDeleting(false);
		}
	};

	const handleBannerPick = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setBannerError(null);
		setBannerFile(file);
		setBannerPreviewUrl(URL.createObjectURL(file));
	};

	const handleBannerDiscard = () => {
		if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
		setBannerFile(null);
		setBannerPreviewUrl(null);
		setBannerError(null);
		if (bannerInputRef.current) bannerInputRef.current.value = '';
	};

	const handleBannerConfirm = async () => {
		if (!bannerFile || !project) return;

		setBannerUploading(true);
		setBannerError(null);

		const formData = new FormData();
		formData.append('banner', bannerFile);

		try {
			await apiClient(`/projects/${project.id}/banner`, {
				method: 'POST',
				body: formData,
			});

			if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
			setBannerFile(null);
			setBannerPreviewUrl(null);
			mutate();
		} catch (err: any) {
			setBannerError(err.message ?? 'Failed to upload banner.');
		} finally {
			setBannerUploading(false);
		}
	};

	const handleLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setLogoError(null);
		setLogoFile(file);
		setLogoPreviewUrl(URL.createObjectURL(file));
	};

	const handleLogoDiscard = () => {
		if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
		setLogoFile(null);
		setLogoPreviewUrl(null);
		setLogoError(null);
		if (logoInputRef.current) logoInputRef.current.value = '';
	};

	const handleLogoConfirm = async () => {
		if (!logoFile || !project) return;

		setLogoUploading(true);
		setLogoError(null);

		const formData = new FormData();
		formData.append('logo', logoFile);

		try {
			await apiClient(`/projects/${project.id}/logo`, {
				method: 'POST',
				body: formData,
			});

			if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
			setLogoFile(null);
			setLogoPreviewUrl(null);
			mutate();
		} catch (err: any) {
			setLogoError(err.message ?? 'Failed to upload logo.');
		} finally {
			setLogoUploading(false);
		}
	};

	const handleColorPick = (e: React.ChangeEvent<HTMLInputElement>) => {
		setColorError(null);
		setPendingColor(e.target.value);
	};

	const handleColorDiscard = () => {
		setPendingColor(null);
		setColorError(null);
	};

	const handleColorConfirm = async () => {
		if (!project || pendingColor === null) return;

		setColorSaving(true);
		setColorError(null);

		try {
			const updated = await apiClient(`/projects/${project.id}/theme-color`, {
				method: 'PATCH',
				body: JSON.stringify({ theme_color: pendingColor }),
			});

			// Feed the server's confirmed value directly into the SWR cache
			// (second arg `false` skips revalidation) so the UI reflects the
			// change immediately, instead of clearing pendingColor first and
			// briefly falling back to the stale project.theme_color while a
			// background refetch is still in flight.
			await mutate(updated, false);
			setPendingColor(null);
		} catch (err: any) {
			setColorError(err.message ?? 'Failed to save theme color.');
		} finally {
			setColorSaving(false);
		}
	};

	if (isDeleted) {
		return (
			<div className="flex flex-col items-start gap-3">
				<p className="text-sm text-text m-0">Project deleted successfully.</p>
				<p className="text-xs text-muted m-0">Redirecting to your projects shortly...</p>
				<button
					className="text-sm font-medium text-accent-foreground bg-accent border-none rounded px-4 py-2 cursor-pointer transition-colors hover:bg-accent-hover"
					onClick={() => router.push('/projects')}
				>
					Go to Projects now
				</button>
			</div>
		);
	}

	return (
		<ProjectGuard
			isLoading={isLoading}
			error={error}
		>
			<div className="flex flex-col gap-8">
				{isAdmin && project && (
					<section className="flex flex-col gap-3">
						<h2 className="m-0 text-base font-semibold text-text">Details</h2>

						<ProjectDetailsForm
							project={{
								id: project.id,
								name: project.name,
								description: project.description,
								budget: project.budget,
								status: project.status,
							}}
							onSaved={(updated) => mutate(updated, false)}
						/>
					</section>
				)}

				{(isAdmin || isLead) && project && !project.is_system && (
					<section className="flex flex-col gap-3" style={previewThemeStyle}>
						<h2 className="m-0 text-base font-semibold text-text">Customization</h2>

						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
								<div className="flex flex-col gap-1">
									<span className="text-sm font-semibold text-text">Logo</span>
									<p className="m-0 text-xs text-muted">
										Shown in the app bar on every page of this project.
									</p>
								</div>

								<div className="flex items-center gap-3">
									<input
										ref={logoInputRef}
										type="file"
										accept="image/*"
										onChange={handleLogoPick}
										className="hidden"
										id="logo-upload-input"
									/>
									<label
										htmlFor="logo-upload-input"
										className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-muted/20"
									>
										Choose Logo Image
									</label>
									{logoFile && (
										<span className="text-xs text-muted truncate max-w-[200px]">
											{logoFile.name}
										</span>
									)}
								</div>

								{logoError && <p className="m-0 text-xs text-danger">{logoError}</p>}

								{logoFile && (
									<div className="flex gap-2">
										<button
											onClick={handleLogoConfirm}
											disabled={logoUploading}
											className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
										>
											{logoUploading ? 'Saving...' : 'Save Logo'}
										</button>
										<button
											onClick={handleLogoDiscard}
											disabled={logoUploading}
											className="rounded px-4 py-2 text-sm font-medium text-muted hover:text-text disabled:opacity-50"
										>
											Discard
										</button>
									</div>
								)}
							</div>

							<div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
								<div className="flex flex-col gap-1">
									<span className="text-sm font-semibold text-text">Banner Image</span>
									<p className="m-0 text-xs text-muted">
										Shown on the project card and the project dashboard header. For best results, use 16:9 aspect ratio.
									</p>
								</div>

								<ProjectDashboardPreview
									project={{
										id: project.id,
										name: project.name,
										description: project.description,
										status: project.status,
										start_date: '2025-01-01',
										end_date: null,
										budget: '50000',
										spent: '18500',
										lead_id: project.lead_id,
										lead: project.lead ?? null,
										tasks: [
											{ id: 1, status: 'done', due_date: null },
											{ id: 2, status: 'in_progress', due_date: null },
											{ id: 3, status: 'todo', due_date: null },
										],
										members: [
											{ id: 1, user: { id: 1, full_name: 'Preview Member' } },
											{ id: 2, user: { id: 2, full_name: 'Preview Member' } },
										],
										banner_url: bannerPreviewUrl ?? project.banner_url,
										logo_url: logoPreviewUrl ?? project.logo_url,
										theme_color: activeColor,
									}}
								/>

								<div className="flex flex-col gap-2">
									<span className="text-xs text-muted">Project card preview</span>
									<div className="flex items-start gap-6">
										<div className="w-90 shrink-0">
											<ProjectCard
												project={{
													id: project!.id,
													name: project!.name,
													status: project!.status,
													lead: project!.lead,
												}}
												chipStyles={chipStyles}
												bannerUrl={bannerPreviewUrl ?? project?.banner_url}
												themeColor={activeColor}
											/>
										</div>

										<div className="flex flex-col gap-2 pt-1">
											<span className="text-xs font-medium text-text">Theme Color</span>
											<p className="m-0 text-xs text-muted max-w-[180px]">
												Used as an accent all across the project.
											</p>

											<div className="flex items-center gap-3">
												<label className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border">
													<input
														type="color"
														value={activeColor}
														onChange={handleColorPick}
														className="absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 cursor-pointer"
														aria-label="Pick theme color"
													/>
												</label>
												<span className="font-mono text-xs uppercase text-muted">
													{activeColor}
												</span>
											</div>

											{colorError && <p className="m-0 text-xs text-danger">{colorError}</p>}

											{hasColorChange && (
												<div className="flex gap-2">
													<button
														onClick={handleColorConfirm}
														disabled={colorSaving}
														className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
													>
														{colorSaving ? 'Saving...' : 'Save Color'}
													</button>
													<button
														onClick={handleColorDiscard}
														disabled={colorSaving}
														className="rounded px-4 py-2 text-sm font-medium text-muted hover:text-text disabled:opacity-50"
													>
														Discard
													</button>
												</div>
											)}
										</div>
									</div>
								</div>

								<div className="flex items-center gap-3">
									<input
										ref={bannerInputRef}
										type="file"
										accept="image/*"
										onChange={handleBannerPick}
										className="hidden"
										id="banner-upload-input"
									/>
									<label
										htmlFor="banner-upload-input"
										className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-muted/20"
									>
										Choose Banner Image
									</label>
									{bannerFile && (
										<span className="text-xs text-muted truncate max-w-[200px]">
											{bannerFile.name}
										</span>
									)}
								</div>

								{bannerError && <p className="m-0 text-xs text-danger">{bannerError}</p>}

								{bannerFile && (
									<div className="flex gap-2">
										<button
											onClick={handleBannerConfirm}
											disabled={bannerUploading}
											className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
										>
											{bannerUploading ? 'Saving...' : 'Save Banner'}
										</button>
										<button
											onClick={handleBannerDiscard}
											disabled={bannerUploading}
											className="rounded px-4 py-2 text-sm font-medium text-muted hover:text-text disabled:opacity-50"
										>
											Discard
										</button>
									</div>
								)}
							</div>
						</div>
					</section>
				)}

				{isAdmin && (
					<section className="flex max-w-lg flex-col gap-3">
						<h2 className="m-0 text-base font-semibold text-danger">Danger Zone</h2>

						<div className="flex flex-col gap-3 rounded-xl border border-danger p-5">
							<p className="m-0 text-xs text-muted">
								Deleting <span className="font-medium text-text">{project?.name}</span> is
								permanent and cannot be undone. All tasks, members, and history for this
								project will be lost.
							</p>

							<label className="flex flex-col gap-1.5">
								<span className="text-xs text-muted">
									Type{' '}
									<span className="font-mono font-medium text-text">
										{project?.name}
									</span>{' '}
									to confirm
								</span>

								<input
									type="text"
									value={confirmText}
									onChange={e => setConfirmText(e.target.value)}
									className="rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-danger"
									placeholder={project?.name}
									autoComplete="off"
								/>
							</label>

							{deleteError && (
								<p className="m-0 text-xs text-danger">
									{deleteError}
								</p>
							)}

							<button
								onClick={handleDelete}
								disabled={!canConfirmDelete || isDeleting}
								className="self-start rounded border-none bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isDeleting ? 'Deleting...' : 'Delete Project'}
							</button>
						</div>
					</section>
				)}
			</div>
		</ProjectGuard>
	);
}