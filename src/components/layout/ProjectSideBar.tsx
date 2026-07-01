'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft, ListTodo, Users, Settings, BadgeInfo } from 'lucide-react';

export default function ProjectSidebar() {
	const pathname = usePathname();
	const params = useParams<{ id: string }>();
	const projectId = params.id;

	const navigation = [
        {
			label: 'Project Details',
			href: `/projects/${projectId}/details`,
			icon: BadgeInfo,
		},
		{
			label: 'Board',
			href: `/projects/${projectId}`,
			icon: ListTodo,
		},
		{
			label: 'Members',
			href: `/projects/${projectId}/members`,
			icon: Users,
		},
		{
			label: 'Settings',
			href: `/projects/${projectId}/settings`,
			icon: Settings,
		},
	];

	return (
		<aside className="flex w-64 flex-col border-r border-border bg-surface">
			<div className="flex h-16 w-full items-center border-b border-border">
				<Link
					href="/projects"
					className="mx-3 flex flex-1 items-center gap-2 rounded-lg p-2 text-sm font-medium text-muted transition-colors hover:bg-bg hover:text-text"
				>
					<ArrowLeft className="h-4 w-4 shrink-0" />
					Back to Projects
				</Link>
			</div>

			<nav className="flex-1 p-3">
				<div className="flex flex-col gap-1">
					{navigation.map(item => {
						const Icon = item.icon;
						const active = pathname === item.href;

						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex w-full items-center justify-start gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
									active
										? 'bg-accent text-white'
										: 'text-text hover:bg-bg'
								}`}
							>
								<Icon className="h-5 w-5 shrink-0" />
								<span className="truncate">{item.label}</span>
							</Link>
						);
					})}
				</div>
			</nav>
		</aside>
	);
}