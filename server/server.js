require('dotenv').config({ override: true });

process.on('uncaughtException', (err) => {
  console.error('DEBUG: UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('DEBUG: UNHANDLED REJECTION:', reason);
});
process.on('exit', (code) => {
  console.log(`DEBUG: PROCESS EXITED WITH CODE: ${code}`);
  console.trace('DEBUG: Exit stack trace');
});

const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test DB connection at http://localhost:${PORT}/seagle-db`);
});