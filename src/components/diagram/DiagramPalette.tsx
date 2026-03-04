'use client';

import {
	ROLE_COLORS,
	ROLES,
	type Role,
	WAYMARK_COLORS,
	WAYMARK_LABELS,
	type WaymarkLabel,
} from '@/components/diagram/constants';

interface DiagramPaletteProps {
	existingMarkers: string[];
	existingWaymarks: string[];
}

export function DiagramPalette({ existingMarkers, existingWaymarks }: DiagramPaletteProps) {
	return (
		<div className="flex flex-col gap-4">
			{/* ロールセクション */}
			<div>
				<h3 className="mb-2 text-sm font-semibold text-muted-foreground select-none">ロール</h3>
				<div className="flex flex-wrap gap-2">
					{ROLES.map((role) => {
						const placed = existingMarkers.includes(role);
						const color = ROLE_COLORS[role as Role];
						return (
							<span
								key={role}
								role="img"
								aria-label={`${role} マーカー`}
								draggable={!placed}
								onDragStart={(e) => {
									if (placed) return;
									e.dataTransfer.setData('type', 'marker');
									e.dataTransfer.setData('id', role);
								}}
								className="inline-flex h-8 w-10 items-center justify-center rounded-full text-xs font-bold text-white select-none"
								style={{
									backgroundColor: color,
									opacity: placed ? 0.3 : 1,
									cursor: placed ? 'default' : 'grab',
								}}
							>
								{role}
							</span>
						);
					})}
				</div>
			</div>

			{/* ウェイマークセクション */}
			<div>
				<h3 className="mb-2 text-sm font-semibold text-muted-foreground select-none">
					ウェイマーク
				</h3>
				<div className="flex flex-wrap gap-2">
					{WAYMARK_LABELS.map((label) => {
						const placed = existingWaymarks.includes(label);
						const color = WAYMARK_COLORS[label as WaymarkLabel];
						const isNumber = /^[1-4]$/.test(label);
						return (
							<span
								key={label}
								role="img"
								aria-label={`ウェイマーク ${label}`}
								draggable={!placed}
								onDragStart={(e) => {
									if (placed) return;
									e.dataTransfer.setData('type', 'waymark');
									e.dataTransfer.setData('id', label);
								}}
								className={`inline-flex h-8 w-8 items-center justify-center text-xs font-bold text-white select-none ${
									isNumber ? 'rounded-sm' : 'rounded-full'
								}`}
								style={{
									backgroundColor: color,
									opacity: placed ? 0.3 : 1,
									cursor: placed ? 'default' : 'grab',
								}}
							>
								{label}
							</span>
						);
					})}
				</div>
			</div>
		</div>
	);
}
