'use client';

import MyPriorityTasks from "@/components/dashboard/MyPriorityTasks";
import SystemProjectTasks from "@/components/dashboard/SystemProjectTasks";

export default function DashboardPage() {
	return (
		<div className="grid grid-cols-2 gap-4 h-full items-start">
			<SystemProjectTasks />
			<MyPriorityTasks />
		</div>
	);
}