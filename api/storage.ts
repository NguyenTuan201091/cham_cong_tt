import { sql } from '@vercel/postgres';

export default async function handler(req: any, res: any) {
  try {
    // tạo bảng nếu chưa có
    await sql`
      CREATE TABLE IF NOT EXISTS app_storage (
        id SERIAL PRIMARY KEY,
        data JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // GET
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT data
        FROM app_storage
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      return res.status(200).json(rows[0]?.data ?? {});
    }

    // POST
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

      await sql`
        INSERT INTO app_storage (data)
        VALUES (${JSON.stringify(data)})
      `;

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('STORAGE API ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
}
