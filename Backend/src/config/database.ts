import sql, { config as SQLConfig } from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig: SQLConfig = {
  server: process.env.DB_SERVER || 'DRDYNEW',
  database: process.env.DB_DATABASE || 'StudentForum_Final',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

export let poolPromise: Promise<sql.ConnectionPool> | null = null;

export const getConnection = async (): Promise<sql.ConnectionPool> => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then((pool: sql.ConnectionPool) => {
        console.log('✅ Connected to SQL Server database');
        return pool;
      })
      .catch((err: Error) => {
        console.error('❌ Database connection failed:', err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
};

export { sql };
