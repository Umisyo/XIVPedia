import { ChevronDown, LogOut, Settings, Shield, Tag, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
	displayName: string;
	avatarUrl?: string;
	role?: string;
}

export default function UserMenu({ displayName, avatarUrl, role }: Props) {
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
				className="flex items-center gap-2 text-foreground text-sm hover:text-primary transition-colors"
			>
				{avatarUrl ? (
					<img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
				) : (
					<div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
						<User size={14} className="text-muted-foreground" />
					</div>
				)}
				{displayName}
				<ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50">
					{role === 'admin' && (
						<a
							href="/admin"
							className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-t-md"
						>
							<Shield size={16} />
							管理画面
						</a>
					)}
					<a
						href="/tag-requests"
						className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
					>
						<Tag size={16} />
						タグ申請
					</a>
					<a
						href="/settings/profile"
						className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
					>
						<Settings size={16} />
						プロフィール設定
					</a>
					<form method="POST" action="/api/auth/logout">
						<button
							type="submit"
							className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-b-md"
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
