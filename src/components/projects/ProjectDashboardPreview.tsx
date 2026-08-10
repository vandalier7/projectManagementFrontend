'use client';

import { useMemo } from 'react';
import ProjectHeaderCard from '@/components/projects/ProjectHeaderCard';
import {
	Users,
	Calendar,
	Wallet,
	TrendingUp,
	AlertTriangle,
	CheckCircle2,
} from 'lucide-react';

interface Task {
	id: number;
	status: 'todo' | 'in_progress' | 'submitted' | 'done' | 'closed';
	due_date: string | null;
}

interface Member {
	id: number;
	user: {
		id: number;
		full_name: string;
	};
}

interface Lead {
	id: number;
	full_name: string;
	department: string | null;
}

export interface DashboardPreviewProject {
	id: number;
	name: string;
	description: string | null;
	status: string;
	start_date: string | null;
	end_date: string | null;
	budget: string | null;
	spent: string | null;
	lead_id: number;
	lead: Lead | null;
	tasks: Task[];
	members: Member[];
	banner_url: string | null;
	logo_url: string | null;
	theme_color?: string | null;
}

interface ProjectDashboardPreviewProps {
	project: DashboardPreviewProject;
}

function daysSince(dateStr: string): number {
	const start = new Date(dateStr);
	const today = new Date();
	const ms = today.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
	return Math.max(0, Math.floor(ms / 86400000));
}

function formatMoney(value: string | null): string {
	const n = Number(value ?? 0);
	return n.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	});
}

export default function ProjectDashboardPreview({ project }: ProjectDashboardPreviewProps) {
	const stats = useMemo(() => {
		const tasks = project.tasks ?? [];
		const startOfToday = new Date(new Date().toDateString());

		const active = tasks.filter((t) =>
			['todo', 'in_progress', 'submitted'].includes(t.status)
		).length;

		const done = tasks.filter((t) => t.status === 'done').length;

		const overdue = tasks.filter(
			(t) =>
				t.due_date &&
				!['submitted', 'done', 'closed'].includes(t.status) &&
				new Date(t.due_date) < startOfToday
		).length;

		return { active, done, overdue };
	}, [project.tasks]);

	const budgetPercent = useMemo(() => {
		if (!project.budget) return 0;

		const budget = Number(project.budget);
		const spent = Number(project.spent ?? 0);

		if (!budget) return 0;

		return Math.min(100, Math.round((spent / budget) * 100));
	}, [project.budget, project.spent]);

	const runningDays = project.start_date ? daysSince(project.start_date) : null;

	return (
		<div className="grid gap-4 grid-rows-[2fr_1fr]">
			{/* ================= HEADER ================= */}

			<div className="grid grid-cols-[3fr_1fr] gap-4">
				<ProjectHeaderCard
					project={project}
					bannerUrl={project.banner_url}
					themeColor={project.theme_color ?? undefined}
				/>

				<div className="flex flex-col gap-4">
					<div className="bg-surface border border-border rounded-xl p-5 flex-1 flex flex-col justify-center">
						<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
							<Calendar size={14} />
							Running
						</div>

						<div className="mt-2 text-4xl font-mono font-semibold">
							{runningDays !== null ? `${runningDays}d` : '—'}
						</div>
					</div>

					<div className="bg-surface border border-border rounded-xl p-5 flex-1">
						<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
							<Wallet size={14} />
							Budget
						</div>

						<div className="mt-3 text-sm font-semibold">
							{formatMoney(project.spent)}
						</div>

						<div className="text-xs text-muted">
							of {formatMoney(project.budget)}
						</div>

						<div className="mt-4 h-2 rounded-full bg-bg overflow-hidden">
							<div
								className={`h-full rounded-full ${
									budgetPercent >= 100 ? 'bg-danger' : 'bg-accent'
								}`}
								style={{ width: `${budgetPercent}%` }}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* ================= BOTTOM ================= */}

			<div className="grid grid-cols-[3fr_1fr] gap-4">
				<div className="bg-surface border border-border rounded-xl p-6">
					<div className="text-xs uppercase tracking-wide text-muted mb-6">
						Task Overview
					</div>

					<div className="grid grid-cols-3">
						<div className="flex flex-col items-center">
							<TrendingUp size={20} className="text-accent mb-2" />
							<div className="text-4xl font-mono font-semibold">{stats.active}</div>
							<div className="mt-1 text-xs uppercase tracking-wide text-muted">Active</div>
						</div>

						<div className="flex flex-col items-center">
							<AlertTriangle
								size={20}
								className={stats.overdue ? 'text-danger mb-2' : 'text-muted mb-2'}
							/>
							<div className={`text-4xl font-mono font-semibold ${stats.overdue ? 'text-danger' : ''}`}>
								{stats.overdue}
							</div>
							<div className={`mt-1 text-xs uppercase tracking-wide ${stats.overdue ? 'text-danger' : 'text-muted'}`}>
								Overdue
							</div>
						</div>

						<div className="flex flex-col items-center">
							<CheckCircle2 size={20} className="text-green-600 mb-2" />
							<div className="text-4xl font-mono font-semibold text-green-600">{stats.done}</div>
							<div className="mt-1 text-xs uppercase tracking-wide text-muted">Done</div>
						</div>
					</div>
				</div>

				<div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-center items-center">
					<Users size={24} className="text-accent mb-3" />
					<div className="text-5xl font-mono font-semibold">{project.members?.length ?? 7}</div>
					<div className="mt-2 text-xs uppercase tracking-wide text-muted">Members</div>
				</div>
			</div>
		</div>
	);
}