require('dotenv').config();
const pool = require('../../config/database');

const categoriesData = [
  {
    id: 1,
    name_si: 'දේශපාලනය',
    name_en: 'Politics',
    name_ta: 'அரசியல்',
    description_si: 'දේශපාලන පුවත් සහ යාවත්කාලීන කිරීම්',
    description_en: 'Political news and updates',
    description_ta: 'அரசியல் செய்திகள் மற்றும் புதுப்பிப்புகள்',
  },
  {
    id: 2,
    name_si: 'තාක්ෂණය',
    name_en: 'Technology',
    name_ta: 'தொழில்நுட்பம்',
    description_si: 'තාක්ෂණික පුවත් සහ නවෝත්පාදන',
    description_en: 'Tech news and innovations',
    description_ta: 'தொழில்நுட்ப செய்திகள் மற்றும் புதுமைகள்',
  },
  {
    id: 3,
    name_si: 'ක්‍රීඩා',
    name_en: 'Sports',
    name_ta: 'விளையாட்டு',
    description_si: 'ක්‍රීඩා පුවත් සහ විශේෂාංග',
    description_en: 'Sports news and highlights',
    description_ta: 'விளையாட்டு செய்திகள் மற்றும் சிறப்பம்சங்கள்',
  },
  {
    id: 4,
    name_si: 'විනෝදාස්වාදය',
    name_en: 'Entertainment',
    name_ta: 'பொழுதுபோக்கு',
    description_si: 'විනෝදාස්වාද සහ කීර්තිමත් පුවත්',
    description_en: 'Entertainment and celebrity news',
    description_ta: 'பொழுதுபோக்கு மற்றும் பிரபல செய்திகள்',
  },
  {
    id: 5,
    name_si: 'ව්‍යාපාර',
    name_en: 'Business',
    name_ta: 'வணிகம்',
    description_si: 'ව්‍යාපාර සහ ආර්ථික පුවත්',
    description_en: 'Business and economy news',
    description_ta: 'வணிகம் மற்றும் பொருளாதார செய்திகள்',
  },
  {
    id: 6,
    name_si: 'සෞඛ්‍යය',
    name_en: 'Health',
    name_ta: 'உடல்நலம்',
    description_si: 'සෞඛ්‍ය සහ යහපැවැත්ම පුවත්',
    description_en: 'Health and wellness news',
    description_ta: 'சுகாதாரம் மற்றும் நலன் செய்திகள்',
  },
];

const seedCategories = async () => {
  try {
    console.log('🌱 Seeding multilingual category data...\n');

    for (const category of categoriesData) {
      const query = `
        UPDATE categories 
        SET name_si = ?, 
            name_en = ?, 
            name_ta = ?,
            description_si = ?,
            description_en = ?,
            description_ta = ?
        WHERE id = ?
      `;

      await pool.query(query, [
        category.name_si,
        category.name_en,
        category.name_ta,
        category.description_si,
        category.description_en,
        category.description_ta,
        category.id,
      ]);

      console.log(`✅ Updated category ID ${category.id}: ${category.name_en}`);
    }

    console.log('\n✅ All categories updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedCategories();
