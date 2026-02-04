import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function update() {
  const result = await prisma.user.update({
    where: { email: 'tanner@claritydigital.dev' },
    data: { clerkId: 'user_38n7OyDOzQ5Yh82Zxw3pvDU8E8R' }
  });
  console.log('Updated user clerkId:', result.email, '->', result.clerkId);
  await prisma.$disconnect();
}

update();
