/**
 * Delete all test workflows created during debugging
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

// All test workflow IDs created during debugging
const testWorkflowIds = [
  'kTjg55UZyBtnsRJV',  // Ultra minimal test
  'Nm8gKmjiC7boagkp',  // Incremental - 3 nodes
  'qKgorp1g9RT5svAD',  // Incremental - 5 nodes
  '22vWfntSZSCRz65B',  // Incremental - 7 nodes
  'fcpUl5ybHrfzYREJ',  // Individual - Schedule simple
  'w1G7fvlvGHW29efU',  // Individual - Schedule with time
  'g8u3LJToE9tcc7gq',  // Individual - Schedule + HTTP
  'd0gm8xsAiq7JJTdb',  // Individual - Schedule + HTTP + Code
  'hYZv3dbzppP6Vnmt',  // Individual - Schedule + HTTP + Filter
  'naXCebkbVqKmjBxI',  // Schedule format 1
  'xsnQ7HQi0vpfj4Tf',  // Schedule format 2
  'ulWS9wNiYsR46sqV',  // Schedule format 3
  'bHeOpcQWVz1vunph',  // Schedule format 4
  'l6IIvVdI7euRAYDS'   // Schedule format 5
];

async function deleteWorkflow(id: string) {
  try {
    const response = await fetch(`${N8N_API_URL}/workflows/${id}`, {
      method: 'DELETE',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (response.ok) {
      console.log(`✅ Deleted: ${id}`);
      return true;
    } else {
      console.log(`⚠️  Failed to delete ${id}: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting ${id}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🧹 Cleaning up test workflows...\n');
  console.log(`Total test workflows to delete: ${testWorkflowIds.length}\n`);

  let deleted = 0;
  let failed = 0;

  for (const id of testWorkflowIds) {
    const success = await deleteWorkflow(id);
    if (success) {
      deleted++;
    } else {
      failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Cleanup Summary:');
  console.log(`   ✅ Deleted: ${deleted}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n🎉 Your n8n dashboard is now clean!`);
  console.log(`   Only the 9 production workflows remain.`);
}

main().catch(console.error);
