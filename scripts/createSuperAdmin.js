import bcrypt from 'bcrypt';
import { prisma } from '../src/configs/database.config.js';
import { UserRole } from '@prisma/client'
import { env } from '../src/configs/env.config.js';

const createSuperAdmin = async () => {
  const hashedPassword = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 10);

  await prisma.user.create({
    data: {
      email: env.SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('Super Admin account created successfully.');
};

createSuperAdmin().catch((error) => {
  console.error('Error creating Super Admin account:', error);
});