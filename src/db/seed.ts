import { createDb } from './index';
import { tagCategories, tags } from './schema';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const db = createDb(DATABASE_URL);

async function seed() {
	console.log('Seeding tag categories...');
	await db
		.insert(tagCategories)
		.values([
			{ name: 'コンテンツ', slug: 'duty', displayOrder: 0 },
			{ name: 'ジョブ', slug: 'job', displayOrder: 1 },
			{ name: 'クラフト', slug: 'crafting', displayOrder: 2 },
			{ name: '採集', slug: 'gathering', displayOrder: 3 },
			{ name: '全般', slug: 'general', displayOrder: 4 },
			{ name: 'PvP', slug: 'pvp', displayOrder: 5 },
			{ name: 'クエスト', slug: 'quest', displayOrder: 6 },
			{ name: 'ゴールドソーサー', slug: 'gold-saucer', displayOrder: 7 },
		])
		.onConflictDoNothing();

	console.log('Seeding tags...');
	await db
		.insert(tags)
		.values([
			// duty カテゴリ
			{ name: 'レイド', slug: 'raid', category: 'duty' },
			{ name: '討滅戦', slug: 'trial', category: 'duty' },
			{ name: 'ダンジョン', slug: 'dungeon', category: 'duty' },
			{ name: '極討滅戦', slug: 'extreme', category: 'duty' },
			{ name: '零式', slug: 'savage', category: 'duty' },
			{ name: '絶', slug: 'ultimate', category: 'duty' },
			{ name: 'アライアンスレイド', slug: 'alliance-raid', category: 'duty' },
			{ name: 'ディープダンジョン', slug: 'deep-dungeon', category: 'duty' },
			{ name: 'ヴァリアントダンジョン', slug: 'variant-dungeon', category: 'duty' },
			{ name: '宝物庫', slug: 'treasure-dungeon', category: 'duty' },
			// job カテゴリ（ロール）
			{ name: 'タンク', slug: 'tank', category: 'job' },
			{ name: 'ヒーラー', slug: 'healer', category: 'job' },
			{ name: 'DPS', slug: 'dps', category: 'job' },
			// job カテゴリ（個別ジョブ）
			{ name: 'ナイト', slug: 'paladin', category: 'job' },
			{ name: '戦士', slug: 'warrior', category: 'job' },
			{ name: '暗黒騎士', slug: 'dark-knight', category: 'job' },
			{ name: 'ガンブレイカー', slug: 'gunbreaker', category: 'job' },
			{ name: '白魔道士', slug: 'white-mage', category: 'job' },
			{ name: '学者', slug: 'scholar', category: 'job' },
			{ name: '占星術師', slug: 'astrologian', category: 'job' },
			{ name: '賢者', slug: 'sage', category: 'job' },
			{ name: 'モンク', slug: 'monk', category: 'job' },
			{ name: '竜騎士', slug: 'dragoon', category: 'job' },
			{ name: '忍者', slug: 'ninja', category: 'job' },
			{ name: '侍', slug: 'samurai', category: 'job' },
			{ name: 'リーパー', slug: 'reaper', category: 'job' },
			{ name: 'ヴァイパー', slug: 'viper', category: 'job' },
			{ name: '吟遊詩人', slug: 'bard', category: 'job' },
			{ name: '機工士', slug: 'machinist', category: 'job' },
			{ name: '踊り子', slug: 'dancer', category: 'job' },
			{ name: '黒魔道士', slug: 'black-mage', category: 'job' },
			{ name: '召喚士', slug: 'summoner', category: 'job' },
			{ name: '赤魔道士', slug: 'red-mage', category: 'job' },
			{ name: 'ピクトマンサー', slug: 'pictomancer', category: 'job' },
			{ name: '青魔道士', slug: 'blue-mage', category: 'job' },
			// crafting カテゴリ
			{ name: 'クラフター', slug: 'crafter', category: 'crafting' },
			{ name: '木工師', slug: 'carpenter', category: 'crafting' },
			{ name: '鍛冶師', slug: 'blacksmith', category: 'crafting' },
			{ name: '甲冑師', slug: 'armorer', category: 'crafting' },
			{ name: '彫金師', slug: 'goldsmith', category: 'crafting' },
			{ name: '革細工師', slug: 'leatherworker', category: 'crafting' },
			{ name: '裁縫師', slug: 'weaver', category: 'crafting' },
			{ name: '錬金術師', slug: 'alchemist', category: 'crafting' },
			{ name: '調理師', slug: 'culinarian', category: 'crafting' },
			// gathering カテゴリ
			{ name: 'ギャザラー', slug: 'gatherer', category: 'gathering' },
			{ name: '採掘師', slug: 'miner', category: 'gathering' },
			{ name: '園芸師', slug: 'botanist', category: 'gathering' },
			{ name: '漁師', slug: 'fisher', category: 'gathering' },
			// general カテゴリ
			{ name: '初心者向け', slug: 'beginner', category: 'general' },
			{ name: '金策', slug: 'gil-making', category: 'general' },
			{ name: 'ハウジング', slug: 'housing', category: 'general' },
			{ name: 'ミラプリ', slug: 'glamour', category: 'general' },
			{ name: 'マクロ', slug: 'macro', category: 'general' },
			{ name: 'マーケットボード', slug: 'market-board', category: 'general' },
			{ name: 'マウント', slug: 'mount', category: 'general' },
			{ name: 'ミニオン', slug: 'minion', category: 'general' },
			{ name: '蛮族クエスト', slug: 'beast-tribe', category: 'general' },
			{ name: 'お得意様取引', slug: 'custom-deliveries', category: 'general' },
			{ name: '冒険者小隊', slug: 'adventurer-squadron', category: 'general' },
			// pvp カテゴリ
			{ name: 'クリスタルコンフリクト', slug: 'crystalline-conflict', category: 'pvp' },
			{ name: 'フロントライン', slug: 'frontline', category: 'pvp' },
			{ name: 'ライバルウィングズ', slug: 'rival-wings', category: 'pvp' },
			// quest カテゴリ
			{ name: 'メインクエスト', slug: 'main-scenario', category: 'quest' },
			{ name: 'サブクエスト', slug: 'side-quest', category: 'quest' },
			{ name: 'ジョブクエスト', slug: 'job-quest', category: 'quest' },
			{ name: 'クロニクルクエスト', slug: 'chronicle-quest', category: 'quest' },
			// gold-saucer カテゴリ
			{ name: 'トリプルトライアド', slug: 'triple-triad', category: 'gold-saucer' },
			{ name: 'チョコボレース', slug: 'chocobo-racing', category: 'gold-saucer' },
			{ name: 'ロードオブヴァーミニオン', slug: 'lord-of-verminion', category: 'gold-saucer' },
			{ name: 'ファッションチェック', slug: 'fashion-check', category: 'gold-saucer' },
		])
		.onConflictDoNothing();
	console.log('Done!');
	process.exit(0);
}

seed();
