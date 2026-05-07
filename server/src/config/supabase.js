// server/src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const {
  SUPABASE_URL,
  SUPABASE_KEY,
  SUPABASE_BUCKET,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase env vars: SUPABASE_URL, SUPABASE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const bucketName = SUPABASE_BUCKET || 'seagle';

console.log('Supabase initialized with bucket:', bucketName);

module.exports = { supabase, bucketName };