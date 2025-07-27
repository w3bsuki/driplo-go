const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://nhxpnfspawlibdpihuqp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oeHBuZnNwYXdsaWJkcGlodXFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzUxODA2NCwiZXhwIjoyMDY5MDk0MDY0fQ.TqvxiuQN56UD2wzeg3I-5tQBc0y-xPvgYTRIpgEY-xk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync('init-database.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('query', { query_text: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try executing via direct connection
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: 'postgresql://postgres.nhxpnfspawlibdpihuqp:941015tyJa7!@db.nhxpnfspawlibdpihuqp.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
      });
      
      const client = await pool.connect();
      try {
        await client.query(sql);
        console.log('Database schema created successfully!');
      } finally {
        client.release();
        await pool.end();
      }
    } else {
      console.log('Database setup completed successfully!');
    }
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupDatabase();