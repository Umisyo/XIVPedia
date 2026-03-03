import { createDb } from './index';
import { tags } from './schema';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const db = createDb(DATABASE_URL);

async function seed() {
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
