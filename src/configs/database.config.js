import { PrismaClient } from '@prisma/client';

let prisma;

export const initializeDatabase = async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
  console.log('Database connected');
};

export const getPrismaClient = () => prisma;

export const disconnectDatabase = async () => {
  if (prisma) await prisma.$disconnect();
};
