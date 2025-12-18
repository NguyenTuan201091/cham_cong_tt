import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const runtime = 'nodejs';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Tạo bảng nếu chưa có
    await sql`
      CREATE TABLE IF NOT EXISTS app_storage (
        id SERIAL PRIMARY KEY,
        data JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT data FROM app_storage
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      return res.status(200).json(rows[0]?.data ?? {});
    }

    if (req.method === 'POST') {
      const payload = req.body;

      await sql`
        INSERT INTO app_storage (data)
        VALUES (${JSON.stringify(payload)})
      `;

      await sql`
        DELETE FROM app_storage
        WHERE id NOT IN (
          SELECT id FROM app_storage
          ORDER BY updated_at DESC
          LIMIT 5
        )
      `;

      return res.status(200).json({ message: 'Đã đồng bộ thành công' });
    }

    return res.status(405).end();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
