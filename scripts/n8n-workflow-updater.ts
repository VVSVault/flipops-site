#!/usr/bin/env tsx
/**
 * Robust n8n Workflow Updater
 * Handles various parameter formats and limitations
 */

import * as fs from 'fs';
import * as path from 'path';

const N8N_URL = 'https://primary-production-8b46.up.railway.app';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5ODI3NTA1LCJleHAiOjE3NjI0MDUyMDB9.hlcaGCrFW8ItKSdCvo2giGx4WIzSofPRc7xo7cSmyAo';

interface UpdateConfig {
  workflowId: string;
  updates: NodeUpdate[];
}

interface NodeUpdate {
  nodeName?: string;
  nodeType?: string;
  parameters: any;
}

class N8nWorkflowUpdater {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async updateWorkflow(config: UpdateConfig): Promise<boolean> {
    try {
      console.log(`📥 Fetching workflow ${config.workflowId}...`);

      // Get current workflow
      const workflow = await this.getWorkflow(config.workflowId);
      if (!workflow) return false;

      // Apply updates
      console.log('\n🔧 Applying updates...');
      for (const update of config.updates) {
        this.applyNodeUpdate(workflow, update);
      }

      // Save workflow
      console.log('\n💾 Saving workflow...');
      const saved = await this.saveWorkflow(config.workflowId, workflow);

      if (saved) {
        console.log('✅ Workflow updated successfully!');
        return true;
      } else {
        console.log('❌ Failed to save workflow');
        return false;
      }

    } catch (error: any) {
      console.error('Error:', error.message);
      return false;
    }
  }

  private async getWorkflow(workflowId: string): Promise<any> {
    const response = await fetch(`${this.apiUrl}/api/v1/workflows/${workflowId}`, {
      headers: { 'X-N8N-API-KEY': this.apiKey }
    });

    if (!response.ok) {
      throw new Error(`Failed to get workflow: ${response.statusText}`);
    }

    return response.json();
  }

  private applyNodeUpdate(workflow: any, update: NodeUpdate): void {
    // Find the node to update
    const node = workflow.nodes.find((n: any) => {
      if (update.nodeName) return n.name === update.nodeName;
      if (update.nodeType) return n.type === update.nodeType;
      return false;
    });

    if (!node) {
      console.log(`   ⚠️  Node not found: ${update.nodeName || update.nodeType}`);
      return;
    }

    console.log(`   📝 Updating node: ${node.name}`);

    // Smart parameter update - handles different formats
    if (update.parameters) {
      // Method 1: Try direct replacement
      node.parameters = this.convertParameters(update.parameters);
      console.log(`   ✅ Updated ${node.name}`);
    }
  }

  private convertParameters(params: any): any {
    // Handle different parameter formats
    const converted: any = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // For documentId and sheetName, try to preserve n8n format
        if (key === 'documentId' || key === 'sheetName') {
          // Try simple string first
          converted[key] = value;
        } else {
          converted[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively handle nested objects
        converted[key] = this.convertParameters(value);
      } else {
        converted[key] = value;
      }
    }

    return converted;
  }

  private async saveWorkflow(workflowId: string, workflow: any): Promise<boolean> {
    // First deactivate
    await fetch(`${this.apiUrl}/api/v1/workflows/${workflowId}/deactivate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': this.apiKey }
    });

    // Remove read-only fields
    const { id, createdAt, updatedAt, versionId, ...workflowData } = workflow;

    // Try to save
    const response = await fetch(`${this.apiUrl}/api/v1/workflows/${workflowId}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });

    // Reactivate
    await fetch(`${this.apiUrl}/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': this.apiKey }
    });

    return response.ok;
  }

  async setEnvironmentVariables(workflowId: string, envVars: Record<string, string>): Promise<void> {
    console.log('\n📌 Environment Variables Needed:');
    console.log('Since I cannot set env vars via API, add these to n8n:');
    console.log('\n1. Go to n8n Settings → Environment Variables');
    console.log('2. Add these variables:\n');

    for (const [key, value] of Object.entries(envVars)) {
      console.log(`   ${key} = ${value}`);
    }

    console.log('\nOR replace the expressions in the workflow nodes directly.');
  }

  async exportWorkflowForImport(workflowId: string, updates: NodeUpdate[]): Promise<void> {
    console.log('\n📤 Generating workflow JSON for manual import...');

    const workflow = await this.getWorkflow(workflowId);

    // Apply updates
    for (const update of updates) {
      this.applyNodeUpdate(workflow, update);
    }

    // Clean for export
    const { id, createdAt, updatedAt, versionId, ...exportData } = workflow;

    const exportPath = path.join(process.cwd(), 'n8n-workflow-fixed.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

    console.log('\n✅ Workflow JSON exported to: n8n-workflow-fixed.json');
    console.log('\nTo import:');
    console.log('1. Go to n8n');
    console.log('2. Click Workflows → Import from File');
    console.log('3. Upload n8n-workflow-fixed.json');
  }
}

// Example usage for your specific case
async function fixFlipOpsWorkflow() {
  const updater = new N8nWorkflowUpdater(N8N_URL, N8N_API_KEY);

  const config: UpdateConfig = {
    workflowId: 'qFVcWb9f6JmGZCFU',
    updates: [
      {
        nodeName: 'Get Properties from Sheet',
        parameters: {
          operation: 'read',
          resource: 'sheet',
          documentId: '1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY',
          sheetName: 'Properties',
          options: {
            returnAllColumns: true,
            dataLocationOnSheet: 'headerRow',
            firstDataRow: 2
          }
        }
      },
      {
        nodeName: 'Send to FlipOps',
        parameters: {
          url: 'http://192.168.1.192:3000/api/webhooks/sheets',
          method: 'POST',
          authentication: 'none',
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '={{ JSON.stringify($input.all()) }}'
        }
      }
    ]
  };

  console.log('🚀 n8n Workflow Updater');
  console.log('=======================\n');

  // Try automated update
  const success = await updater.updateWorkflow(config);

  if (!success) {
    console.log('\n⚠️  Automated update failed, trying alternative methods...');

    // Show what env vars would be needed
    await updater.setEnvironmentVariables(config.workflowId, {
      'GOOGLE_SHEET_ID': '1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY',
      'FO_API_BASE_URL': 'http://192.168.1.192:3000/api'
    });

    // Export for manual import
    await updater.exportWorkflowForImport(config.workflowId, config.updates);
  }
}

// Run if called directly
if (require.main === module) {
  fixFlipOpsWorkflow().catch(console.error);
}

export { N8nWorkflowUpdater, UpdateConfig, NodeUpdate };