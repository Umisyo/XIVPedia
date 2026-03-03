import { ChevronDown, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
	displayName: string;
}

export default function UserMenu({ displayName }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div ref={menuRef} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-1 text-foreground text-sm hover:text-primary transition-colors"
			>
				{displayName}
				<ChevronDown
					size={16}
					className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
				/>
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50">
					<form method="POST" action="/api/auth/logout">
						<button
							type="submit"
							className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md"
						>
							<LogOut size={16} />
							ログアウト
						</button>
					</form>
				</div>
			)}
		</div>
	);
}
