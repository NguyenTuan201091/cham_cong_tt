// api/db.ts
import { db } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const client = await db.connect();

  try {
    // Tự động tạo bảng nếu chưa có
    await client.sql`CREATE TABLE IF NOT EXISTS workers (id TEXT PRIMARY KEY, name TEXT, role TEXT, current_project_id TEXT, bank_account TEXT, bank_name TEXT);`;
    await client.sql`CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT, address TEXT, status TEXT, standard_rate INT, double_rate INT);`;
    await client.sql`CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, worker_id TEXT, project_id TEXT, date TEXT, shifts FLOAT, rate_used INT);`;

    if (req.method === 'GET') {
      const workers = await client.sql`SELECT * FROM workers`;
      const projects = await client.sql`SELECT * FROM projects`;
      const records = await client.sql`SELECT * FROM records`;
      return res.status(200).json({ workers: workers.rows, projects: projects.rows, records: records.rows });
    }

    if (req.method === 'POST') {
      const { type, data } = req.body;
      if (type === 'add_record') {
        for (const r of data) {
          await client.sql`INSERT INTO records (id, worker_id, project_id, date, shifts, rate_used) VALUES (${r.id}, ${r.workerId}, ${r.projectId}, ${r.date}, ${r.shifts}, ${r.rateUsed})`;
        }
      }
      return res.status(200).json({ message: 'Thành công' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
