export type SystemRole = 'admin' | 'team_member';

/** A user record as returned by /users and /login. */
export interface User {
	id: number;
	username: string;
	email: string;
	full_name: string;
	phone: string | null;
	department: string | null;
	system_role: SystemRole;
	status: string;
	avatar_url: string | null;
	profile_completed: boolean;
	must_change_password: boolean;
}

/** The minimal user shape embedded in other records (assignee, lead…). */
export interface UserSummary {
	id: number;
	full_name: string;
}
