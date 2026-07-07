require('dotenv').config();

async function testFetch() {
  console.log('Testing fetch to:', process.env.SUPABASE_URL);
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/storage/v1/health`);
    console.log('Fetch succeeded, status:', res.status);
    console.log('Body:', await res.text());
  } catch (err) {
    console.error('Fetch failed!');
    console.error('Error message:', err.message);
    if (err.cause) {
      console.error('Underlying cause:', err.cause);
    }
    console.error('Full stack:', err.stack);
  }
}

testFetch();
