require('dotenv').config({ override: true });
const db = require('../src/config/db');

async function resetFileCache() {
  try {
    const deleteAll = process.argv.includes('--delete-all');

    console.log('🔄 Starting database file cache reset...\n');

    if (deleteAll) {
      console.log('⚠️  Deleting all data (--delete-all flag)...');

      const [mappingsDeleted] = await db.execute('DELETE FROM mappings');
      console.log(`✓ Deleted ${mappingsDeleted.affectedRows} mappings`);

      const [modelsDeleted] = await db.execute('DELETE FROM models_3d');
      console.log(`✓ Deleted ${modelsDeleted.affectedRows} models`);

      const [booksDeleted] = await db.execute('DELETE FROM books');
      console.log(`✓ Deleted ${booksDeleted.affectedRows} books\n`);
    } else {
      console.log('Clearing book cover_image and pdf_url...');
      const [booksResult] = await db.execute(
        'UPDATE books SET cover_image = NULL, pdf_url = NULL'
      );
      console.log(`✓ Updated ${booksResult.affectedRows} books\n`);

      console.log('Skipping models file_url reset because file_url is NOT NULL.');
      console.log('Use --delete-all if you want to remove model rows completely.\n');
    }

    const [books] = await db.execute('SELECT COUNT(*) as count FROM books');
    const [models] = await db.execute('SELECT COUNT(*) as count FROM models_3d');
    const [mappings] = await db.execute('SELECT COUNT(*) as count FROM mappings');

    console.log('📊 Current database state:');
    console.log(`   Books: ${books[0].count}`);
    console.log(`   Models: ${models[0].count}`);
    console.log(`   Mappings: ${mappings[0].count}\n`);

    console.log('✅ Database reset complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during reset:', err.message);
    process.exit(1);
  }
}

resetFileCache();