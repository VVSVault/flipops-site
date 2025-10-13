#!/usr/bin/env tsx
const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';

async function check() {
  // Check all executions
  const allExec = await fetch(`${N8N_URL}/api/v1/executions?limit=10`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY }
  });
  
  const data = await allExec.json();
  console.log('All Recent Executions:');
  console.log('=====================');
  
  if (data.data && data.data.length > 0) {
    data.data.forEach((exec: any) => {
      const status = exec.finished ? 
        (exec.data?.resultData?.error ? '❌' : '✅') : '⏳';
      console.log(`${status} Workflow: ${exec.workflowData?.name || exec.workflowId}`);
      console.log(`   Time: ${new Date(exec.startedAt).toLocaleString()}`);
      if (exec.data?.resultData?.error) {
        console.log(`   Error: ${exec.data.resultData.error.message}`);
      }
    });
  } else {
    console.log('No executions found');
  }
}

check();
