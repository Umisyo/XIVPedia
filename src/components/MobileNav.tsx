import { LogOut, Menu, Search, Settings, Shield, User, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
	user: { displayName: string; avatarUrl?: string; role?: string } | null;
}

export default function MobileNav({ user }: Props) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="md:hidden">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="text-foreground p-2 hover:text-primary transition-colors"
				aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
			>
				{isOpen ? <X size={24} /> : <Menu size={24} />}
			</button>

			{isOpen && (
				<div className="absolute top-14 left-0 right-0 bg-card border-b border-border z-40">
					<nav className="container mx-auto px-4 max-w-4xl py-4 flex flex-col gap-4">
						<a
							href="/articles"
							className="text-muted-foreground hover:text-foreground transition-colors py-2"
							onClick={() => setIsOpen(false)}
						>
							記事一覧
						</a>
						<a
							href="/tags"
							className="text-muted-foreground hover:text-foreground transition-colors py-2"
							onClick={() => setIsOpen(false)}
						>
							タグ
						</a>
						<a
							href="/search"
							className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
							onClick={() => setIsOpen(false)}
						>
							<Search size={16} />
							検索
						</a>
						{user ? (
							<>
								<a
									href="/articles/new"
									className="text-muted-foreground hover:text-foreground transition-colors py-2"
									onClick={() => setIsOpen(false)}
								>
									投稿
								</a>
								<a
									href="/mypage"
									className="text-muted-foreground hover:text-foreground transition-colors py-2"
									onClick={() => setIsOpen(false)}
								>
									マイページ
								</a>
								<div className="flex items-center gap-2 py-2">
									{user.avatarUrl ? (
										<img
											src={user.avatarUrl}
											alt=""
											className="w-7 h-7 rounded-full object-cover"
										/>
									) : (
										<div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
											<User size={14} className="text-muted-foreground" />
										</div>
									)}
									<span className="text-foreground text-sm">{user.displayName}</span>
								</div>
								{user.role === 'admin' && (
									<a
										href="/admin"
										className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
										onClick={() => setIsOpen(false)}
									>
										<Shield size={16} />
										管理画面
									</a>
								)}
								<a
									href="/settings/profile"
									className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
									onClick={() => setIsOpen(false)}
								>
									<Settings size={16} />
									プロフィール設定
								</a>
								<form method="POST" action="/api/auth/logout">
									<button
										type="submit"
										className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2 w-full"
									>
										<LogOut size={16} />
										ログアウト
									</button>
								</form>
							</>
						) : (
							<a
								href="/login"
								className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity inline-block w-fit"
								onClick={() => setIsOpen(false)}
							>
								ログイン
							</a>
						)}
					</nav>
				</div>
			)}
		</div>
	);
}
