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
		])
		.onConflictDoNothing();

	console.log('Seeding tags...');
	await db
		.insert(tags)
		.values([
			{ name: 'レイド', slug: 'raid', category: 'duty' },
			{ name: '討滅戦', slug: 'trial', category: 'duty' },
			{ name: 'ダンジョン', slug: 'dungeon', category: 'duty' },
			{ name: 'タンク', slug: 'tank', category: 'job' },
			{ name: 'ヒーラー', slug: 'healer', category: 'job' },
			{ name: 'DPS', slug: 'dps', category: 'job' },
			{ name: 'クラフター', slug: 'crafter', category: 'crafting' },
			{ name: 'ギャザラー', slug: 'gatherer', category: 'gathering' },
			{ name: '初心者向け', slug: 'beginner', category: 'general' },
			{ name: '金策', slug: 'gil-making', category: 'general' },
			{ name: 'ハウジング', slug: 'housing', category: 'general' },
			{ name: 'ミラプリ', slug: 'glamour', category: 'general' },
		])
		.onConflictDoNothing();
	console.log('Done!');
	process.exit(0);
}

seed();
