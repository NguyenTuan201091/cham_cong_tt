import { db } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const client = await db.connect();

  try {
    // Tạo bảng lưu trữ tập trung nếu chưa có
    await client.sql`CREATE TABLE IF NOT EXISTS app_storage (id SERIAL PRIMARY KEY, data JSONB, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;

    if (req.method === 'GET') {
      // Lấy bản ghi mới nhất
      const { rows } = await client.sql`SELECT data FROM app_storage ORDER BY updated_at DESC LIMIT 1;`;
      return res.status(200).json(rows[0]?.data || {});
    }

    if (req.method === 'POST') {
      const payload = req.body;
      // Lưu toàn bộ trạng thái vào database
      await client.sql`INSERT INTO app_storage (data) VALUES (${JSON.stringify(payload)});`;
      // Xóa các bản ghi cũ để tránh nặng database (chỉ giữ lại 5 bản gần nhất)
      await client.sql`DELETE FROM app_storage WHERE id NOT IN (SELECT id FROM app_storage ORDER BY updated_at DESC LIMIT 5);`;
      return res.status(200).json({ message: 'Đã đồng bộ thành công' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
