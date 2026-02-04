// Quick script to list users
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '@/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
    take: 10
  });

  console.log('\nUsers in database:');
  if (users.length === 0) {
    console.log('  (no users found)');
  } else {
    users.forEach(u => console.log(`  - ${u.email} ${u.name ? '(' + u.name + ')' : ''}`));
  }
  console.log('');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
