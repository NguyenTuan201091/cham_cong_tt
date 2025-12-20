import { sql } from '@vercel/postgres';

export default async function handler(req: any, res: any) {
  try {
    // CREATE TABLE ONCE
    await sql`
      CREATE TABLE IF NOT EXISTS app_storage (
        id SERIAL PRIMARY KEY,
        data JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // GET DATA
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT data
        FROM app_storage
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      return res.status(200).json(rows[0]?.data ?? {});
    }

    // SAVE DATA
    if (req.method === 'POST') {
      const body = req.body;

      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid body' });
      }

      await sql`
        INSERT INTO app_storage (data)
        VALUES (${JSON.stringify(body)})
      `;

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('API STORAGE ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
}
