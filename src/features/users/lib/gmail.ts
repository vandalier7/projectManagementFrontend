/**
 * Opens Gmail's compose window in a new tab. Used to send credentials to a
 * user, since the app doesn't send these emails itself.
 */

export interface GeneratedCredentials {
	email: string;
	password: string;
}

export function openCredentialsEmail(credentials: GeneratedCredentials) {
	const to = encodeURIComponent(credentials.email);
	const subject = encodeURIComponent('Your new temporary password');
	const body = encodeURIComponent(
		`Hello,

Your password has been reset by an administrator.

Please log in using:

Email: ${credentials.email}
Temporary Password: ${credentials.password}

You will be asked to set a new password after your next login.

Thank you.`
	);

	window.open(
		`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`,
		'_blank'
	);
}

export function openGmailCompose(email: string) {
	const to = encodeURIComponent(email);

	window.open(
		`https://mail.google.com/mail/?view=cm&fs=1&to=${to}`,
		'_blank'
	);
}
