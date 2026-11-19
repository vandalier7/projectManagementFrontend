'use client';

interface Props {
	html: string;
	className?: string;
}

// Renders HTML produced by RichTextEditor. Uses dangerouslySetInnerHTML
// because the content is author-generated rich text, not user-supplied
// arbitrary HTML from an untrusted source.
export default function RichTextDisplay({ html, className = '' }: Props) {
	return (
		<div className={`rte-display ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
	);
}