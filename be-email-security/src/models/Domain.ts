import Database from "../config/database";
import { Domain } from "../types";

class DomainModel {
  private db = Database.getInstance();

  async create(userId: string, domainName: string): Promise<Domain> {
    const query = `
      INSERT INTO domains (user_id, domain_name)
      VALUES ($1, $2)
      ON CONFLICT (user_id, domain_name) 
      DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, domain_name, is_active, created_at, updated_at
    `;

    const result = await this.db.query(query, [userId, domainName]);
    return this.mapDbRowToDomain(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<Domain[]> {
    const query = `
      SELECT id, user_id, domain_name, is_active, created_at, updated_at
      FROM domains 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows.map((row: any) => this.mapDbRowToDomain(row));
  }

  async findById(id: string): Promise<Domain | null> {
    const query = `
      SELECT id, user_id, domain_name, is_active, created_at, updated_at
      FROM domains 
      WHERE id = $1 AND is_active = true
    `;

    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) return null;
    return this.mapDbRowToDomain(result.rows[0]);
  }

  async findByDomainAndUser(
    domainName: string,
    userId: string
  ): Promise<Domain | null> {
    const query = `
      SELECT id, user_id, domain_name, is_active, created_at, updated_at
      FROM domains 
      WHERE domain_name = $1 AND user_id = $2 AND is_active = true
    `;

    const result = await this.db.query(query, [domainName, userId]);

    if (result.rows.length === 0) return null;
    return this.mapDbRowToDomain(result.rows[0]);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE domains 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
    `;

    const result = await this.db.query(query, [id, userId]);
    return result.rowCount > 0;
  }

  private mapDbRowToDomain(row: any): Domain {
    return {
      id: row.id,
      userId: row.user_id,
      domainName: row.domain_name,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findAllDomainByUserId(userId: string): Promise<any> {
    const query = `
      SELECT 
        d.id, d.user_id, d.domain_name, d.is_active, d.created_at, d.updated_at,
        ts.overall_score, ts.status as session_status, ts.created_at as last_test_date,
        tr.test_type, tr.score, tr.status as test_status
      FROM domains d
      LEFT JOIN LATERAL (
        SELECT * FROM test_sessions 
        WHERE domain_id = d.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) ts ON true
      LEFT JOIN test_results tr ON tr.session_id = ts.id
      WHERE d.user_id = $1 AND d.is_active = true
      ORDER BY d.created_at DESC
    `;

    return await this.db.query(query, [userId]);
  }
}

export default DomainModel;
