'use client';

import { useCallback, useRef } from 'react';
import {
	FIELD_CENTER,
	FIELD_RADIUS,
	MARKER_RADIUS,
	ROLE_COLORS,
	SVG_SIZE,
	WAYMARK_COLORS,
	WAYMARK_SIZE,
	type Role,
	type WaymarkLabel,
} from '@/components/diagram/constants';
import type { DiagramData } from '@/components/diagram/types';

interface DiagramFieldProps {
	data: DiagramData;
	onUpdate: (data: DiagramData) => void;
	onDropMarker?: (role: string, x: number, y: number) => void;
	onDropWaymark?: (label: string, x: number, y: number) => void;
}

function toSvgCoord(normalized: number): number {
	return normalized * SVG_SIZE;
}

const DIRECTION_LABELS = [
	{ text: 'N', x: FIELD_CENTER, y: FIELD_CENTER - FIELD_RADIUS - 20 },
	{ text: 'S', x: FIELD_CENTER, y: FIELD_CENTER + FIELD_RADIUS + 26 },
	{ text: 'E', x: FIELD_CENTER + FIELD_RADIUS + 20, y: FIELD_CENTER + 4 },
	{ text: 'W', x: FIELD_CENTER - FIELD_RADIUS - 20, y: FIELD_CENTER + 4 },
];

