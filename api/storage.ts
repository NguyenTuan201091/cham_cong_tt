import { Pool } from 'pg';

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req: any, res: any) {
  let client;

  try {
    client = await pool.connect();

    // Create table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_storage (
        id SERIAL PRIMARY KEY,
        data JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT data
        FROM app_storage
        ORDER BY updated_at DESC
        LIMIT 1
      `);

      return res.status(200).json(result.rows[0]?.data ?? {});
    }

    if (req.method === 'POST') {
      let body = '';
      await new Promise<void>((resolve, reject) => {
        req.on('data', (chunk: any) => (body += chunk.toString()));
        req.on('end', resolve);
        req.on('error', reject);
      });

      if (!body) {
        return res.status(400).json({ error: 'Empty body' });
      }

      const data = JSON.parse(body);

      await client.query(
        `INSERT INTO app_storage (data) VALUES ($1)`,
        [data]
      );

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('STORAGE API ERROR:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client?.release();
  }
}
