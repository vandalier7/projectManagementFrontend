'use client';

import type { ReactNode } from 'react';
import type { Project } from '@/types';
import type { ImageUpload } from '../../hooks/useImageUpload';
import type { ThemeColorDraft } from '../../hooks/useThemeColorDraft';
import ProjectCard from '../ProjectCard';
import ProjectOverview, { type OverviewProject } from '../ProjectOverview';
import ImageUploadControl from './ImageUploadControl';
import ThemeColorPicker from './ThemeColorPicker';

// Sample figures for the dashboard preview, so the layout shows realistic content.
const PREVIEW_STATS: Pick<OverviewProject, 'start_date' | 'budget' | 'spent' | 'tasks' | 'members'> = {
	start_date: '2025-01-01',
	budget: '50000',
	spent: '18500',
	tasks: [
		{ status: 'done', due_date: null },
		{ status: 'in_progress', due_date: null },
		{ status: 'todo', due_date: null },
	],
	members: [{}, {}],
};

function SettingCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
			<div className="flex flex-col gap-1">
				<span className="text-sm font-semibold text-text">{title}</span>
				<p className="m-0 text-xs text-muted">{description}</p>
			</div>
			{children}
		</div>
	);
}

/**
 * Logo, banner and theme colour, with live previews of the dashboard header
 * and the project card using the unsaved choices.
 */
export default function CustomizationSection({
	project,
	logo,
	banner,
	color,
}: {
	project: Project;
	logo: ImageUpload;
	banner: ImageUpload;
	color: ThemeColorDraft;
}) {
	const bannerUrl = banner.previewUrl ?? project.banner_url;

	return (
		<div className="flex flex-col gap-4">
			<SettingCard title="Logo" description="Shown in the app bar on every page of this project.">
				<ImageUploadControl upload={logo} label="Logo" />
			</SettingCard>

			<SettingCard
				title="Banner Image"
				description="Shown on the project card and the project dashboard header. For best results, use 16:9 aspect ratio."
			>
				<ProjectOverview
					previewThemeColor={color.active}
					project={{
						id: project.id,
						name: project.name,
						description: project.description,
						status: project.status,
						lead: project.lead,
						banner_url: bannerUrl,
						...PREVIEW_STATS,
					}}
				/>

				<div className="flex flex-col gap-2">
					<span className="text-xs text-muted">Project card preview</span>
					<div className="flex items-start gap-6">
						<div className="w-90 shrink-0">
							<ProjectCard
								project={{ id: project.id, name: project.name, status: project.status, lead: project.lead }}
								bannerUrl={bannerUrl}
								themeColor={color.active}
							/>
						</div>
						<ThemeColorPicker draft={color} />
					</div>
				</div>

				<ImageUploadControl upload={banner} label="Banner" />
			</SettingCard>
		</div>
	);
}
