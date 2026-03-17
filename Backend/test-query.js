const sql = require('mssql');

const config = {
  server: 'DRDYNEW',
  database: 'StudentForum_Final',
  user: 'sa',
  password: '123',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function testQuery() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('✅ Connected!');
    
    console.log('\nTest 1: Simple SELECT');
    const result1 = await pool.request().query('SELECT TOP 1 * FROM dbo.Posts');
    console.log('Columns:', Object.keys(result1.recordset[0]));
    console.log('Data:', result1.recordset[0]);
    
    console.log('\nTest 2: With alias');
    const result2 = await pool.request().query('SELECT TOP 1 p.PostID, p.Title FROM dbo.Posts p');
    console.log('Result:', result2.recordset[0]);
    
    console.log('\nTest 3: Full query like service');
    const result3 = await pool.request().query(`
      SELECT 
        p.PostID as postId,
        p.Title as title,
        p.Content as content
      FROM dbo.Posts p
      ORDER BY p.CreatedAt DESC
      OFFSET 0 ROWS
      FETCH NEXT 1 ROWS ONLY
    `);
    console.log('Result:', result3.recordset[0]);
    
    await pool.close();
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.originalError) {
      console.error('Original:', error.originalError);
    }
  }
}

testQuery();
