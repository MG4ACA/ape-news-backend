require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const runMigrations = async () => {
  try {
    console.log('🔄 Running database migrations...\n');

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`📝 Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        try {
          await pool.query(sql);
          console.log(`✅ ${file} completed\n`);
        } catch (error) {
          // Check if it's a duplicate column error, which we can ignore
          if (
            error.code === 'ER_DUP_FIELDNAME' ||
            error.message.includes('Duplicate column name')
          ) {
            console.log(`⚠️  ${file} skipped (columns already exist)\n`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

runMigrations();
