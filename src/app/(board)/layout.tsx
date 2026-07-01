import BoardShell from '@/components/layout/BoardShell';

export default function ProjectLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <BoardShell>{children}</BoardShell>;
}