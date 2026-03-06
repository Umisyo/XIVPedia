import CodeBlock from '@tiptap/extension-code-block';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MacroBlockNodeView } from './MacroBlockNodeView';

export const MacroCodeBlock = CodeBlock.extend({
	name: 'macroCodeBlock',

	parseHTML() {
		return [
			{
				tag: 'pre',
				preserveWhitespace: 'full' as const,
				getAttrs: (node) => {
					const el = node as HTMLElement;
					const code = el.querySelector('code');
					if (!code?.classList.contains('language-ffxiv-macro')) return false;
					return { language: 'ffxiv-macro' };
				},
				priority: 200,
			},
		];
	},

	addStorage() {
		return {
			markdown: {
				serialize(state: { write: (text: string) => void }, node: { textContent: string }) {
					state.write(`\`\`\`ffxiv-macro\n${node.textContent}\n\`\`\``);
				},
				parse: {},
			},
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(MacroBlockNodeView);
	},
});
