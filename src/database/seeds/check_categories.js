require('dotenv').config();
const pool = require('../../config/database');

const checkCategories = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, name_si, name_en, name_ta, 
             description, description_si, description_en, description_ta 
      FROM categories 
      ORDER BY id
    `);

    console.log('\n📋 Categories with multilingual data:\n');
    console.log('ID | English | Sinhala | Tamil');
    console.log('---+-------------------+-------------------+-------------------');

    rows.forEach((r) => {
      console.log(
        `${r.id}  | ${r.name_en || 'NULL'} | ${r.name_si || 'NULL'} | ${r.name_ta || 'NULL'}`
      );
    });

    console.log('\n✅ Check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkCategories();