export function DiagramField({
	data,
	onUpdate,
	onDropMarker,
	onDropWaymark,
}: DiagramFieldProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const dragRef = useRef<{
		type: 'marker' | 'waymark';
		index: number;
	} | null>(null);

	const toNormalized = useCallback(
		(clientX: number, clientY: number): { x: number; y: number } => {
			const svg = svgRef.current;
			if (!svg) return { x: 0.5, y: 0.5 };
			const rect = svg.getBoundingClientRect();
			return {
				x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
				y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
			};
		},
		[],
	);

	const handlePointerDown = useCallback(
		(type: 'marker' | 'waymark', index: number, e: React.PointerEvent) => {
			e.preventDefault();
			(e.target as Element).setPointerCapture(e.pointerId);
			dragRef.current = { type, index };
		},
		[],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			const drag = dragRef.current;
			if (!drag) return;
			const { x, y } = toNormalized(e.clientX, e.clientY);

			if (drag.type === 'marker') {
				const newMarkers = [...data.markers];
				newMarkers[drag.index] = { ...newMarkers[drag.index], x, y };
				onUpdate({ ...data, markers: newMarkers });
			} else {
				const newWaymarks = [...data.waymarks];
				newWaymarks[drag.index] = { ...newWaymarks[drag.index], x, y };
				onUpdate({ ...data, waymarks: newWaymarks });
			}
		},
		[data, onUpdate, toNormalized],
	);

	const handlePointerUp = useCallback(() => {
		dragRef.current = null;
	}, []);

	const handleContextMenu = useCallback(
		(type: 'marker' | 'waymark', index: number, e: React.MouseEvent) => {
			e.preventDefault();
			if (type === 'marker') {
				const newMarkers = data.markers.filter((_, i) => i !== index);
				onUpdate({ ...data, markers: newMarkers });
			} else {
				const newWaymarks = data.waymarks.filter((_, i) => i !== index);
				onUpdate({ ...data, waymarks: newWaymarks });
			}
		},
		[data, onUpdate],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const type = e.dataTransfer.getData('type');
			const id = e.dataTransfer.getData('id');
			if (!type || !id) return;

			const { x, y } = toNormalized(e.clientX, e.clientY);

			if (type === 'marker' && onDropMarker) {
				onDropMarker(id, x, y);
			} else if (type === 'waymark' && onDropWaymark) {
				onDropWaymark(id, x, y);
			}
		},
		[toNormalized, onDropMarker, onDropWaymark],
	);

	const waymarkHalf = WAYMARK_SIZE / 2;
	const crossTop = FIELD_CENTER - FIELD_RADIUS;
	const crossBottom = FIELD_CENTER + FIELD_RADIUS;
	const crossLeft = FIELD_CENTER - FIELD_RADIUS;
	const crossRight = FIELD_CENTER + FIELD_RADIUS;

	return (
		<svg
			ref={svgRef}
			viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
			width="100%"
			height="100%"
			className="touch-none select-none"
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			{/* 背景 */}
			<rect width={SVG_SIZE} height={SVG_SIZE} fill="#1a1a2e" rx={8} />

			{/* 円形フィールド */}
			<circle
				cx={FIELD_CENTER}
				cy={FIELD_CENTER}
				r={FIELD_RADIUS}
				fill="#16213e"
				stroke="#e2e8f0"
				strokeWidth={2}
			/>

			{/* 十字破線 */}
			<line
				x1={FIELD_CENTER}
				y1={crossTop}
				x2={FIELD_CENTER}
				y2={crossBottom}
				stroke="#e2e8f0"
				strokeWidth={1}
				strokeDasharray="6,4"
				opacity={0.4}
			/>
			<line
				x1={crossLeft}
				y1={FIELD_CENTER}
				x2={crossRight}
				y2={FIELD_CENTER}
				stroke="#e2e8f0"
				strokeWidth={1}
				strokeDasharray="6,4"
				opacity={0.4}
			/>

			{/* 方角ラベル */}
			{DIRECTION_LABELS.map((l) => (
				<text
					key={l.text}
					x={l.x}
					y={l.y}
					textAnchor="middle"
					fill="#94a3b8"
					fontSize={14}
					fontFamily="sans-serif"
				>
					{l.text}
				</text>
			))}

			{/* ウェイマーク */}
			{data.waymarks.map((wm, i) => {
				const wx = toSvgCoord(wm.x);
				const wy = toSvgCoord(wm.y);
				const color =
					WAYMARK_COLORS[wm.label as WaymarkLabel] ?? '#94a3b8';
				const isNumber = /^[1-4]$/.test(wm.label);
				return (
					<g
						key={`wm-${wm.label}`}
						style={{ cursor: 'grab' }}
						onPointerDown={(e) =>
							handlePointerDown('waymark', i, e)
						}
						onContextMenu={(e) =>
							handleContextMenu('waymark', i, e)
						}
					>
						{isNumber ? (
							<rect
								x={wx - waymarkHalf}
								y={wy - waymarkHalf}
								width={WAYMARK_SIZE}
								height={WAYMARK_SIZE}
								fill={color}
								opacity={0.3}
								stroke={color}
								strokeWidth={2}
								rx={3}
							/>
						) : (
							<circle
								cx={wx}
								cy={wy}
								r={waymarkHalf}
								fill={color}
								opacity={0.3}
								stroke={color}
								strokeWidth={2}
							/>
						)}
						<text
							x={wx}
							y={wy + 5}
							textAnchor="middle"
							fill={color}
							fontSize={14}
							fontWeight="bold"
							fontFamily="sans-serif"
						>
							{wm.label}
						</text>
					</g>
				);
			})}

			{/* ロールマーカー */}
			{data.markers.map((m, i) => {
				const mx = toSvgCoord(m.x);
				const my = toSvgCoord(m.y);
				const color = ROLE_COLORS[m.role as Role] ?? '#94a3b8';
				return (
					<g
						key={`m-${m.role}`}
						style={{ cursor: 'grab' }}
						onPointerDown={(e) =>
							handlePointerDown('marker', i, e)
						}
						onContextMenu={(e) =>
							handleContextMenu('marker', i, e)
						}
					>
						<circle
							cx={mx}
							cy={my}
							r={MARKER_RADIUS}
							fill={color}
							stroke="#fff"
							strokeWidth={2}
						/>
						<text
							x={mx}
							y={my + 5}
							textAnchor="middle"
							fill="#fff"
							fontSize={11}
							fontWeight="bold"
							fontFamily="sans-serif"
						>
							{m.role}
						</text>
					</g>
				);
			})}
		</svg>
	);
}
