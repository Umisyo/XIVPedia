import CodeBlock from '@tiptap/extension-code-block';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MacroBlockNodeView } from './MacroBlockNodeView';

export const MacroCodeBlock = CodeBlock.extend({
	addNodeView() {
		return ReactNodeViewRenderer(MacroBlockNodeView);
	},
});
