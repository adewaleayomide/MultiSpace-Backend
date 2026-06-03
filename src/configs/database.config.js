import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

let prisma;

export const initializeDatabase = async () => {
  // 1. Create a native network pool pointing to your local PostgreSQL url
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL 
  });
  
  // 2. Instantiate the Prisma PostgreSQL driver adapter
  const adapter = new PrismaPg(pool);
  
  // 3. Inject the adapter so Prisma 7 knows how to communicate with the DB
  prisma = new PrismaClient({ adapter });
  
  await prisma.$connect();
  console.log('Database connected successfully via Prisma 7 Adapter');
};

export const getPrismaClient = () => prisma;

export const disconnectDatabase = async () => {
  if (prisma) await prisma.$disconnect();
};
