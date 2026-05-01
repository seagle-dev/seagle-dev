require('dotenv').config({ override: true });
const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test DB connection at http://localhost:${PORT}/seagle-db`);
});