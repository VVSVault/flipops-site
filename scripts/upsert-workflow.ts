#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface WorkflowJson {
  name: string;
  nodes: any[];
  connections: any;
  active?: boolean;
  settings?: any;
  tags?: any[];
  __activate?: boolean;
  id?: string;
}

interface N8nApiResponse {
  id: string;
  name: string;
  active: boolean;
  [key: string]: any;
}

/**
 * Upsert n8n workflows via REST API
 * Creates new workflows or updates existing ones by name
 */
class WorkflowUpserter {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'https://primary-production-8b46.up.railway.app/api/v1';
    this.apiKey = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';

    if (!this.apiKey) {
      throw new Error('N8N_API_KEY environment variable is required');
    }
  }

  /**
   * Fetch all existing workflows
   */
  private async getExistingWorkflows(): Promise<N8nApiResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching existing workflows:', error);
      return [];
    }
  }

  /**
   * Create a new workflow
   */
  private async createWorkflow(workflow: WorkflowJson): Promise<N8nApiResponse> {
    const { __activate, active, tags, ...workflowData } = workflow;

    // Ensure settings is an empty object if not provided
    if (!workflowData.settings) {
      workflowData.settings = {};
    }

    const response = await fetch(`${this.baseUrl}/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create workflow ${workflow.name}: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Update an existing workflow
   */
  private async updateWorkflow(id: string, workflow: WorkflowJson): Promise<N8nApiResponse> {
    const { __activate, active, tags, ...workflowData } = workflow;

    // Ensure settings is an empty object if not provided
    if (!workflowData.settings) {
      workflowData.settings = {};
    }

    const response = await fetch(`${this.baseUrl}/workflows/${id}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update workflow ${workflow.name}: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Activate a workflow
   */
  private async activateWorkflow(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/workflows/${id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok && response.status !== 200) {
      console.warn(`Warning: Could not activate workflow ${id}`);
    }
  }

  /**
   * Process a single workflow file
   */
  private async processWorkflow(filePath: string): Promise<void> {
    console.log(`Processing: ${path.basename(filePath)}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const workflow = JSON.parse(content) as WorkflowJson;

    const existingWorkflows = await this.getExistingWorkflows();
    const existing = existingWorkflows.find(w => w.name === workflow.name);

    let result: N8nApiResponse;

    if (existing) {
      console.log(`  → Updating existing workflow: ${workflow.name} (ID: ${existing.id})`);
      result = await this.updateWorkflow(existing.id, workflow);
    } else {
      console.log(`  → Creating new workflow: ${workflow.name}`);
      result = await this.createWorkflow(workflow);
    }

    // Activate if requested
    if (workflow.__activate === true || workflow.active === true) {
      console.log(`  → Activating workflow: ${result.id}`);
      await this.activateWorkflow(result.id);
    }

    console.log(`  ✓ Successfully processed: ${workflow.name} (ID: ${result.id})`);
  }

  /**
   * Process all workflow files in a directory
   */
  public async processDirectory(directory: string): Promise<void> {
    const pattern = path.join(directory, '**/*.json').replace(/\\/g, '/');
    console.log(`Looking for files matching: ${pattern}`);
    const files = await glob(pattern);

    if (files.length === 0) {
      console.log(`No workflow files found in: ${directory}`);
      return;
    }

    console.log(`Found ${files.length} workflow file(s) to process\n`);

    for (const file of files) {
      try {
        await this.processWorkflow(file);
      } catch (error) {
        console.error(`  ✗ Error processing ${path.basename(file)}:`, error);
      }
    }

    console.log('\nWorkflow upsert complete!');
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const directory = args[0] || 'workflows';

  console.log('=================================');
  console.log('n8n Workflow Upserter');
  console.log('=================================\n');
  console.log(`Base URL: ${process.env.N8N_BASE_URL || 'https://primary-production-8b46.up.railway.app/api/v1'}`);
  console.log(`Directory: ${directory}\n`);

  try {
    const upserter = new WorkflowUpserter();
    await upserter.processDirectory(directory);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { WorkflowUpserter };