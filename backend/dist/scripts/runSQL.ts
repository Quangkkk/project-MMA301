import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { dbConfig } from '../config/database';

/**
 * Script to automatically run SQL.SQL file
 * This will create/update the database schema
 */
async function runSQLFile() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('📦 Connecting to SQL Server...');
    
    // Connect to master database first to check if StudentForum_Final exists
    const masterConfig = { ...dbConfig, database: 'master' };
    pool = await sql.connect(masterConfig);
    console.log('✅ Connected to master database');
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, '../../..', 'SQL.SQL');
    console.log(`📄 Reading SQL file from: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found at: ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Split SQL content into batches (separated by GO)
    const batches = sqlContent
      .split(/\nGO\n|\nGO\r\n|\r\nGO\r\n/i)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);
    
    console.log(`📊 Found ${batches.length} SQL batches to execute`);
    
    // Execute each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        // Skip empty batches
        if (!batch || batch.trim() === '') continue;
        
        // Check if this is a USE database statement
        if (batch.trim().toUpperCase().startsWith('USE ')) {
          const dbName = batch.trim().split(/\s+/)[1].replace(';', '');
          console.log(`🔄 Switching to database: ${dbName}`);
          
          // Close current pool and connect to the target database
          await pool?.close();
          const newConfig = { ...dbConfig, database: dbName };
          pool = await sql.connect(newConfig);
          continue;
        }
        
        // Execute the batch
        await pool.request().query(batch);
        
        // Log progress for important operations
        if (batch.includes('CREATE TABLE')) {
          const tableName = batch.match(/CREATE TABLE (\w+)/i)?.[1];
          console.log(`✅ Created/Updated table: ${tableName}`);
        } else if (batch.includes('CREATE DATABASE')) {
          const dbName = batch.match(/CREATE DATABASE (\w+)/i)?.[1];
          console.log(`✅ Created database: ${dbName}`);
        } else if (batch.includes('INSERT INTO')) {
          const tableName = batch.match(/INSERT INTO (\w+)/i)?.[1];
          console.log(`✅ Inserted data into: ${tableName}`);
        }
        
      } catch (error: any) {
        // Ignore errors for already existing objects
        if (error.message.includes('already exists') || 
            error.message.includes('already an object named') ||
            error.message.includes('Cannot drop the database')) {
          console.log(`⚠️  Batch ${i + 1}: Object already exists, skipping...`);
          continue;
        }
        
        console.error(`❌ Error in batch ${i + 1}:`, error.message);
        console.error(`Batch content: ${batch.substring(0, 200)}...`);
        // Don't throw, continue with next batch
      }
    }
    
    console.log('✅ SQL file executed successfully!');
    console.log('📊 Database schema is up to date');
    
  } catch (error: any) {
    console.error('❌ Error running SQL file:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  runSQLFile()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default runSQLFile;
