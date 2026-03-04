/**
 * FF14 マクロブロックのシンタックスハイライトとHTML生成
 * サーバーサイド (markdown.ts) とクライアントサイド (MarkdownPreview.tsx) で共用
 */

/**
 * HTML属性用のエスケープ（data-macro-text 等に使用）
 */
function escapeHtmlAttr(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * HTMLコンテンツ用のエスケープ
 */
function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * マクロの1行をシンタックスハイライトする
 *
 * ルール:
 * - `/` で始まるコマンド部分（最初のスペースまで）: <span class="macro-command">
 * - `<...>` プレースホルダー: <span class="macro-placeholder">
 * - それ以外: <span class="macro-text">
 */
export function highlightMacroLine(line: string): string {
	if (line.length === 0) {
		return '';
	}

	let result = '';
	let pos = 0;

	// コマンド部分の処理: 行が `/` で始まる場合
	if (line.startsWith('/')) {
		const spaceIndex = line.indexOf(' ');
		const commandEnd = spaceIndex === -1 ? line.length : spaceIndex;
		const command = line.slice(0, commandEnd);
		result += `<span class="macro-command">${escapeHtml(command)}</span>`;
		pos = commandEnd;
	}

	// 残りの部分を処理
	while (pos < line.length) {
		const char = line[pos];

		if (char === '<') {
			// <...> プレースホルダーを検出
			const closeIndex = line.indexOf('>', pos);
			if (closeIndex !== -1) {
				const placeholder = line.slice(pos, closeIndex + 1);
				result += `<span class="macro-placeholder">${escapeHtml(placeholder)}</span>`;
				pos = closeIndex + 1;
				continue;
			}
		}

		// 通常テキストを蓄積（次の `<` まで、または行末まで）
		let textEnd = pos + 1;
		while (textEnd < line.length && line[textEnd] !== '<') {
			textEnd++;
		}
		const text = line.slice(pos, textEnd);
		result += `<span class="macro-text">${escapeHtml(text)}</span>`;
		pos = textEnd;
	}

	return result;
}

/**
 * マクロテキスト全体からHTMLブロックを生成する
 */
export function renderMacroBlock(text: string): string {
	const lines = text.split('\n');
	const lineCount = lines.length;

	const highlightedLines = lines.map((line) => highlightMacroLine(line)).join('\n');

	const escapedMacroText = escapeHtmlAttr(text);

	return `<div class="ffxiv-macro-block">
  <div class="ffxiv-macro-header">
    <span class="ffxiv-macro-label">FFXIV マクロ</span>
    <button class="ffxiv-macro-copy" data-macro-text="${escapedMacroText}">コピー</button>
  </div>
  <pre class="ffxiv-macro-code"><code>${highlightedLines}</code></pre>
  <div class="ffxiv-macro-footer">
    <span class="ffxiv-macro-line-count">${lineCount}/15行</span>
  </div>
</div>`;
}
