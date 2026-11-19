'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { apiClient } from '@/lib/api';

/**
 * Pick → preview → save/discard flow for one project image (logo or banner).
 * The preview is a local object URL, so it shows instantly before upload.
 *
 * @param endpoint e.g. `/projects/3/logo`
 * @param field    the multipart field name the API expects ('logo' | 'banner')
 */
export function useImageUpload(endpoint: string, field: string, onUploaded: () => void) {
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Free the object URL when it's replaced or the component unmounts.
	useEffect(() => () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
	}, [previewUrl]);

	const reset = () => {
		setFile(null);
		setPreviewUrl(null);
	};

	const pick = (e: ChangeEvent<HTMLInputElement>) => {
		const picked = e.target.files?.[0];
		// Clear the input so picking the same file again still fires onChange.
		e.target.value = '';
		if (!picked) return;
		setError(null);
		setFile(picked);
		setPreviewUrl(URL.createObjectURL(picked));
	};

	const discard = () => {
		reset();
		setError(null);
	};

	const save = async () => {
		if (!file) return;
		setUploading(true);
		setError(null);

		const body = new FormData();
		body.append(field, file);

		try {
			await apiClient(endpoint, { method: 'POST', body });
			reset();
			onUploaded();
		} catch (err) {
			setError(err instanceof Error ? err.message : `Failed to upload ${field}.`);
		} finally {
			setUploading(false);
		}
	};

	return { file, previewUrl, uploading, error, pick, discard, save };
}

export type ImageUpload = ReturnType<typeof useImageUpload>;
