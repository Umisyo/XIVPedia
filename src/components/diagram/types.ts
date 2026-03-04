export interface MarkerData {
	role: string;
	x: number;
	y: number;
}

export interface WaymarkData {
	label: string;
	x: number;
	y: number;
}

export interface DiagramData {
	fieldType: 'circle';
	markers: MarkerData[];
	waymarks: WaymarkData[];
}
