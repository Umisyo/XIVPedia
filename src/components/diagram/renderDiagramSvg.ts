import {
	FIELD_CENTER,
	FIELD_RADIUS,
	MARKER_RADIUS,
	ROLE_COLORS,
	type Role,
	SVG_SIZE,
	WAYMARK_COLORS,
	WAYMARK_SIZE,
	type WaymarkLabel,
} from './constants';
import type { DiagramData } from './types';

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function toSvgX(normalizedX: number): number {
	return normalizedX * SVG_SIZE;
}

function toSvgY(normalizedY: number): number {
	return normalizedY * SVG_SIZE;
}

function renderBackground(): string {
	return `<rect width="${SVG_SIZE}" height="${SVG_SIZE}" fill="#1a1a2e" rx="8"/>`;
}

function renderField(): string {
	return `<circle cx="${FIELD_CENTER}" cy="${FIELD_CENTER}" r="${FIELD_RADIUS}" fill="#16213e" stroke="#e2e8f0" stroke-width="2"/>`;
}

function renderCrossLines(): string {
	const top = FIELD_CENTER - FIELD_RADIUS;
	const bottom = FIELD_CENTER + FIELD_RADIUS;
	const left = FIELD_CENTER - FIELD_RADIUS;
	const right = FIELD_CENTER + FIELD_RADIUS;
	return [
		`<line x1="${FIELD_CENTER}" y1="${top}" x2="${FIELD_CENTER}" y2="${bottom}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="6,4" opacity="0.4"/>`,
		`<line x1="${left}" y1="${FIELD_CENTER}" x2="${right}" y2="${FIELD_CENTER}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="6,4" opacity="0.4"/>`,
	].join('');
}

function renderDirectionLabels(): string {
	const offset = FIELD_RADIUS + 20;
	const labels = [
		{ text: 'N', x: FIELD_CENTER, y: FIELD_CENTER - offset },
		{ text: 'S', x: FIELD_CENTER, y: FIELD_CENTER + offset + 6 },
		{ text: 'E', x: FIELD_CENTER + offset, y: FIELD_CENTER + 4 },
		{ text: 'W', x: FIELD_CENTER - offset, y: FIELD_CENTER + 4 },
	];
	return labels
		.map(
			(l) =>
				`<text x="${l.x}" y="${l.y}" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">${l.text}</text>`,
		)
		.join('');
}

function renderWaymark(label: string, nx: number, ny: number): string {
	const x = toSvgX(nx);
	const y = toSvgY(ny);
	const color = WAYMARK_COLORS[label as WaymarkLabel] ?? '#94a3b8';
	const half = WAYMARK_SIZE / 2;
	const isNumber = /^[1-4]$/.test(label);

	const shape = isNumber
		? `<rect x="${x - half}" y="${y - half}" width="${WAYMARK_SIZE}" height="${WAYMARK_SIZE}" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="2" rx="3"/>`
		: `<circle cx="${x}" cy="${y}" r="${half}" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="2"/>`;

	const text = `<text x="${x}" y="${y + 5}" text-anchor="middle" fill="${color}" font-size="14" font-weight="bold" font-family="sans-serif">${escapeHtml(label)}</text>`;

	return shape + text;
}

function renderMarker(role: string, nx: number, ny: number): string {
	const x = toSvgX(nx);
	const y = toSvgY(ny);
	const color = ROLE_COLORS[role as Role] ?? '#94a3b8';

	return [
		`<circle cx="${x}" cy="${y}" r="${MARKER_RADIUS}" fill="${color}" stroke="#fff" stroke-width="2"/>`,
		`<text x="${x}" y="${y + 5}" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold" font-family="sans-serif">${escapeHtml(role)}</text>`,
	].join('');
}

export function renderDiagramSvg(data: DiagramData): string {
	const parts: string[] = [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" width="100%">`,
		renderBackground(),
		renderField(),
		renderCrossLines(),
		renderDirectionLabels(),
	];

	for (const wm of data.waymarks) {
		parts.push(renderWaymark(wm.label, wm.x, wm.y));
	}

	for (const m of data.markers) {
		parts.push(renderMarker(m.role, m.x, m.y));
	}

	parts.push('</svg>');
	return parts.join('');
}

function isValidMarker(m: unknown): m is { role: string; x: number; y: number } {
	if (typeof m !== 'object' || m === null) return false;
	const obj = m as Record<string, unknown>;
	return typeof obj.role === 'string' && typeof obj.x === 'number' && typeof obj.y === 'number';
}

function isValidWaymark(w: unknown): w is { label: string; x: number; y: number } {
	if (typeof w !== 'object' || w === null) return false;
	const obj = w as Record<string, unknown>;
	return typeof obj.label === 'string' && typeof obj.x === 'number' && typeof obj.y === 'number';
}

export function parseDiagramJson(json: string): DiagramData | null {
	try {
		const data = JSON.parse(json) as Record<string, unknown>;
		if (data.fieldType !== 'circle') return null;
		if (!Array.isArray(data.markers) || !data.markers.every(isValidMarker)) return null;
		if (!Array.isArray(data.waymarks) || !data.waymarks.every(isValidWaymark)) return null;
		return data as unknown as DiagramData;
	} catch {
		return null;
	}
}
