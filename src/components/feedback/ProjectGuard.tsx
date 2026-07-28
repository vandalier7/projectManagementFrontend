'use client';

import { ReactNode } from 'react';
import { FolderLock, FolderX } from 'lucide-react';

import PageLoading from './PageLoading';
import PageNotice from './PageNotice';
import { useSetBoardState, useSetAppBarActions, useSetBoardTitle, useSetBoardTitleAdornment } from '@/components/layout/AppBarActionsContext';
import { ApiError } from '@/lib/api';

interface ProjectGuardProps {
	isLoading: boolean;
	error?: ApiError;
	children: ReactNode;
}

export default function ProjectGuard({
	isLoading,
	error,
	children,
}: ProjectGuardProps) {
	const boardState =
		isLoading
			? 'loading'
			: error?.status === 403
				? 'access_denied'
				: error?.status === 404
					? 'not_found'
					: 'ready';

	useSetBoardState(boardState);
    
    const title =
	boardState === 'ready'
		? null
		: '';

    useSetBoardTitle(title);

    useSetBoardTitleAdornment(
        boardState === 'ready'
            ? undefined
            : null
    );

    useSetAppBarActions(
        boardState === 'ready'
            ? undefined
            : null
    );

	if (isLoading) {
		return <PageLoading />;
	}

	if (error?.status === 403) {
		return (
			<PageNotice
				icon={FolderLock}
				title="Access Denied"
				description="You do not have permission to view this project."
			/>
		);
	}

	if (error?.status === 404) {
		return (
			<PageNotice
				icon={FolderX}
				title="Project Not Found"
				description="This project does not exist."
			/>
		);
	}

	return <>{children}</>;
}