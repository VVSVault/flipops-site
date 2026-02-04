// Start script for Next.js standalone server in Railway
// Ensures the server binds to 0.0.0.0 to accept external connections

process.env.HOSTNAME = '0.0.0.0';
process.env.PORT = process.env.PORT || '8080';

require('./.next/standalone/server.js');
