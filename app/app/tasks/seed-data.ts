// Comprehensive seed data for the tasks section

export interface Task {
  id: string;
  leadId?: string;
  dealId?: string;
  title: string;
  description?: string;
  type: 'call' | 'follow-up' | 'inspection' | 'underwriting' | 'dispo' | 'document' | 'generic';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'open' | 'in-progress' | 'completed' | 'blocked' | 'overdue';
  assigneeId: string;
  assigneeName: string;
  assigneeRole: 'acquisitions' | 'dispo' | 'underwriting' | 'va' | 'manager';
  dueAt: string;
  completedAt?: string;
  slaMinutes?: number;
  slaDueAt?: string;
  slaStatus?: 'on-track' | 'at-risk' | 'violated';
  linkedEntity?: {
    type: 'lead' | 'deal';
    id: string;
    name: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface TaskSubtask {
  id: string;
  taskId: string;
  title: string;
  status: 'open' | 'completed';
  completedAt?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: Task['type'];
  defaultPriority: Task['priority'];
  defaultAssigneeRole: Task['assigneeRole'];
  recurrenceRule?: string; // RFC5545 iCal string
  relativeOffsetHours: number;
  slaMinutes: number;
  subtasks?: string[];
  tags?: string[];
}

export interface TaskActivity {
  id: string;
  taskId: string;
  type: 'created' | 'updated' | 'assigned' | 'completed' | 'commented' | 'sla-violation';
  userId: string;
  userName: string;
  description: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

// Helper to calculate relative dates
const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const hoursFromNow = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => hoursAgo(days * 24);
const daysFromNow = (days: number) => hoursFromNow(days * 24);

export const tasksSeedData = {
  tasks: [
    // Urgent/Overdue Tasks
    {
      id: "TASK-001",
      leadId: "LEAD-001",
      title: "Follow up with seller - 123 Oak St",
      description: "Seller expressed interest in our cash offer. Need to discuss timeline and move forward.",
      type: "follow-up" as const,
      priority: "urgent" as const,
      status: "overdue" as const,
      assigneeId: "USER-001",
      assigneeName: "John Smith",
      assigneeRole: "acquisitions" as const,
      dueAt: hoursAgo(2),
      slaMinutes: 120,
      slaDueAt: hoursAgo(2),
      slaStatus: "violated" as const,
      linkedEntity: {
        type: "lead" as const,
        id: "LEAD-001",
        name: "Sarah Johnson",
        address: "123 Oak St, Phoenix, AZ"
      },
      createdAt: hoursAgo(6),
      updatedAt: hoursAgo(1),
      tags: ["hot-lead", "cash-buyer"]
    },
    {
      id: "TASK-002",
      dealId: "DEAL-001",
      title: "Schedule property inspection",
      description: "Need to schedule inspection before making final offer",
      type: "inspection" as const,
      priority: "high" as const,
      status: "in-progress" as const,
      assigneeId: "USER-002",
      assigneeName: "Mike Johnson",
      assigneeRole: "acquisitions" as const,
      dueAt: hoursFromNow(4),
      slaMinutes: 240,
      slaDueAt: hoursFromNow(2),
      slaStatus: "at-risk" as const,
      linkedEntity: {
        type: "deal" as const,
        id: "DEAL-001",
        name: "456 Pine Ave Deal",
        address: "456 Pine Ave, Phoenix, AZ"
      },
      createdAt: daysAgo(1),
      updatedAt: hoursAgo(3),
      tags: ["inspection-needed"]
    },
    {
      id: "TASK-003",
      dealId: "DEAL-002",
      title: "Review comps and finalize ARV",
      description: "Need manager approval on ARV before submitting offer",
      type: "underwriting" as const,
      priority: "high" as const,
      status: "open" as const,
      assigneeId: "USER-003",
      assigneeName: "Sarah Williams",
      assigneeRole: "underwriting" as const,
      dueAt: hoursFromNow(6),
      slaMinutes: 480,
      slaDueAt: hoursFromNow(6),
      slaStatus: "on-track" as const,
      linkedEntity: {
        type: "deal" as const,
        id: "DEAL-002",
        name: "789 Elm St Deal",
        address: "789 Elm St, Scottsdale, AZ"
      },
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
      tags: ["needs-approval"]
    },
    {
      id: "TASK-004",
      leadId: "LEAD-002",
      title: "Call back interested seller",
      description: "Seller left voicemail interested in cash offer",
      type: "call" as const,
      priority: "urgent" as const,
      status: "open" as const,
      assigneeId: "USER-001",
      assigneeName: "John Smith",
      assigneeRole: "acquisitions" as const,
      dueAt: hoursFromNow(1),
      slaMinutes: 60,
      slaDueAt: hoursFromNow(1),
      slaStatus: "at-risk" as const,
      linkedEntity: {
        type: "lead" as const,
        id: "LEAD-002",
        name: "Robert Brown",
        address: "321 Maple Dr, Phoenix, AZ"
      },
      createdAt: hoursAgo(0.5),
      updatedAt: hoursAgo(0.5),
      tags: ["inbound", "hot-lead"]
    },
    {
      id: "TASK-005",
      dealId: "DEAL-003",
      title: "Send deal to buyer list",
      description: "Property ready for disposition - send to matched buyers",
      type: "dispo" as const,
      priority: "high" as const,
      status: "open" as const,
      assigneeId: "USER-004",
      assigneeName: "Lisa Davis",
      assigneeRole: "dispo" as const,
      dueAt: hoursFromNow(3),
      slaMinutes: 180,
      slaDueAt: hoursFromNow(3),
      slaStatus: "on-track" as const,
      linkedEntity: {
        type: "deal" as const,
        id: "DEAL-003",
        name: "234 Cedar Ln Deal",
        address: "234 Cedar Ln, Mesa, AZ"
      },
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
      tags: ["ready-to-assign"]
    },
    {
      id: "TASK-006",
      dealId: "DEAL-004",
      title: "Upload signed purchase agreement",
      description: "Get PA signed and uploaded to deal folder",
      type: "document" as const,
      priority: "high" as const,
      status: "in-progress" as const,
      assigneeId: "USER-005",
      assigneeName: "Emma Wilson",
      assigneeRole: "va" as const,
      dueAt: hoursFromNow(2),
      slaMinutes: 240,
      slaDueAt: hoursFromNow(4),
      slaStatus: "on-track" as const,
      linkedEntity: {
        type: "deal" as const,
        id: "DEAL-004",
        name: "567 Birch Ave Deal",
        address: "567 Birch Ave, Chandler, AZ"
      },
      createdAt: daysAgo(1),
      updatedAt: hoursAgo(4),
      tags: ["contract"]
    },
    {
      id: "TASK-007",
      title: "Weekly team meeting",
      description: "Review pipeline and discuss strategy",
      type: "generic" as const,
      priority: "normal" as const,
      status: "open" as const,
      assigneeId: "USER-006",
      assigneeName: "Tom Anderson",
      assigneeRole: "manager" as const,
      dueAt: daysFromNow(2),
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
      tags: ["recurring", "meeting"]
    },
    {
      id: "TASK-008",
      leadId: "LEAD-003",
      title: "Send follow-up email - motivated seller",
      description: "Follow up on initial conversation about property condition",
      type: "follow-up" as const,
      priority: "normal" as const,
      status: "completed" as const,
      assigneeId: "USER-002",
      assigneeName: "Mike Johnson",
      assigneeRole: "acquisitions" as const,
      dueAt: hoursAgo(5),
      completedAt: hoursAgo(6),
      slaMinutes: 240,
      slaDueAt: hoursAgo(2),
      slaStatus: "on-track" as const,
      linkedEntity: {
        type: "lead" as const,
        id: "LEAD-003",
        name: "Jennifer White",
        address: "890 Spruce St, Gilbert, AZ"
      },
      createdAt: daysAgo(2),
      updatedAt: hoursAgo(6),
      tags: ["email"]
    },
    {
      id: "TASK-009",
      dealId: "DEAL-005",
      title: "Negotiate with buyer on assignment fee",
      description: "Buyer wants to reduce assignment fee by $5k",
      type: "dispo" as const,
      priority: "urgent" as const,
      status: "in-progress" as const,
      assigneeId: "USER-004",
      assigneeName: "Lisa Davis",
      assigneeRole: "dispo" as const,
      dueAt: hoursFromNow(2),
      slaMinutes: 120,
      slaDueAt: hoursFromNow(2),
      slaStatus: "on-track" as const,
      linkedEntity: {
        type: "deal" as const,
        id: "DEAL-005",
        name: "345 Willow Dr Deal",
        address: "345 Willow Dr, Tempe, AZ"
      },
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(1),
      tags: ["negotiation"]
    },
    {
      id: "TASK-010",
      leadId: "LEAD-004",
      title: "Run comps for new lead",
      description: "Pull comps and determine initial MAO",
      type: "underwriting" as const,
      priority: "normal" as const,
      status: "open" as const,
      assigneeId: "USER-003",
      assigneeName: "Sarah Williams",
      assigneeRole: "underwriting" as const,
      dueAt: hoursFromNow(8),
      slaMinutes: 480,
      slaDueAt: hoursFromNow(8),
      slaStatus: "on-track" as const,
      linkedEntity: {
        type: "lead" as const,
        id: "LEAD-004",
        name: "David Martinez",
        address: "678 Ash Ct, Phoenix, AZ"
      },
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
      tags: ["analysis"]
    },
    // More tasks for realistic view
    {
      id: "TASK-011",
      title: "Update CRM with new leads",
      type: "generic" as const,
      priority: "low" as const,
      status: "open" as const,
      assigneeId: "USER-005",
      assigneeName: "Emma Wilson",
      assigneeRole: "va" as const,
      dueAt: daysFromNow(1),
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(4),
      tags: ["admin"]
    },
    {
      id: "TASK-012",
      dealId: "DEAL-006",
      title: "Order title report",
      type: "document" as const,
      priority: "normal" as const,
      status: "blocked" as const,
      assigneeId: "USER-005",
      assigneeName: "Emma Wilson",
      assigneeRole: "va" as const,
      dueAt: daysFromNow(3),
      linkedEntity: {
        type: "deal" as const,
        id: "DEAL-006",
        name: "432 Oak Ridge Deal",
        address: "432 Oak Ridge, Phoenix, AZ"
      },
      createdAt: daysAgo(1),
      updatedAt: hoursAgo(2),
      tags: ["title", "blocked"]
    }
  ] as Task[],

  subtasks: [
    {
      id: "SUBTASK-001",
      taskId: "TASK-002",
      title: "Contact inspector",
      status: "completed" as const,
      completedAt: hoursAgo(2)
    },
    {
      id: "SUBTASK-002",
      taskId: "TASK-002",
      title: "Confirm inspection time with seller",
      status: "open" as const
    },
    {
      id: "SUBTASK-003",
      taskId: "TASK-002",
      title: "Send calendar invite to team",
      status: "open" as const
    },
    {
      id: "SUBTASK-004",
      taskId: "TASK-006",
      title: "Review contract terms",
      status: "completed" as const,
      completedAt: hoursAgo(5)
    },
    {
      id: "SUBTASK-005",
      taskId: "TASK-006",
      title: "Get seller signature",
      status: "open" as const
    },
    {
      id: "SUBTASK-006",
      taskId: "TASK-006",
      title: "Upload to Google Drive",
      status: "open" as const
    }
  ] as TaskSubtask[],

  templates: [
    {
      id: "TEMPLATE-001",
      name: "Follow up on hot lead",
      description: "Immediate follow-up for interested sellers",
      type: "follow-up" as const,
      defaultPriority: "urgent" as const,
      defaultAssigneeRole: "acquisitions" as const,
      relativeOffsetHours: 2,
      slaMinutes: 120,
      subtasks: ["Initial call", "Send offer", "Schedule appointment"],
      tags: ["hot-lead", "follow-up"]
    },
    {
      id: "TEMPLATE-002",
      name: "New deal underwriting",
      description: "Complete underwriting analysis for new deal",
      type: "underwriting" as const,
      defaultPriority: "high" as const,
      defaultAssigneeRole: "underwriting" as const,
      relativeOffsetHours: 24,
      slaMinutes: 1440,
      subtasks: ["Pull comps", "Calculate ARV", "Determine MAO", "Get manager approval"],
      tags: ["analysis", "underwriting"]
    },
    {
      id: "TEMPLATE-003",
      name: "Property inspection",
      description: "Schedule and complete property inspection",
      type: "inspection" as const,
      defaultPriority: "high" as const,
      defaultAssigneeRole: "acquisitions" as const,
      relativeOffsetHours: 48,
      slaMinutes: 2880,
      subtasks: ["Schedule with inspector", "Confirm with seller", "Attend inspection", "Review report"],
      tags: ["inspection"]
    },
    {
      id: "TEMPLATE-004",
      name: "Disposition blast",
      description: "Send property to buyer list",
      type: "dispo" as const,
      defaultPriority: "high" as const,
      defaultAssigneeRole: "dispo" as const,
      relativeOffsetHours: 4,
      slaMinutes: 240,
      subtasks: ["Create property packet", "Match buyers", "Send blast", "Track responses"],
      tags: ["dispo", "marketing"]
    },
    {
      id: "TEMPLATE-005",
      name: "Weekly follow-up",
      description: "Weekly check-in with leads",
      type: "follow-up" as const,
      defaultPriority: "normal" as const,
      defaultAssigneeRole: "acquisitions" as const,
      recurrenceRule: "FREQ=WEEKLY;BYDAY=MO",
      relativeOffsetHours: 168,
      slaMinutes: 10080,
      tags: ["recurring", "follow-up"]
    },
    {
      id: "TEMPLATE-006",
      name: "Contract to close",
      description: "Manage contract to closing process",
      type: "document" as const,
      defaultPriority: "high" as const,
      defaultAssigneeRole: "va" as const,
      relativeOffsetHours: 72,
      slaMinutes: 4320,
      subtasks: [
        "Order title report",
        "Schedule closing",
        "Coordinate with buyer",
        "Final walkthrough",
        "Attend closing"
      ],
      tags: ["closing", "contract"]
    }
  ] as TaskTemplate[],

  activities: [
    {
      id: "ACTIVITY-001",
      taskId: "TASK-001",
      type: "sla-violation" as const,
      userId: "SYSTEM",
      userName: "System",
      description: "Task exceeded SLA deadline",
      createdAt: hoursAgo(2)
    },
    {
      id: "ACTIVITY-002",
      taskId: "TASK-002",
      type: "updated" as const,
      userId: "USER-002",
      userName: "Mike Johnson",
      description: "Changed status to in-progress",
      createdAt: hoursAgo(3)
    },
    {
      id: "ACTIVITY-003",
      taskId: "TASK-002",
      type: "commented" as const,
      userId: "USER-002",
      userName: "Mike Johnson",
      description: "Added a comment",
      createdAt: hoursAgo(2)
    },
    {
      id: "ACTIVITY-004",
      taskId: "TASK-008",
      type: "completed" as const,
      userId: "USER-002",
      userName: "Mike Johnson",
      description: "Marked task as completed",
      createdAt: hoursAgo(6)
    },
    {
      id: "ACTIVITY-005",
      taskId: "TASK-009",
      type: "assigned" as const,
      userId: "USER-006",
      userName: "Tom Anderson",
      description: "Assigned to Lisa Davis",
      createdAt: hoursAgo(3)
    }
  ] as TaskActivity[],

  comments: [
    {
      id: "COMMENT-001",
      taskId: "TASK-001",
      userId: "USER-001",
      userName: "John Smith",
      content: "Seller is very motivated, mentioned needing to sell quickly due to job relocation",
      createdAt: hoursAgo(4)
    },
    {
      id: "COMMENT-002",
      taskId: "TASK-002",
      userId: "USER-002",
      userName: "Mike Johnson",
      content: "Inspector available Tuesday at 2pm or Thursday at 10am",
      createdAt: hoursAgo(2)
    },
    {
      id: "COMMENT-003",
      taskId: "TASK-009",
      userId: "USER-004",
      userName: "Lisa Davis",
      content: "Buyer is firm on $15k assignment fee, originally we asked for $20k",
      createdAt: hoursAgo(1)
    },
    {
      id: "COMMENT-004",
      taskId: "TASK-009",
      userId: "USER-006",
      userName: "Tom Anderson",
      content: "Let's meet in the middle at $17.5k if they can close in 7 days",
      createdAt: hoursAgo(0.5)
    }
  ] as TaskComment[],

  // Analytics data
  analytics: {
    slaCompliance: {
      overall: 78,
      byRole: {
        acquisitions: 72,
        underwriting: 85,
        dispo: 80,
        va: 82,
        manager: 90
      }
    },
    avgCompletionTime: {
      overall: 4.2, // hours
      byType: {
        call: 0.5,
        'follow-up': 2.1,
        inspection: 24,
        underwriting: 6.5,
        dispo: 3.8,
        document: 4.0,
        generic: 8.2
      }
    },
    taskLoad: {
      'USER-001': 12,
      'USER-002': 8,
      'USER-003': 10,
      'USER-004': 7,
      'USER-005': 15,
      'USER-006': 5
    },
    overdueTrend: [
      { date: daysAgo(7), count: 3 },
      { date: daysAgo(6), count: 4 },
      { date: daysAgo(5), count: 2 },
      { date: daysAgo(4), count: 5 },
      { date: daysAgo(3), count: 3 },
      { date: daysAgo(2), count: 4 },
      { date: daysAgo(1), count: 6 },
      { date: now.toISOString(), count: 4 }
    ],
    triggerBreakdown: {
      manual: 45,
      inbox: 20,
      campaign: 15,
      underwriting: 10,
      dispo: 10
    }
  }
};

// Helper function to generate more tasks for demo
export function generateAdditionalTasks(count: number): Task[] {
  const tasks: Task[] = [];
  const types: Task['type'][] = ['call', 'follow-up', 'inspection', 'underwriting', 'dispo', 'document', 'generic'];
  const priorities: Task['priority'][] = ['urgent', 'high', 'normal', 'low'];
  const statuses: Task['status'][] = ['open', 'in-progress', 'completed', 'blocked', 'overdue'];
  const roles: Task['assigneeRole'][] = ['acquisitions', 'dispo', 'underwriting', 'va', 'manager'];
  
  const users = [
    { id: 'USER-001', name: 'John Smith', role: 'acquisitions' },
    { id: 'USER-002', name: 'Mike Johnson', role: 'acquisitions' },
    { id: 'USER-003', name: 'Sarah Williams', role: 'underwriting' },
    { id: 'USER-004', name: 'Lisa Davis', role: 'dispo' },
    { id: 'USER-005', name: 'Emma Wilson', role: 'va' },
    { id: 'USER-006', name: 'Tom Anderson', role: 'manager' }
  ];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const dueOffset = Math.floor(Math.random() * 168) - 24; // -24 to +144 hours
    
    tasks.push({
      id: `TASK-GEN-${i + 1}`,
      title: `Generated task ${i + 1}`,
      type,
      priority,
      status,
      assigneeId: user.id,
      assigneeName: user.name,
      assigneeRole: user.role as Task['assigneeRole'],
      dueAt: hoursFromNow(dueOffset),
      createdAt: daysAgo(Math.floor(Math.random() * 30)),
      updatedAt: hoursAgo(Math.floor(Math.random() * 48)),
      tags: []
    });
  }
  
  return tasks;
}