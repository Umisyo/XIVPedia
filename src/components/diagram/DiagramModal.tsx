import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DiagramEditor } from './DiagramEditor';
import type { DiagramData } from './types';

interface DiagramModalProps {
	isOpen: boolean;
	onClose: () => void;
	onInsert: (codeFence: string) => void;
}

const INITIAL_DATA: DiagramData = {
	fieldType: 'circle',
	markers: [],
	waymarks: [],
};

export function DiagramModal({ isOpen, onClose, onInsert }: DiagramModalProps) {
	const [data, setData] = useState<DiagramData>(INITIAL_DATA);
	const [editorKey, setEditorKey] = useState(0);
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				onClose();
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose]);

	// Lock body scroll when open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	const handleOverlayClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === overlayRef.current) {
				onClose();
			}
		},
		[onClose],
	);

	const handleInsert = useCallback(() => {
		const json = JSON.stringify(data);
		const codeFence = `\`\`\`diagram\n${json}\n\`\`\``;
		onInsert(codeFence);
		onClose();
	}, [data, onInsert, onClose]);

	const handleClear = useCallback(() => {
		setData({ ...INITIAL_DATA });
		setEditorKey((k) => k + 1);
	}, []);

	if (!isOpen) return null;

	return (
		<div
			ref={overlayRef}
			role="dialog"
			aria-modal="true"
			aria-label="散開図エディタ"
			onClick={handleOverlayClick}
			onKeyDown={(e) => {
				if (e.key === 'Escape') onClose();
			}}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		>
			<div className="relative w-full max-w-3xl mx-4 rounded-lg border border-border bg-background p-6 shadow-lg">
				<h2 className="text-lg font-semibold mb-4">散開図エディタ</h2>

				<DiagramEditor key={editorKey} initialData={data} onChange={setData} />

				<div className="flex justify-between mt-4">
					<Button type="button" variant="outline" onClick={handleClear}>
						クリア
					</Button>
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onClose}>
							キャンセル
						</Button>
						<Button type="button" onClick={handleInsert}>
							挿入
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
