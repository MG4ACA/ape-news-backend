require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/database');

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...\n');

    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await pool.query(
      `
      INSERT INTO users (username, email, password, full_name, role) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE username = username
    `,
      ['admin', 'admin@apenews.com', hashedPassword, 'Super Admin', 'super_admin']
    );
    console.log('✅ Super admin created (admin@apenews.com / admin123)');

    // Create editor user
    const editorPassword = await bcrypt.hash('editor123', 10);
    await pool.query(
      `
      INSERT INTO users (username, email, password, full_name, role) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE username = username
    `,
      ['editor', 'editor@apenews.com', editorPassword, 'News Editor', 'editor']
    );
    console.log('✅ Editor user created (editor@apenews.com / editor123)');

    // Create sample categories
    const categories = [
      {
        name: 'Politics',
        slug: 'politics',
        description: 'Political news and updates',
        icon: 'pi-flag',
        color: '#FF6B6B',
      },
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Tech news and innovations',
        icon: 'pi-desktop',
        color: '#4ECDC4',
      },
      {
        name: 'Sports',
        slug: 'sports',
        description: 'Sports news and highlights',
        icon: 'pi-trophy',
        color: '#95E1D3',
      },
      {
        name: 'Entertainment',
        slug: 'entertainment',
        description: 'Entertainment and celebrity news',
        icon: 'pi-star',
        color: '#F38181',
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'Business and economy news',
        icon: 'pi-briefcase',
        color: '#FFA07A',
      },
      {
        name: 'Health',
        slug: 'health',
        description: 'Health and wellness news',
        icon: 'pi-heart',
        color: '#98D8C8',
      },
    ];

    for (const category of categories) {
      await pool.query(
        `
        INSERT INTO categories (name, slug, description, icon, color) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = name
      `,
        [category.name, category.slug, category.description, category.icon, category.color]
      );
    }
    console.log('✅ Sample categories created');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Super Admin: admin@apenews.com / admin123');
    console.log('   Editor: editor@apenews.com / editor123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
