'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FolderKanban, House, Users, ShieldCheck } from 'lucide-react';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';

interface SidebarProps {
	collapsed: boolean;
	onToggle: () => void;
}

export default function Sidebar({
	collapsed,
	onToggle,
}: SidebarProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		setUser(getUser());
	}, []);

	const navigation = [
		{
			label: 'Home',
			href: '/dashboard',
			icon: House,
		},
		{
			label: 'Projects',
			href: '/projects',
			icon: FolderKanban,
		},
		{
			label: 'Users',
			href: '/users',
			icon: Users,
		},
		...(user?.system_role === 'admin'
			? [
					{
						label: 'Admin Account',
						href: '/admin',
						icon: ShieldCheck,
					},
				]
			: []),
	];

	return (
		<aside
			className={`flex flex-col border-r border-border bg-surface transition-all duration-200 ${
				collapsed ? 'w-[72px]' : 'w-64'
			}`}
		>
			<div className="flex h-16 w-full items-center border-b border-border">
				<button
					type="button"
					onClick={onToggle}
					title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					className={`cursor-pointer mx-3 flex items-center rounded-lg p-2 transition-colors hover:bg-bg ${
						collapsed ? '' : 'gap-3 flex-1'
					}`}
				>
					<Image
						src="/logo.png"
						alt="Project Management System"
						width={320}
						height={320}
						className="h-10 w-10 shrink-0 object-contain"
						priority
					/>

					{!collapsed && (
						<span className="truncate text-lg font-semibold text-text">
							Project Management
						</span>
					)}
				</button>
			</div>

			<nav className="flex-1 p-3">
				<div className="flex flex-col gap-1">
					{navigation.map(item => {
						const Icon = item.icon;
						const active = pathname === item.href;

						return (
							<button
								key={item.href}
								type="button"
								onClick={() => router.push(item.href)}
								title={collapsed ? item.label : undefined}
								className={`cursor-pointer flex w-full min-w-0 items-center justify-start rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
									collapsed ? '' : 'gap-3'
								} ${
									active
										? 'bg-accent text-white'
										: 'text-text hover:bg-bg'
								}`}
							>
								<Icon className="h-5 w-5 shrink-0" />

								{!collapsed && <span className="truncate">{item.label}</span>}
							</button>
						);
					})}
				</div>
			</nav>
		</aside>
	);
}