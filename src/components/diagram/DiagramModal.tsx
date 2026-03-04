import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DiagramEditor } from './DiagramEditor';
import type { DiagramData } from './types';

interface DiagramModalProps {
	isOpen: boolean;
	onClose: () => void;
	onInsert?: (codeFence: string) => void;
	onSave?: (json: string) => void;
	initialData?: DiagramData;
}

const EMPTY_DATA: DiagramData = {
	fieldType: 'circle',
	markers: [],
	waymarks: [],
};

export function DiagramModal({
	isOpen,
	onClose,
	onInsert,
	onSave,
	initialData,
}: DiagramModalProps) {
	const [data, setData] = useState<DiagramData>(initialData ?? EMPTY_DATA);
	const [editorKey, setEditorKey] = useState(0);
	const isEditMode = !!onSave;
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

	const handleSubmit = useCallback(() => {
		if (isEditMode && onSave) {
			onSave(JSON.stringify(data));
		} else if (onInsert) {
			const json = JSON.stringify(data);
			const codeFence = `\`\`\`diagram\n${json}\n\`\`\``;
			onInsert(codeFence);
		}
		onClose();
	}, [data, isEditMode, onSave, onInsert, onClose]);

	const handleClear = useCallback(() => {
		setData({ ...EMPTY_DATA });
		setEditorKey((k) => k + 1);
	}, []);

	if (!isOpen) return null;

	return (
		<div
			ref={overlayRef}
			role="dialog"
			aria-modal="true"
			aria-label="散開図エディタ"
			contentEditable={false}
			onClick={handleOverlayClick}
			onKeyDown={(e) => {
				if (e.key === 'Escape') onClose();
			}}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		>
			<div className="relative w-full max-w-3xl mx-4 rounded-lg border border-border bg-background p-6 shadow-lg">
				<h2 className="text-lg font-semibold mb-4 select-none">散開図エディタ</h2>

				<DiagramEditor key={editorKey} initialData={data} onChange={setData} />

				<div className="flex justify-between mt-4">
					<Button type="button" variant="outline" onClick={handleClear}>
						クリア
					</Button>
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onClose}>
							キャンセル
						</Button>
						<Button type="button" onClick={handleSubmit}>
							{isEditMode ? '更新' : '挿入'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
