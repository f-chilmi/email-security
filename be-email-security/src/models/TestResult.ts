import Database from "../config/database";
import { TestResult, TestSession, TestType, TestStatus } from "../types";

class TestResultModel {
  private db = Database.getInstance();

  async createSession(
    domainId: string,
    userId: string,
    sessionName?: string
  ): Promise<TestSession> {
    const query = `
      INSERT INTO test_sessions (domain_id, user_id, session_name)
      VALUES ($1, $2, $3)
      RETURNING id, domain_id, user_id, session_name, status, total_tests, completed_tests, overall_score, created_at, updated_at
    `;

    const result = await this.db.query(query, [domainId, userId, sessionName]);
    return this.mapDbRowToSession(result.rows[0]);
  }

  async createTestResult(
    sessionId: string,
    domainId: string,
    testType: TestType
  ): Promise<TestResult> {
    const query = `
      INSERT INTO test_results (session_id, domain_id, test_type)
      VALUES ($1, $2, $3)
      RETURNING id, domain_id, session_id, test_type, status, result_data, error_message, score, recommendations, started_at, completed_at, created_at
    `;

    const result = await this.db.query(query, [sessionId, domainId, testType]);
    return this.mapDbRowToTestResult(result.rows[0]);
  }

  async updateTestResult(
    id: string,
    updates: Partial<TestResult>
  ): Promise<TestResult> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      setClause.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.resultData !== undefined) {
      setClause.push(`result_data = $${paramIndex++}`);
      values.push(JSON.stringify(updates.resultData));
    }
    if (updates.errorMessage !== undefined) {
      setClause.push(`error_message = $${paramIndex++}`);
      values.push(updates.errorMessage);
    }
    if (updates.score !== undefined) {
      setClause.push(`score = $${paramIndex++}`);
      values.push(updates.score);
    }
    if (updates.recommendations !== undefined) {
      setClause.push(`recommendations = $${paramIndex++}`);
      values.push(updates.recommendations);
    }
    if (updates.completedAt !== undefined) {
      setClause.push(`completed_at = $${paramIndex++}`);
      values.push(updates.completedAt);
    }

    values.push(id);

    const query = `
      UPDATE test_results 
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, domain_id, session_id, test_type, status, result_data, error_message, score, recommendations, started_at, completed_at, created_at
    `;

    const result = await this.db.query(query, values);
    return this.mapDbRowToTestResult(result.rows[0]);
  }

  async updateSession(
    id: string,
    updates: Partial<TestSession>
  ): Promise<TestSession> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      setClause.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.completedTests !== undefined) {
      setClause.push(`completed_tests = $${paramIndex++}`);
      values.push(updates.completedTests);
    }
    if (updates.overallScore !== undefined) {
      setClause.push(`overall_score = $${paramIndex++}`);
      values.push(updates.overallScore);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE test_sessions 
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, domain_id, user_id, session_name, status, total_tests, completed_tests, overall_score, created_at, updated_at
    `;

    const result = await this.db.query(query, values);
    return this.mapDbRowToSession(result.rows[0]);
  }

  async getSessionById(id: string): Promise<TestSession | null> {
    const query = `
      SELECT id, domain_id, user_id, session_name, status, total_tests, completed_tests, overall_score, created_at, updated_at
      FROM test_sessions WHERE id = $1
    `;

    const result = await this.db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapDbRowToSession(result.rows[0]);
  }

  async getSessionsByUserId(
    userId: string,
    limit = 50
  ): Promise<TestSession[]> {
    const query = `
      SELECT ts.id, ts.domain_id, ts.user_id, ts.session_name, ts.status, ts.total_tests, ts.completed_tests, ts.overall_score, ts.created_at, ts.updated_at,
             d.domain_name
      FROM test_sessions ts
      JOIN domains d ON ts.domain_id = d.id
      WHERE ts.user_id = $1
      ORDER BY ts.created_at DESC
      LIMIT $2
    `;

    const result = await this.db.query(query, [userId, limit]);
    return result.rows.map((row: any) => ({
      ...this.mapDbRowToSession(row),
      domainName: row.domain_name,
    }));
  }

  async getTestResultsBySessionId(sessionId: string): Promise<TestResult[]> {
    const query = `
      SELECT id, domain_id, session_id, test_type, status, result_data, error_message, score, recommendations, started_at, completed_at, created_at
      FROM test_results 
      WHERE session_id = $1
      ORDER BY created_at ASC
    `;

    const result = await this.db.query(query, [sessionId]);
    return result.rows.map((row: any) => this.mapDbRowToTestResult(row));
  }

  private mapDbRowToSession(row: any): TestSession {
    return {
      id: row.id,
      domainId: row.domain_id,
      userId: row.user_id,
      sessionName: row.session_name,
      status: row.status as TestStatus,
      totalTests: row.total_tests,
      completedTests: row.completed_tests,
      overallScore: row.overall_score,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapDbRowToTestResult(row: any): TestResult {
    return {
      id: row.id,
      domainId: row.domain_id,
      sessionId: row.session_id,
      testType: row.test_type as TestType,
      status: row.status as TestStatus,
      resultData: row.result_data,
      errorMessage: row.error_message,
      score: row.score,
      recommendations: row.recommendations,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  async getLatestResultsForAllDomains(
    userId: string
  ): Promise<{ [domainId: string]: TestResult[] }> {
    const query = `
    SELECT DISTINCT ON (tr.domain_id, tr.test_type) 
           tr.id, tr.domain_id, tr.session_id, tr.test_type, tr.status, 
           tr.result_data, tr.error_message, tr.score, tr.recommendations, 
           tr.started_at, tr.completed_at, tr.created_at
    FROM test_results tr
    JOIN domains d ON tr.domain_id = d.id
    WHERE d.user_id = $1 AND tr.status = 'COMPLETED'
    ORDER BY tr.domain_id, tr.test_type, tr.created_at DESC
  `;

    const result = await this.db.query(query, [userId]);
    const testsByDomain: { [domainId: string]: TestResult[] } = {};

    result.rows.forEach((row: any) => {
      const test = this.mapDbRowToTestResult(row);
      if (!testsByDomain[test.domainId]) {
        testsByDomain[test.domainId] = [];
      }
      testsByDomain[test.domainId].push(test);
    });

    return testsByDomain;
  }
}

export default TestResultModel;
