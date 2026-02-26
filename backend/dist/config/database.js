"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = exports.getConnection = exports.dbConfig = void 0;
const mssql_1 = __importDefault(require("mssql"));
exports.sql = mssql_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.dbConfig = {
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
let poolPromise = null;
const getConnection = async () => {
    if (!poolPromise) {
        poolPromise = new mssql_1.default.ConnectionPool(exports.dbConfig)
            .connect()
            .then((pool) => {
            console.log('✅ Connected to SQL Server database');
            return pool;
        })
            .catch((err) => {
            console.error('❌ Database connection failed:', err);
            poolPromise = null;
            throw err;
        });
    }
    return poolPromise;
};
exports.getConnection = getConnection;
//# sourceMappingURL=database.js.map