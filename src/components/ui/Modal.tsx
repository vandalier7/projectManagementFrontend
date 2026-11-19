'use client';

import type { ReactNode } from 'react';

/**
 * Modal building blocks. Compose them:
 *
 *   <ModalOverlay onClose={close}>
 *     <ModalPanel>
 *       <ModalHeader onClose={close}>…</ModalHeader>
 *       <ModalBody>…</ModalBody>
 *       <ModalFooter>…</ModalFooter>
 *     </ModalPanel>
 *   </ModalOverlay>
 *
 * Clicking the backdrop closes; clicks inside the content don't propagate.
 */

export function ModalOverlay({
	onClose,
	children,
	layer = 'base',
	dismissible = true,
}: {
	onClose: () => void;
	children: ReactNode;
	/** When false, clicking the backdrop does nothing (for forms with unsaved input). */
	dismissible?: boolean;
	/** 'stacked' sits above a 'base' modal, e.g. Edit opened from a task's details. */
	layer?: 'base' | 'stacked';
}) {
	return (
		<div
			className={`fixed inset-0 bg-black/40 flex items-center justify-center ${layer === 'stacked' ? 'z-[110]' : 'z-[100]'}`}
			onClick={dismissible ? onClose : undefined}
		>
			{children}
		</div>
	);
}

export function ModalPanel({ children, className = 'w-full max-w-lg' }: { children: ReactNode; className?: string }) {
	return (
		<div
			className={`bg-surface border border-border rounded-xl shadow-md max-h-[85vh] flex flex-col overflow-hidden ${className}`}
			onClick={e => e.stopPropagation()}
		>
			{children}
		</div>
	);
}

export function ModalHeader({ children, onClose }: { children: ReactNode; onClose: () => void }) {
	return (
		<div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border gap-4">
			{children}
			<CloseButton onClick={onClose} />
		</div>
	);
}

export function ModalTitle({ children }: { children: ReactNode }) {
	return <h2 className="text-base font-semibold text-text m-0 whitespace-nowrap">{children}</h2>;
}

export function ModalBody({ children }: { children: ReactNode }) {
	return <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">{children}</div>;
}

export function ModalFooter({ children }: { children: ReactNode }) {
	return <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">{children}</div>;
}

export function CloseButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			aria-label="Close"
			className="text-sm text-muted bg-transparent border-none cursor-pointer hover:text-text p-0 leading-none shrink-0"
			onClick={onClick}
		>
			✕
		</button>
	);
}
