import type { SystemRole } from './user';
import type { Task } from './task';

export type SubmissionMode = 'require' | 'no_require' | 'match_last';

export interface ProjectMember {
	id: number;
	user: {
		id: number;
		full_name: string;
		username?: string;
		system_role: SystemRole;
		email: string;
		phone: string | null;
		department: string | null;
		avatar_url: string | null;
		profile_completed: boolean;
	};
}

export interface ProjectLead {
	id: number;
	full_name: string;
	department: string | null;
}

/** A project in a list (GET /projects). */
export interface ProjectSummary {
	id: number;
	name: string;
	description: string | null;
	status: string;
	start_date: string | null;
	end_date: string | null;
	budget: string | null;
	spent: string | null;
	lead_id: number;
	lead: ProjectLead | null;
	is_system: boolean;
	task_default_submission_mode: SubmissionMode;
	display_deleted_user_names: boolean;
	logo_url: string | null;
	banner_url: string | null;
	theme_color: string | null;
}

/** A single project with its board (GET /projects/{id}). */
export interface Project extends ProjectSummary {
	tasks: Task[];
	members: ProjectMember[];
}
