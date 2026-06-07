require('dotenv').config();
const { connectDB } = require('../config/db');
const { runSeed } = require('../seeders');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const fresh = process.argv.includes('--fresh');

async function main() {
  await connectDB();
  try {
    const counts = await runSeed({ fresh });
    logger.info('Seed results:', counts);
  } finally {
    await mongoose.disconnect();
    logger.info('Database disconnected');
  }
}

main().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
