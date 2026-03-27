import pg from "pg";
const { Pool } = pg;

// Main database (users, players, bookings, auth)
const connectionString = process.env.DATABASE_URL || import.meta.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL no está configurada. Añádela en tu entorno (.env / Vercel).",
  );
}

export const pool = new Pool({
  connectionString,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const query = async (text: string, params?: any[]) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error("[DB] Query error:", error);
    throw error;
  }
};

export const tableExists = async (tableName: string) => {
  const { rows } = await query(
    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
    [tableName],
  );
  return rows[0].exists;
};

export const columnExists = async (
  tableName: string,
  columnName: string,
): Promise<boolean> => {
  const { rows } = await query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    ) AS exists
  `,
    [tableName, columnName],
  );
  return Boolean(rows[0]?.exists);
};
