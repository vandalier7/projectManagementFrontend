'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, Calendar, CheckCircle2, TrendingUp, Users, Wallet } from 'lucide-react';
import type { ProjectLead, TaskStatus } from '@/types';
import { budgetPercent, formatMoney, runningDays, taskOverview } from '../lib/projectStats';
import ProjectHeaderCard from './ProjectHeaderCard';

/** The fields ProjectOverview needs — a full Project works, and so does preview data. */
export interface OverviewProject {
	id: number;
	name: string;
	description: string | null;
	status: string;
	start_date: string | null;
	budget: string | null;
	spent: string | null;
	lead: Pick<ProjectLead, 'full_name'> | null;
	banner_url: string | null;
	tasks: { status: TaskStatus; due_date: string | null }[];
	members: unknown[];
}

const CARD = 'bg-surface border border-border rounded-xl';
const CARD_LINK = 'hover:border-accent hover:bg-accent/5 transition-colors';
const LABEL = 'text-xs uppercase tracking-wide text-muted';

/** Wraps children in a link when `href` is set, otherwise a plain box. */
function Tile({ href, className, children }: { href?: string; className: string; children: ReactNode }) {
	return href ? (
		<Link href={href} className={`${className} ${CARD_LINK} no-underline text-text`}>
			{children}
		</Link>
	) : (
		<div className={className}>{children}</div>
	);
}

function Metric({ icon, value, label, tone = '' }: { icon: ReactNode; value: number; label: string; tone?: string }) {
	return (
		<div className="flex flex-col items-center">
			{icon}
			<div className={`text-4xl font-mono font-semibold ${tone}`}>{value}</div>
			<div className={`mt-1 text-xs uppercase tracking-wide ${tone || 'text-muted'}`}>{label}</div>
		</div>
	);
}

/**
 * Project dashboard: header with banner, running time, budget, task overview
 * and member count. Pass `linked` to make the task and member tiles navigate
 * to those pages (the real dashboard); leave it off for a static preview.
 */
export default function ProjectOverview({
	project,
	linked = false,
	previewThemeColor,
	className = '',
}: {
	project: OverviewProject;
	linked?: boolean;
	/** Tints the header with a not-yet-saved theme colour (settings preview). */
	previewThemeColor?: string | null;
	className?: string;
}) {
	const stats = taskOverview(project.tasks);
	const percent = budgetPercent(project.budget, project.spent);
	const days = runningDays(project.start_date);

	return (
		<div className={`grid gap-4 grid-rows-[2fr_1fr] ${className}`}>
			<div className="grid grid-cols-[3fr_1fr] gap-4">
				<ProjectHeaderCard project={project} bannerUrl={project.banner_url} themeColor={previewThemeColor ?? undefined} />

				<div className="flex flex-col gap-4">
					<div className={`${CARD} p-5 flex-1 flex flex-col justify-center`}>
						<div className={`flex items-center gap-2 ${LABEL}`}>
							<Calendar size={14} />
							Running
						</div>
						<div className="mt-2 text-4xl font-mono font-semibold">{days !== null ? `${days}d` : '—'}</div>
					</div>

					<div className={`${CARD} p-5 flex-1`}>
						<div className={`flex items-center gap-2 ${LABEL}`}>
							<Wallet size={14} />
							Budget
						</div>
						<div className="mt-3 text-sm font-semibold">{formatMoney(project.spent)}</div>
						<div className="text-xs text-muted">of {formatMoney(project.budget)}</div>
						<div className="mt-4 h-2 rounded-full bg-bg overflow-hidden">
							<div className={`h-full rounded-full ${percent >= 100 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${percent}%` }} />
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-[3fr_1fr] gap-4">
				<Tile href={linked ? `/projects/${project.id}` : undefined} className={`${CARD} p-6 text-left`}>
					<div className={`${LABEL} mb-6 text-center`}>Task Overview</div>
					<div className="grid grid-cols-3">
						<Metric icon={<TrendingUp size={20} className="text-accent mb-2" />} value={stats.active} label="Active" />
						<Metric
							icon={<AlertTriangle size={20} className={`${stats.overdue ? 'text-danger' : 'text-muted'} mb-2`} />}
							value={stats.overdue}
							label="Overdue"
							tone={stats.overdue ? 'text-danger' : ''}
						/>
						<Metric icon={<CheckCircle2 size={20} className="text-green-600 mb-2" />} value={stats.done} label="Done" tone="text-green-600" />
					</div>
				</Tile>

				<Tile href={linked ? `/projects/${project.id}/members` : undefined} className={`${CARD} p-6 flex flex-col justify-center items-center`}>
					<Users size={24} className="text-accent mb-3" />
					<div className="text-5xl font-mono font-semibold">{project.members.length}</div>
					<div className={`mt-2 ${LABEL}`}>Members</div>
				</Tile>
			</div>
		</div>
	);
}
