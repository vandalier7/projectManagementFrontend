'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectGuard from '@/components/feedback/ProjectGuard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { buildThemeStyle } from '@/lib/theme/themeStyle';
import ProjectDetailsForm from '@/features/projects/components/ProjectDetailsForm';
import CustomizationSection from '@/features/projects/components/settings/CustomizationSection';
import DeleteProjectSection from '@/features/projects/components/settings/DeleteProjectSection';
import { useImageUpload } from '@/features/projects/hooks/useImageUpload';
import { useProject } from '@/features/projects/hooks/useProject';
import { useProjectBoardChrome } from '@/features/projects/hooks/useProjectBoardChrome';
import { useThemeColorDraft } from '@/features/projects/hooks/useThemeColorDraft';

const REDIRECT_DELAY_MS = 4000;

export default function ProjectSettingsPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const user = useCurrentUser();
	const { data: project, error, isLoading, mutate } = useProject(user ? id : null);
	const [deleted, setDeleted] = useState(false);

	const refresh = () => {
		mutate();
	};
	const logo = useImageUpload(`/projects/${id}/logo`, 'logo', refresh);
	const banner = useImageUpload(`/projects/${id}/banner`, 'banner', refresh);
	const color = useThemeColorDraft(project, mutate);

	// Preview unsaved logo and colour in the app bar and sidebar too.
	useProjectBoardChrome(project, error, {
		section: 'Settings',
		logoUrl: logo.previewUrl,
		themeColor: project ? color.active : null,
	});

	// Theme just the customisation section with the unsaved colour.
	const previewStyle = useMemo(() => buildThemeStyle(color.active), [color.active]);

	useEffect(() => {
		if (!deleted) return;
		const timeout = setTimeout(() => router.push('/projects'), REDIRECT_DELAY_MS);
		return () => clearTimeout(timeout);
	}, [deleted, router]);

	if (deleted) {
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

	const isAdmin = user?.system_role === 'admin';
	const isLead = project != null && project.lead_id === user?.id;

	return (
		<ProjectGuard isLoading={isLoading} error={error}>
			{project && (
				<div className="flex flex-col gap-8">
					{isAdmin && (
						<section className="flex flex-col gap-3">
							<h2 className="m-0 text-base font-semibold text-text">Details</h2>
							<ProjectDetailsForm
								project={project}
								onSaved={updated => mutate(prev => (prev ? { ...prev, ...updated } : prev), false)}
							/>
						</section>
					)}

					{(isAdmin || isLead) && !project.is_system && (
						<section className="flex flex-col gap-3" style={previewStyle}>
							<h2 className="m-0 text-base font-semibold text-text">Customization</h2>
							<CustomizationSection project={project} logo={logo} banner={banner} color={color} />
						</section>
					)}

					{isAdmin && <DeleteProjectSection project={project} onDeleted={() => setDeleted(true)} />}
				</div>
			)}
		</ProjectGuard>
	);
}
