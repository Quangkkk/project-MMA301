import fs from 'fs';
import path from 'path';
import { getConnection } from '../config/database';
import sql from 'mssql';

async function setupDatabase() {
  try {
    console.log('📦 Reading SQL file...');
    const sqlFilePath = path.join(__dirname, '../../../SQL.SQL');
    let sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    // Replace CRLF with LF for consistent processing
    sqlScript = sqlScript.replace(/\r\n/g, '\n');

    // Split by GO statements
    const statements = sqlScript
      .split(/\nGO\n|\nGO$|^GO\n/gim)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL batches`);
    console.log(`📋 First few batches preview:`);
    statements.slice(0, 5).forEach((stmt, i) => {
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
      console.log(`   ${i + 1}. ${preview}...`);
    });

    // First, connect to master to create database
    console.log('🔌 Connecting to master database...');
    const masterPool = await sql.connect({
      server: process.env.DB_SERVER || 'localhost',
      database: 'master',
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '123',
      port: parseInt(process.env.DB_PORT || '1433'),
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true
      }
    });

    console.log('⚡ Creating/Using database...');
    // Execute CREATE DATABASE and USE statements
    for (let i = 0; i < Math.min(2, statements.length); i++) {
      const statement = statements[i];
      if (statement.includes('CREATE DATABASE') || statement.includes('USE ')) {
        try {
          await masterPool.request().query(statement);
          console.log(`✅ Statement ${i + 1} executed`);
        } catch (err: any) {
          if (!err.message.includes('already exists')) {
            console.log(`⚠️  ${err.message}`);
          }
        }
      }
    }

    await masterPool.close();

    // Now connect to the actual database and create tables
    console.log('🔌 Connecting to StudentForum_Final database...');
    const pool = await getConnection();
    
    console.log('⚡ Creating tables and inserting data...');
    // Skip first 2 statements (CREATE DATABASE and USE)
    for (let i = 2; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await pool.request().query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (err: any) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists') && !err.message.includes('There is already an object')) {
            console.error(`❌ Error in statement ${i + 1}:`, err.message);
          }
        }
      }
    }

    console.log('🎉 Database setup completed!');
    console.log('📊 Verifying data...');
    
    const result = await pool.request().query(`
      SELECT 'Users' AS TableName, COUNT(*) AS RecordCount FROM Users
      UNION ALL SELECT 'Tags', COUNT(*) FROM Tags
      UNION ALL SELECT 'Posts', COUNT(*) FROM Posts
      UNION ALL SELECT 'Comments', COUNT(*) FROM Comments
      UNION ALL SELECT 'Reactions', COUNT(*) FROM Reactions
      UNION ALL SELECT 'Follows', COUNT(*) FROM Follows
      UNION ALL SELECT 'Notifications', COUNT(*) FROM Notifications
      UNION ALL SELECT 'Reports', COUNT(*) FROM Reports
      UNION ALL SELECT 'Post_Tags', COUNT(*) FROM Post_Tags
      UNION ALL SELECT 'CommentEditHistory', COUNT(*) FROM CommentEditHistory
      UNION ALL SELECT 'Conversations', COUNT(*) FROM Conversations
      UNION ALL SELECT 'Messages', COUNT(*) FROM Messages
      UNION ALL SELECT 'Media', COUNT(*) FROM Media
      UNION ALL SELECT 'Media_Entity_Mapping', COUNT(*) FROM Media_Entity_Mapping
    `);
    
    console.table(result.recordset);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
