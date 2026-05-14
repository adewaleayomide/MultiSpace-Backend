import dotenv from 'dotenv';

dotenv.config();

export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY,
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY,
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS || 10,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
};