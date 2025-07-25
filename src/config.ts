import { config } from 'dotenv';

// Load environment variables from .env file
config();

export interface DatabaseConfig {
  user: string;
  password: string;
  connectString: string;
  poolMin?: number;
  poolMax?: number;
  poolIncrement?: number;
}

export interface AppConfig {
  database: DatabaseConfig;
  pdfOutputDir: string;
}

export const appConfig: AppConfig = {
  database: {
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    connectString: process.env.DB_CONNECT_STRING || '',
    poolMin: parseInt(process.env.DB_POOL_MIN || '1'),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10'),
    poolIncrement: parseInt(process.env.DB_POOL_INCREMENT || '1'),
  },
  pdfOutputDir: process.env.PDF_OUTPUT_DIR || './output',
};

// Validate required configuration
if (!appConfig.database.user || !appConfig.database.password || !appConfig.database.connectString) {
  throw new Error('Missing required database configuration. Please check your .env file.');
}
