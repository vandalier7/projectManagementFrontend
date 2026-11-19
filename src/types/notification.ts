export interface AppNotification {
	id: number;
	project_id: number;
	project_name: string | null;
	type: string;
	title: string;
	body: string | null;
	action_url: string | null;
	created_at: string;
	read_at: string | null;
}

export interface NotificationsResponse {
	notifications: AppNotification[];
	unread_count: number;
}
