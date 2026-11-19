import type { ThemeColorDraft } from '../../hooks/useThemeColorDraft';

/** Colour swatch input with Save/Discard for an unsaved pick. */
export default function ThemeColorPicker({ draft }: { draft: ThemeColorDraft }) {
	return (
		<div className="flex flex-col gap-2 pt-1">
			<span className="text-xs font-medium text-text">Theme Color</span>
			<p className="m-0 text-xs text-muted max-w-[180px]">Used as an accent all across the project.</p>

			<div className="flex items-center gap-3">
				<label className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border">
					<input
						type="color"
						value={draft.active}
						onChange={e => draft.pick(e.target.value)}
						className="absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 cursor-pointer"
						aria-label="Pick theme color"
					/>
				</label>
				<span className="font-mono text-xs uppercase text-muted">{draft.active}</span>
			</div>

			{draft.error && <p className="m-0 text-xs text-danger">{draft.error}</p>}

			{draft.hasChange && (
				<div className="flex gap-2">
					<button
						onClick={draft.save}
						disabled={draft.saving}
						className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
					>
						{draft.saving ? 'Saving...' : 'Save Color'}
					</button>
					<button onClick={draft.discard} disabled={draft.saving} className="rounded px-4 py-2 text-sm font-medium text-muted hover:text-text disabled:opacity-50">
						Discard
					</button>
				</div>
			)}
		</div>
	);
}
