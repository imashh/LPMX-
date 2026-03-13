import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const initDb = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Please set it to your Supabase connection string.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        offer_price REAL,
        sizes TEXT NOT NULL,
        category TEXT NOT NULL,
        show_on_home INTEGER DEFAULT 0,
        show_sale_tag INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        whatsapp_clicks INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        image_url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        product_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create default admin if not exists
    const res = await client.query('SELECT COUNT(*) as count FROM admins');
    if (parseInt(res.rows[0].count, 10) === 0) {
      const hashedPassword = bcrypt.hashSync('lpmx', 10);
      await client.query('INSERT INTO admins (username, password) VALUES ($1, $2)', ['admin', hashedPassword]);
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    client.release();
  }
};

export default pool;
