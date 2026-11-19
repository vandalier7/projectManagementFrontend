'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import type { ProjectMember } from '@/types';

interface Option {
	id: number | null;
	label: string;
}

/**
 * Type-to-filter assignee picker. "Unassigned" is always the first option.
 * Only members who completed their profile and aren't admins are listed.
 *
 * Keyboard: ↓/↑ to move, Enter to pick, Esc to cancel. Clicking away snaps
 * the text back to the current selection.
 */
export default function AssigneeCombobox({
	members,
	value,
	onChange,
	className = '',
}: {
	members: ProjectMember[];
	value: number | null;
	onChange: (userId: number | null) => void;
	className?: string;
}) {
	const selected = members.find(m => m.user.id === value) ?? null;
	const [query, setQuery] = useState(selected?.user.full_name ?? '');
	const [open, setOpen] = useState(false);
	const [highlight, setHighlight] = useState(0);
	const boxRef = useRef<HTMLDivElement>(null);
	const listId = useId();

	const options = useMemo<Option[]>(() => {
		const q = query.toLowerCase();
		return [
			{ id: null, label: 'Unassigned' },
			...members
				.filter(m => m.user.profile_completed && m.user.system_role !== 'admin' && m.user.full_name.toLowerCase().includes(q))
				.map(m => ({ id: m.user.id, label: m.user.full_name })),
		];
	}, [members, query]);

	const reset = () => {
		setOpen(false);
		setQuery(selected?.user.full_name ?? '');
	};

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (boxRef.current && !boxRef.current.contains(e.target as Node)) reset();
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selected]);

	const pick = (option: Option) => {
		onChange(option.id);
		setQuery(option.id === null ? '' : option.label);
		setOpen(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!open) {
			if (e.key === 'ArrowDown' || e.key === 'Enter') {
				setOpen(true);
				setHighlight(0);
			}
			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setHighlight(i => Math.min(i + 1, options.length - 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setHighlight(i => Math.max(i - 1, 0));
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (options[highlight]) pick(options[highlight]);
		} else if (e.key === 'Escape') {
			reset();
		}
	};

	return (
		<div
			ref={boxRef}
			className={`relative flex items-center gap-1.5 flex-1 min-w-0 border border-border rounded bg-bg px-2.5 py-1.5 ${className}`}
		>
			<UserIcon size={14} className="text-muted shrink-0" />
			<input
				className="text-sm text-text bg-transparent border-none outline-none min-w-0 w-full"
				placeholder="Unassigned"
				value={query}
				role="combobox"
				aria-expanded={open}
				aria-controls={listId}
				onChange={e => {
					setQuery(e.target.value);
					setOpen(true);
					setHighlight(0);
				}}
				onFocus={() => setOpen(true)}
				onKeyDown={handleKeyDown}
			/>
			{open && (
				<div id={listId} role="listbox" className="absolute top-[calc(100%+4px)] left-0 right-0 min-w-[180px] max-h-[180px] overflow-y-auto bg-surface border border-border rounded shadow-md z-10">
					{options.map((opt, i) => (
						<div
							key={opt.id ?? 'unassigned'}
							role="option"
							aria-selected={i === highlight}
							className={`text-sm text-text px-2.5 py-2 cursor-pointer ${i === highlight ? 'bg-bg' : ''}`}
							onMouseDown={e => {
								e.preventDefault();
								pick(opt);
							}}
							onMouseEnter={() => setHighlight(i)}
						>
							{opt.label}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
