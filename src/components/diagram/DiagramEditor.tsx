'use client';

import { useCallback, useEffect, useState } from 'react';
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

export function DiagramEditor({ initialData, onChange }: DiagramEditorProps) {
	const [data, setData] = useState<DiagramData>(initialData ?? EMPTY_DATA);

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

	return (
		<div className="flex flex-col gap-4 md:flex-row">
			<div className="w-full max-w-[400px] flex-shrink-0">
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
				/>
			</div>
		</div>
	);
}
