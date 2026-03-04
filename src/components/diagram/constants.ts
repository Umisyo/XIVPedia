export const SVG_SIZE = 400;
export const FIELD_CENTER = SVG_SIZE / 2;
export const FIELD_RADIUS = 160;
export const MARKER_RADIUS = 18;
export const WAYMARK_SIZE = 28;

export const ROLES = ['MT', 'ST', 'H1', 'H2', 'D1', 'D2', 'D3', 'D4'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_COLORS: Record<Role, string> = {
	MT: '#3b82f6',
	ST: '#60a5fa',
	H1: '#22c55e',
	H2: '#4ade80',
	D1: '#ef4444',
	D2: '#f87171',
	D3: '#f59e0b',
	D4: '#fbbf24',
};

export const WAYMARK_LABELS = ['A', 'B', 'C', 'D', '1', '2', '3', '4'] as const;
export type WaymarkLabel = (typeof WAYMARK_LABELS)[number];

export const WAYMARK_COLORS: Record<WaymarkLabel, string> = {
	A: '#f59e0b',
	B: '#3b82f6',
	C: '#ef4444',
	D: '#a855f7',
	'1': '#f59e0b',
	'2': '#3b82f6',
	'3': '#ef4444',
	'4': '#a855f7',
};
