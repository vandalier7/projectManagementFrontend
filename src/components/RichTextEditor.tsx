'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface Props {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 100 }: Props) {
	// Incremented on every editor transaction so the toolbar re-renders
	// immediately when formatting is toggled or the selection moves,
	// not just when content changes.
	const [, forceUpdate] = useState(0);

	const editor = useEditor({
		immediatelyRender: true,
		extensions: [
			StarterKit.configure({ underline: false }),
			Underline,
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
		],
		content: value || '',
		onTransaction: () => {
			forceUpdate(n => n + 1);
		},
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			onChange(html === '<p></p>' ? '' : html);
		},
		editorProps: {
			attributes: {
				class: 'rte-content',
				...(placeholder ? { 'data-placeholder': placeholder } : {}),
			},
		},
	});

	if (!editor) return null;

	return (
		<div className="rte-wrap">
			{/* Toolbar */}
			<div className="rte-toolbar">
				<ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
					<Bold className="w-3.5 h-3.5" />
				</ToolbarBtn>
				<ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
					<Italic className="w-3.5 h-3.5" />
				</ToolbarBtn>
				<ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
					<UnderlineIcon className="w-3.5 h-3.5" />
				</ToolbarBtn>

				<div className="rte-divider" />

				<ToolbarBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left">
					<AlignLeft className="w-3.5 h-3.5" />
				</ToolbarBtn>
				<ToolbarBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align center">
					<AlignCenter className="w-3.5 h-3.5" />
				</ToolbarBtn>
				<ToolbarBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right">
					<AlignRight className="w-3.5 h-3.5" />
				</ToolbarBtn>
			</div>

			{/* Editor area — clicking anywhere in the padded box focuses the editor */}
			<div
				className="rte-body"
				style={{ minHeight }}
				onClick={() => editor.commands.focus()}
			>
				<EditorContent editor={editor} />
			</div>

			<style jsx global>{`
				.rte-wrap {
					border: 1px solid var(--border);
					border-radius: var(--radius);
					overflow: hidden;
					transition: border-color 150ms ease;
				}

				.rte-wrap:focus-within {
					border-color: var(--accent);
				}

				.rte-toolbar {
					display: flex;
					align-items: center;
					gap: 2px;
					padding: 6px 8px;
					border-bottom: 1px solid var(--border);
					background: var(--bg);
				}

				.rte-divider {
					width: 1px;
					height: 16px;
					background: var(--border);
					margin: 0 4px;
					flex-shrink: 0;
				}

				.rte-body {
					padding: 8px 10px;
					background: var(--bg);
					font-family: var(--font-ui);
					font-size: 13px;
					color: var(--text);
					cursor: text;
					display: flex;
					flex-direction: column;
				}

				.rte-body > div {
					flex: 1;
					display: flex;
					flex-direction: column;
				}

				.rte-content {
					outline: none;
					flex: 1;
				}

				.rte-content p {
					margin: 0 0 4px;
				}

				.rte-content p:last-child {
					margin-bottom: 0;
				}

				.rte-content strong {
					font-weight: 600;
				}

				.rte-content em {
					font-style: italic;
				}

				.rte-content u {
					text-decoration: underline;
				}

				/* Placeholder */
				.rte-content p.is-empty:first-child::before {
					content: attr(data-placeholder);
					color: var(--muted);
					pointer-events: none;
					float: left;
					height: 0;
				}
			`}</style>
		</div>
	);
}

function ToolbarBtn({
	active,
	onClick,
	title,
	children,
}: {
	active: boolean;
	onClick: () => void;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			title={title}
			onMouseDown={e => {
				e.preventDefault();
				onClick();
			}}
			style={{
				padding: '4px 6px',
				borderRadius: 4,
				border: 'none',
				cursor: 'pointer',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: active ? 'var(--accent)' : 'transparent',
				color: active ? '#fff' : 'var(--muted)',
				transition: 'background 120ms ease, color 120ms ease',
			}}
		>
			{children}
		</button>
	);
}