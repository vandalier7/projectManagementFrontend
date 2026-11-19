'use client';

import { useEffect, type RefObject } from 'react';

/** Calls onOutside when a mousedown lands outside `ref` (for dropdowns and popovers). */
export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, enabled = true) {
	useEffect(() => {
		if (!enabled) return;

		const handle = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
		};

		document.addEventListener('mousedown', handle);
		return () => document.removeEventListener('mousedown', handle);
	}, [ref, onOutside, enabled]);
}
