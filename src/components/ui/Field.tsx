import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

/** Labelled form field and matching inputs, styled once for the whole app. */

const CONTROL = 'text-sm text-text bg-bg border border-border rounded px-3 py-2.5 outline-none focus:border-accent transition-colors';

export function Field({
	label,
	required = false,
	children,
	className = '',
}: {
	label: ReactNode;
	required?: boolean;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={`flex flex-col gap-1.5 ${className}`}>
			<label className="text-xs text-muted uppercase tracking-wide">
				{label}
				{required && <span className="text-danger"> *</span>}
			</label>
			{children}
		</div>
	);
}

/** A read-only labelled value, e.g. in a details view. */
export function FieldLabel({ children, className = 'text-muted' }: { children: ReactNode; className?: string }) {
	return <span className={`text-xs uppercase tracking-wide ${className}`}>{children}</span>;
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
	return <input className={`${CONTROL} ${className}`} {...props} />;
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return <textarea className={`${CONTROL} resize-none ${className}`} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
	return <select className={`${CONTROL} cursor-pointer ${className}`} {...props} />;
}

export function ErrorText({ children }: { children: ReactNode }) {
	return children ? <p className="text-sm text-danger m-0">{children}</p> : null;
}
