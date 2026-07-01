'use client';

import {
	createContext,
	Dispatch,
	ReactNode,
	SetStateAction,
	useContext,
	useEffect,
	useState,
} from 'react';

// Each concern (actions, title, title adornment) gets its own read/write
// context pair on purpose: pages that call the setter hooks must never
// re-render just because the *value* changed — otherwise every update
// would re-trigger the effect that sets it, causing an infinite update loop.

const AppBarActionsValueContext = createContext<ReactNode>(null);
const AppBarActionsSetterContext = createContext<Dispatch<SetStateAction<ReactNode>> | null>(null);

const AppBarTitleValueContext = createContext<string | null>(null);
const AppBarTitleSetterContext = createContext<Dispatch<SetStateAction<string | null>> | null>(null);

const AppBarTitleAdornmentValueContext = createContext<ReactNode>(null);
const AppBarTitleAdornmentSetterContext = createContext<Dispatch<SetStateAction<ReactNode>> | null>(null);

export function AppBarActionsProvider({ children }: { children: ReactNode }) {
	const [actions, setActions] = useState<ReactNode>(null);
	const [title, setTitle] = useState<string | null>(null);
	const [titleAdornment, setTitleAdornment] = useState<ReactNode>(null);

	return (
		<AppBarActionsSetterContext.Provider value={setActions}>
			<AppBarActionsValueContext.Provider value={actions}>
				<AppBarTitleSetterContext.Provider value={setTitle}>
					<AppBarTitleValueContext.Provider value={title}>
						<AppBarTitleAdornmentSetterContext.Provider value={setTitleAdornment}>
							<AppBarTitleAdornmentValueContext.Provider value={titleAdornment}>
								{children}
							</AppBarTitleAdornmentValueContext.Provider>
						</AppBarTitleAdornmentSetterContext.Provider>
					</AppBarTitleValueContext.Provider>
				</AppBarTitleSetterContext.Provider>
			</AppBarActionsValueContext.Provider>
		</AppBarActionsSetterContext.Provider>
	);
}

// --- Actions slot ---

// Used by AppShell/BoardShell/AppBar to read whatever the current page has registered.
export function useAppBarActionsValue() {
	return useContext(AppBarActionsValueContext);
}

// Used by individual pages to register their contextual action buttons.
// Automatically clears on unmount/route change so actions don't leak between pages.
export function useSetAppBarActions(actions: ReactNode) {
	const setActions = useContext(AppBarActionsSetterContext);

	if (!setActions) {
		throw new Error('useSetAppBarActions must be used within an AppBarActionsProvider');
	}

	useEffect(() => {
		setActions(actions);

		return () => setActions(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [actions]);
}

// --- Title slot ---

// Used by BoardShell to read whatever the current page has set as the title.
// Falls back to a default (e.g. "Tasks" derived from pathname) if null.
export function useAppBarTitleValue() {
	return useContext(AppBarTitleValueContext);
}

// Used by individual board pages to set the title shown in BoardAppBar
// (e.g. the project name, once loaded). Clears on unmount so a stale
// title doesn't leak into a different project/page.
export function useSetBoardTitle(title: string | null) {
	const setTitle = useContext(AppBarTitleSetterContext);

	if (!setTitle) {
		throw new Error('useSetBoardTitle must be used within an AppBarActionsProvider');
	}

	useEffect(() => {
		setTitle(title);

		return () => setTitle(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [title]);
}

// --- Title adornment slot ---

// Used by BoardShell to read whatever the current page has set as the
// element to render beside the title (e.g. a sync status indicator).
export function useAppBarTitleAdornmentValue() {
	return useContext(AppBarTitleAdornmentValueContext);
}

// Used by individual board pages to set content shown beside the title
// in BoardAppBar (e.g. a sync status pill). Clears on unmount so it
// doesn't leak into a different project/page.
export function useSetBoardTitleAdornment(adornment: ReactNode) {
	const setAdornment = useContext(AppBarTitleAdornmentSetterContext);

	if (!setAdornment) {
		throw new Error('useSetBoardTitleAdornment must be used within an AppBarActionsProvider');
	}

	useEffect(() => {
		setAdornment(adornment);

		return () => setAdornment(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [adornment]);
}