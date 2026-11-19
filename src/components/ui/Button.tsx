import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'danger-outline';

const VARIANT_CLASSES: Record<Variant, string> = {
	primary: 'text-white bg-accent border-none hover:bg-accent-hover',
	secondary: 'text-text bg-surface border border-border hover:bg-bg',
	danger: 'text-white bg-danger border-none hover:opacity-90',
	'danger-outline': 'text-danger bg-surface border border-danger hover:bg-red-50',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
}

export default function Button({ variant = 'secondary', className = '', type = 'button', ...props }: ButtonProps) {
	return (
		<button
			type={type}
			className={`text-sm font-medium rounded px-4 py-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
			{...props}
		/>
	);
}
