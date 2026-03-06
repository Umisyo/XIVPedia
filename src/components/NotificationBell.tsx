import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Notification {
	id: string;
	type: string;
	message: string;
	link: string | null;
	isRead: boolean;
	createdAt: string;
}

export default function NotificationBell() {
	const [isOpen, setIsOpen] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const fetchUnreadCount = useCallback(async () => {
		try {
			const res = await fetch('/api/notifications/unread-count');
			if (res.ok) {
				const data = await res.json();
				setUnreadCount(data.count);
			}
		} catch {
			// ignore
		}
	}, []);

	useEffect(() => {
		fetchUnreadCount();
		const interval = setInterval(fetchUnreadCount, 30000);
		return () => clearInterval(interval);
	}, [fetchUnreadCount]);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape' && isOpen) {
				setIsOpen(false);
			}
		}
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen]);

	async function fetchNotifications() {
		setIsLoading(true);
		try {
			const res = await fetch('/api/notifications');
			if (res.ok) {
				const data = await res.json();
				setNotifications(data.notifications.slice(0, 5));
			}
		} catch {
			// ignore
		} finally {
			setIsLoading(false);
		}
	}

	async function handleToggle() {
		if (!isOpen) {
			await fetchNotifications();
		}
		setIsOpen(!isOpen);
	}

	async function markAllAsRead() {
		try {
			const res = await fetch('/api/notifications/read', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ all: true }),
			});
			if (res.ok) {
				setUnreadCount(0);
				setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
			}
		} catch {
			// ignore
		}
	}

	async function handleNotificationClick(notification: Notification) {
		if (!notification.isRead) {
			try {
				await fetch('/api/notifications/read', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: notification.id }),
				});
				setUnreadCount((prev) => Math.max(0, prev - 1));
				setNotifications((prev) =>
					prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
				);
			} catch {
				// ignore
			}
		}
		if (notification.link) {
			window.location.href = notification.link;
		}
		setIsOpen(false);
	}

	function formatTime(dateStr: string) {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMin = Math.floor(diffMs / 60000);
		if (diffMin < 1) return '今';
		if (diffMin < 60) return `${diffMin}分前`;
		const diffHour = Math.floor(diffMin / 60);
		if (diffHour < 24) return `${diffHour}時間前`;
		const diffDay = Math.floor(diffHour / 24);
		if (diffDay < 30) return `${diffDay}日前`;
		return date.toLocaleDateString('ja-JP');
	}

	return (
		<div ref={menuRef} className="relative">
			<button
				type="button"
				onClick={handleToggle}
				aria-expanded={isOpen}
				aria-haspopup="true"
				aria-label={`通知${unreadCount > 0 ? ` (${unreadCount}件の未読)` : ''}`}
				className="relative text-muted-foreground hover:text-foreground transition-colors p-1"
			>
				<Bell size={20} />
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-md shadow-lg z-50">
					<div className="flex items-center justify-between px-4 py-3 border-b border-border">
						<span className="text-sm font-medium text-foreground">通知</span>
						{unreadCount > 0 && (
							<button
								type="button"
								onClick={markAllAsRead}
								className="text-xs text-primary hover:text-primary/80 transition-colors"
							>
								すべて既読にする
							</button>
						)}
					</div>
					<div className="max-h-80 overflow-y-auto">
						{isLoading ? (
							<div className="px-4 py-6 text-center text-sm text-muted-foreground">
								読み込み中...
							</div>
						) : notifications.length === 0 ? (
							<div className="px-4 py-6 text-center text-sm text-muted-foreground">
								通知はありません
							</div>
						) : (
							notifications.map((notification) => (
								<button
									key={notification.id}
									type="button"
									onClick={() => handleNotificationClick(notification)}
									className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0 ${
										!notification.isRead ? 'bg-primary/5' : ''
									}`}
								>
									<div className="flex items-start gap-2">
										{!notification.isRead && (
											<span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
										)}
										<div className={`flex-1 ${notification.isRead ? 'ml-4' : ''}`}>
											<p className="text-sm text-foreground line-clamp-2">{notification.message}</p>
											<p className="text-xs text-muted-foreground mt-1">
												{formatTime(notification.createdAt)}
											</p>
										</div>
									</div>
								</button>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
