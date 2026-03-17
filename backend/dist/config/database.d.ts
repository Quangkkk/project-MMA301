import sql, { config as SQLConfig } from 'mssql';
export declare const dbConfig: SQLConfig;
export declare const getConnection: () => Promise<sql.ConnectionPool>;
export { sql };
//# sourceMappingURL=database.d.ts.map