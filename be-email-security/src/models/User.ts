import Database from "../config/database";
import bcrypt from "bcryptjs";
import { User, RegisterRequest } from "../types";

class UserModel {
  private db = Database.getInstance();

  async create(userData: RegisterRequest): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, organization)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, organization, is_active, created_at, updated_at
    `;

    const result = await this.db.query(query, [
      userData.email,
      hashedPassword,
      userData.firstName || null,
      userData.lastName || null,
      userData.organization || null,
    ]);

    return this.mapDbRowToUser(result.rows[0]);
  }

  async findByEmail(
    email: string
  ): Promise<(User & { passwordHash: string }) | null> {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, organization, is_active, created_at, updated_at
      FROM users WHERE email = $1 AND is_active = true
    `;

    const result = await this.db.query(query, [email]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...this.mapDbRowToUser(row),
      passwordHash: row.password_hash,
    };
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, email, first_name, last_name, organization, is_active, created_at, updated_at
      FROM users WHERE id = $1 AND is_active = true
    `;

    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) return null;

    return this.mapDbRowToUser(result.rows[0]);
  }

  async updateLastLogin(id: string): Promise<void> {
    const query = `UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
    await this.db.query(query, [id]);
  }

  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private mapDbRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      organization: row.organization,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export default UserModel;
