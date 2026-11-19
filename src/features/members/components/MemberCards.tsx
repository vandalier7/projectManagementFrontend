import { UserMinus } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { ProjectMember } from '@/types';
import { completionRate, type MemberStats } from '../lib/memberStats';

const STAT_COL = 'w-16';

const STAT_COLUMNS = ['To Do', 'In Progress', 'Submitted', 'Done', 'Overdue', 'Completion'];

function Contact({ member, size }: { member: ProjectMember; size: 'sm' | 'xs' }) {
	const text = size === 'sm' ? 'text-sm' : 'text-xs';
	return (
		<div className="flex flex-col gap-0.5 min-w-0 flex-1">
			<a href={`mailto:${member.user.email}`} className={`${text} text-accent hover:underline truncate`}>
				{member.user.email}
			</a>
			{member.user.phone && (
				<a href={`tel:${member.user.phone}`} className={`${text} text-muted hover:text-text truncate`}>
					{member.user.phone}
				</a>
			)}
		</div>
	);
}

/** Highlighted card for the project lead. */
export function LeadCard({ member, reserveActionSpace }: { member: ProjectMember; reserveActionSpace: boolean }) {
	return (
		<div className="flex items-center gap-5 bg-surface border border-border rounded-xl px-6 py-6">
			<Avatar name={member.user.full_name} src={member.user.avatar_url} className="h-14 w-14 text-base" />

			<div className="flex flex-col gap-1 min-w-0 w-56 shrink-0">
				<div className="flex items-center gap-2">
					<span className="text-base font-semibold text-text truncate">{member.user.full_name}</span>
					<span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">Lead</span>
				</div>
				{member.user.department && <span className="text-xs text-muted truncate">{member.user.department}</span>}
			</div>

			<Contact member={member} size="sm" />

			{reserveActionSpace && <div className="w-4 shrink-0" />}
		</div>
	);
}

/** Column labels for the stats shown on each MemberRow. */
export function MemberStatsHeader() {
	return (
		<div className="flex items-center gap-4 px-5">
			<div className="w-10 shrink-0" />
			<div className="w-48 shrink-0" />
			<div className="flex-1" />
			<div className="flex items-center gap-5 shrink-0">
				{STAT_COLUMNS.map(label => (
					<span key={label} className={`text-xs text-muted font-medium text-center ${STAT_COL}`}>{label}</span>
				))}
			</div>
			<div className="w-4 shrink-0" />
		</div>
	);
}

function Stat({ value, color }: { value: number | string; color: string }) {
	return (
		<div className={`flex items-center justify-center ${STAT_COL}`}>
			<span className={`text-base font-semibold ${color}`}>{value}</span>
		</div>
	);
}

/**
 * A regular member. Leads and admins (`manageable`) also see task stats and a
 * remove button.
 */
export function MemberRow({
	member,
	stats,
	manageable,
	removing,
	onRemove,
}: {
	member: ProjectMember;
	stats: MemberStats;
	manageable: boolean;
	removing: boolean;
	onRemove: () => void;
}) {
	return (
		<div className="flex items-center gap-4 bg-surface border border-border rounded-xl px-5 py-4">
			<Avatar name={member.user.full_name} src={member.user.avatar_url} />

			<div className="flex flex-col gap-0.5 min-w-0 w-48 shrink-0">
				<span className="text-sm font-semibold text-text truncate">{member.user.full_name}</span>
				{member.user.department && <span className="text-xs text-muted truncate">{member.user.department}</span>}
			</div>

			<Contact member={member} size="xs" />

			{manageable && (
				<>
					<div className="flex items-center gap-5 shrink-0">
						<Stat value={stats.todo} color="text-text" />
						<Stat value={stats.inProgress} color="text-blue-600" />
						<Stat value={stats.submitted} color="text-yellow-600" />
						<Stat value={stats.done} color="text-green-600" />
						<Stat value={stats.overdue} color={stats.overdue > 0 ? 'text-danger' : 'text-muted'} />
						<Stat value={`${completionRate(stats)}%`} color="text-text" />
					</div>

					<button
						onClick={onRemove}
						disabled={removing}
						className="shrink-0 text-muted hover:text-danger transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
						title="Remove member"
					>
						<UserMinus className="h-4 w-4" />
					</button>
				</>
			)}
		</div>
	);
}
