#!/usr/bin/env node

/**
 * Database Setup Verification Script
 * 
 * This script checks if your Supabase database is properly set up with all required tables.
 * If tables are missing, it will guide you through the setup process.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Environment variables not found!');
  console.error('Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Required tables for the workout tracker
const REQUIRED_TABLES = [
  'profiles',
  'workouts', 
  'body_weights',
  'exercises',
  'user_exercises'
];

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table not found
      return false;
    } else if (error) {
      console.warn(`⚠️  Warning checking table '${tableName}':`, error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.warn(`⚠️  Error checking table '${tableName}':`, err.message);
    return false;
  }
}

async function checkAllTables() {
  console.log('🔍 Checking database setup...\n');
  
  const tableResults = {};
  let allTablesExist = true;
  
  for (const table of REQUIRED_TABLES) {
    const exists = await checkTable(table);
    tableResults[table] = exists;
    
    if (exists) {
      console.log(`✅ ${table} - OK`);
    } else {
      console.log(`❌ ${table} - MISSING`);
      allTablesExist = false;
    }
  }
  
  console.log('');
  
  if (allTablesExist) {
    console.log('🎉 All database tables are set up correctly!');
    console.log('Your app should work properly now.');
    
    // Test basic connectivity
    try {
      const { data: exercises } = await supabase.from('exercises').select('count').single();
      console.log(`📊 Found ${exercises?.count || 0} exercises in the global library`);
    } catch (err) {
      console.log('ℹ️  Exercise count unavailable (this is normal if no data exists yet)');
    }
    
  } else {
    console.log('❌ Database setup is incomplete!');
    console.log('\n📋 Next steps:');
    console.log('1. Open your Supabase dashboard: ' + SUPABASE_URL.replace('/rest/v1', ''));
    console.log('2. Go to the SQL Editor');
    console.log('3. Copy the contents of database-schema.sql');
    console.log('4. Paste it into the SQL Editor and click "Run"');
    console.log('5. Run this script again to verify: npm run check-db');
    console.log('\nDetailed setup guide: SUPABASE_SETUP.md');
  }
  
  return allTablesExist;
}

async function main() {
  try {
    // Test basic connection first
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message.includes('Invalid API key')) {
      console.error('❌ Invalid Supabase API key! Check your .env file.');
      process.exit(1);
    }
    
    console.log('✅ Connection successful');
    console.log('📍 Project URL:', SUPABASE_URL);
    console.log('');
    
    const success = await checkAllTables();
    
    if (!success) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Check your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.error('- Verify your Supabase project is active');
    console.error('- Check your internet connection');
    process.exit(1);
  }
}

main();