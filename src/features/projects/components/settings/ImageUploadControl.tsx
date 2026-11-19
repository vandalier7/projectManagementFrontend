import { useId } from 'react';
import type { ImageUpload } from '../../hooks/useImageUpload';

const PRIMARY = 'rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50';
const GHOST = 'rounded px-4 py-2 text-sm font-medium text-muted hover:text-text disabled:opacity-50';

/** "Choose image" button, chosen file name, error, and Save/Discard once a file is picked. */
export default function ImageUploadControl({ upload, label }: { upload: ImageUpload; label: string }) {
	const inputId = useId();

	return (
		<>
			<div className="flex items-center gap-3">
				<input id={inputId} type="file" accept="image/*" onChange={upload.pick} className="hidden" />
				<label
					htmlFor={inputId}
					className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-muted/20"
				>
					Choose {label} Image
				</label>
				{upload.file && <span className="text-xs text-muted truncate max-w-[200px]">{upload.file.name}</span>}
			</div>

			{upload.error && <p className="m-0 text-xs text-danger">{upload.error}</p>}

			{upload.file && (
				<div className="flex gap-2">
					<button onClick={upload.save} disabled={upload.uploading} className={PRIMARY}>
						{upload.uploading ? 'Saving...' : `Save ${label}`}
					</button>
					<button onClick={upload.discard} disabled={upload.uploading} className={GHOST}>
						Discard
					</button>
				</div>
			)}
		</>
	);
}
