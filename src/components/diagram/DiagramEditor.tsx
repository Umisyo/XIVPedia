'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
	ROLE_COLORS,
	type Role,
	WAYMARK_COLORS,
	type WaymarkLabel,
} from '@/components/diagram/constants';
import { DiagramField } from '@/components/diagram/DiagramField';
import { DiagramPalette } from '@/components/diagram/DiagramPalette';
import type { DiagramData } from '@/components/diagram/types';

interface DiagramEditorProps {
	initialData?: DiagramData;
	onChange: (data: DiagramData) => void;
}

const EMPTY_DATA: DiagramData = {
	fieldType: 'circle',
	markers: [],
	waymarks: [],
};

interface PaletteDrag {
	type: 'marker' | 'waymark';
	id: string;
}

export function DiagramEditor({ initialData, onChange }: DiagramEditorProps) {
	const [data, setData] = useState<DiagramData>(initialData ?? EMPTY_DATA);
	const [paletteDrag, setPaletteDrag] = useState<PaletteDrag | null>(null);
	const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
	const fieldRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		onChange(data);
	}, [data, onChange]);

	const handleUpdate = useCallback((updated: DiagramData) => {
		setData(updated);
	}, []);

	const handleDropMarker = useCallback(
		(role: string, x: number, y: number) => {
			if (data.markers.some((m) => m.role === role)) return;
			setData((prev) => ({
				...prev,
				markers: [...prev.markers, { role, x, y }],
			}));
		},
		[data.markers],
	);

	const handleDropWaymark = useCallback(
		(label: string, x: number, y: number) => {
			if (data.waymarks.some((w) => w.label === label)) return;
			setData((prev) => ({
				...prev,
				waymarks: [...prev.waymarks, { label, x, y }],
			}));
		},
		[data.waymarks],
	);

	const handlePalettePointerDown = useCallback(
		(type: 'marker' | 'waymark', id: string, e: React.PointerEvent) => {
			e.preventDefault();
			setPaletteDrag({ type, id });
			setGhostPos({ x: e.clientX, y: e.clientY });
		},
		[],
	);

	useEffect(() => {
		if (!paletteDrag) return;

		const handlePointerMove = (e: PointerEvent) => {
			e.preventDefault();
			setGhostPos({ x: e.clientX, y: e.clientY });
		};

		const handlePointerUp = (e: PointerEvent) => {
			const field = fieldRef.current;
			if (field) {
				const rect = field.getBoundingClientRect();
				const isInsideField =
					e.clientX >= rect.left &&
					e.clientX <= rect.right &&
					e.clientY >= rect.top &&
					e.clientY <= rect.bottom;

				if (isInsideField) {
					const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
					const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

					if (paletteDrag.type === 'marker') {
						handleDropMarker(paletteDrag.id, x, y);
					} else {
						handleDropWaymark(paletteDrag.id, x, y);
					}
				}
			}

			setPaletteDrag(null);
			setGhostPos(null);
		};

		document.addEventListener('pointermove', handlePointerMove, { passive: false });
		document.addEventListener('pointerup', handlePointerUp);

		return () => {
			document.removeEventListener('pointermove', handlePointerMove);
			document.removeEventListener('pointerup', handlePointerUp);
		};
	}, [paletteDrag, handleDropMarker, handleDropWaymark]);

	const ghostColor =
		paletteDrag?.type === 'marker'
			? ROLE_COLORS[paletteDrag.id as Role]
			: paletteDrag
				? WAYMARK_COLORS[paletteDrag.id as WaymarkLabel]
				: undefined;

	const isGhostNumber = paletteDrag?.type === 'waymark' && /^[1-4]$/.test(paletteDrag.id);

	return (
		<div className="flex flex-col gap-4 md:flex-row">
			<div ref={fieldRef} className="w-full max-w-[400px] flex-shrink-0">
				<DiagramField
					data={data}
					onUpdate={handleUpdate}
					onDropMarker={handleDropMarker}
					onDropWaymark={handleDropWaymark}
				/>
			</div>
			<div className="flex-shrink-0">
				<DiagramPalette
					existingMarkers={data.markers.map((m) => m.role)}
					existingWaymarks={data.waymarks.map((w) => w.label)}
					onItemPointerDown={handlePalettePointerDown}
				/>
			</div>

			{paletteDrag && ghostPos && ghostColor && (
				<div
					style={{
						position: 'fixed',
						left: ghostPos.x,
						top: ghostPos.y,
						transform: 'translate(-50%, -50%)',
						pointerEvents: 'none',
						zIndex: 9999,
						width: paletteDrag.type === 'marker' ? 40 : 32,
						height: 32,
						borderRadius: paletteDrag.type === 'marker' ? 9999 : isGhostNumber ? 4 : 9999,
						backgroundColor: ghostColor,
						opacity: 0.7,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: '#fff',
						fontSize: 12,
						fontWeight: 'bold',
					}}
				>
					{paletteDrag.id}
				</div>
			)}
		</div>
	);
}
