// Comprehensive seed data for campaigns demonstration
// This includes realistic REI campaign scenarios with actual metrics

export interface CampaignStep {
  id: string;
  index: number;
  channel: "sms" | "email" | "voicemail" | "letter";
  delayDays: number;
  subject?: string;
  template: string;
  abTest: boolean;
  variants?: {
    id: string;
    variant: "A" | "B" | "C";
    allocation: number;
    subject?: string;
    template: string;
  }[];
  conditions: {
    stopOnReply: boolean;
    stopOnPositive: boolean;
    branchOnSentiment: boolean;
  };
}

export interface CampaignDelivery {
  id: string;
  campaignId: string;
  leadId: string;
  leadName: string;
  property: string;
  stepIndex: number;
  channel: string;
  status: "queued" | "sent" | "delivered" | "bounced" | "replied" | "failed";
  sentiment?: "positive" | "neutral" | "negative";
  sentAt: Date;
  deliveredAt?: Date;
  repliedAt?: Date;
  cost: number;
  variant?: "A" | "B" | "C";
  replyMessage?: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  category: string;
  channel: "sms" | "email" | "voicemail" | "letter";
  subject?: string;
  body: string;
  variables: string[];
  performance?: {
    timesUsed: number;
    avgReplyRate: number;
    avgPositiveRate: number;
  };
}

// Campaign Templates Library
export const campaignTemplates: CampaignTemplate[] = [
  // SMS Templates
  {
    id: "sms-probate-initial",
    name: "Probate Initial Outreach",
    category: "Probate",
    channel: "sms",
    body: "Hi {{firstName}}, I'm {{agentName}} with {{company}}. I noticed the property at {{address}} is in probate. I can help make this process easier with a quick, cash sale. No repairs needed. Would you like to learn more? Reply STOP to opt out.",
    variables: ["firstName", "agentName", "company", "address"],
    performance: {
      timesUsed: 342,
      avgReplyRate: 12.3,
      avgPositiveRate: 5.8
    }
  },
  {
    id: "sms-tax-urgent",
    name: "Tax Delinquent Urgent",
    category: "Tax Delinquent",
    channel: "sms",
    body: "{{firstName}}, regarding {{address}} - The tax deadline is approaching. I can purchase your property for cash and clear all liens within 7 days. Interested in your options? Reply STOP to opt out.",
    variables: ["firstName", "address"],
    performance: {
      timesUsed: 256,
      avgReplyRate: 15.2,
      avgPositiveRate: 7.1
    }
  },
  {
    id: "sms-code-violation",
    name: "Code Violation Solution",
    category: "Code Violations",
    channel: "sms",
    body: "Hi {{firstName}}, I saw {{address}} has {{violationCount}} code violations. We buy as-is and handle all repairs/permits. Want a hassle-free cash offer? Reply STOP to opt out.",
    variables: ["firstName", "address", "violationCount"],
    performance: {
      timesUsed: 189,
      avgReplyRate: 11.5,
      avgPositiveRate: 6.2
    }
  },
  {
    id: "sms-preforeclosure",
    name: "Pre-foreclosure Help",
    category: "Pre-foreclosure",
    channel: "sms",
    body: "{{firstName}}, I can help stop the foreclosure on {{address}}. Cash offer, close in 7 days, all fees covered. Time is critical - can we talk today? Reply STOP to opt out.",
    variables: ["firstName", "address"],
    performance: {
      timesUsed: 423,
      avgReplyRate: 18.7,
      avgPositiveRate: 9.3
    }
  },
  {
    id: "sms-absentee",
    name: "Tired Landlord",
    category: "Absentee Owner",
    channel: "sms",
    body: "{{firstName}}, tired of managing {{address}} from {{distance}} miles away? I'll buy it as-is for cash. No more tenant headaches. Interested? Reply STOP to opt out.",
    variables: ["firstName", "address", "distance"],
    performance: {
      timesUsed: 298,
      avgReplyRate: 9.8,
      avgPositiveRate: 4.5
    }
  },
  
  // Email Templates
  {
    id: "email-probate-initial",
    name: "Probate Initial Email",
    category: "Probate",
    channel: "email",
    subject: "Assistance with Estate Property at {{address}}",
    body: `Dear {{firstName}},

I understand you're handling the estate for the property at {{address}}, and I know this can be a challenging time.

I'm a local real estate investor who specializes in helping families through this process. I can offer:

• **Quick Cash Sale** - Close in as little as 7-14 days
• **As-Is Purchase** - No repairs or cleaning needed
• **Fair Market Offer** - Based on current conditions
• **Flexible Timeline** - Work around your schedule
• **Handle All Details** - Including any liens or back taxes

Many families find that a quick sale helps simplify the estate settlement process and allows them to move forward.

Would you be open to a brief conversation about your options? I'm happy to provide information with absolutely no obligation.

Best regards,
{{agentName}}
{{company}}
{{phone}}

P.S. If you're not ready to sell, I can still provide free resources about the probate process that might be helpful.`,
    variables: ["firstName", "address", "agentName", "company", "phone"],
    performance: {
      timesUsed: 234,
      avgReplyRate: 8.2,
      avgPositiveRate: 3.8
    }
  },
  {
    id: "email-tax-delinquent",
    name: "Tax Relief Options",
    category: "Tax Delinquent",
    channel: "email",
    subject: "Time-Sensitive: Tax Relief for {{address}}",
    body: `Dear {{firstName}},

According to public records, the property at {{address}} has delinquent taxes with an upcoming deadline.

I wanted to reach out because I may be able to help. As a local real estate investor, I can:

✓ **Pay Off All Tax Liens** - Immediately upon purchase
✓ **Provide Cash Offer** - No financing contingencies
✓ **Close Quickly** - Before any tax sale or foreclosure
✓ **Cover All Costs** - Including closing and legal fees

**Your Options:**
1. **Sell Now** - Get cash and walk away debt-free
2. **Subject-To Deal** - I take over payments while you rebuild
3. **Lease-Back** - Sell but continue living there as a tenant

The tax sale date is approaching fast. Let's discuss your options before it's too late.

**Next Steps:**
Reply to this email or call me directly at {{phone}}.

Time is critical - I'm ready to move quickly to help resolve this situation.

{{agentName}}
{{company}}`,
    variables: ["firstName", "address", "taxAmount", "deadline", "phone", "agentName", "company"],
    performance: {
      timesUsed: 187,
      avgReplyRate: 11.3,
      avgPositiveRate: 5.9
    }
  },
  
  // Voicemail Scripts
  {
    id: "vm-probate",
    name: "Probate Voicemail",
    category: "Probate",
    channel: "voicemail",
    body: "Hi {{firstName}}, this is {{agentName}} with {{company}}. I'm calling about the property at {{address}}. I work with families going through probate and can help make the process easier with a quick cash sale. No repairs needed, and I can work with your timeline. Please call me back at {{phone}} when you have a moment. Thank you.",
    variables: ["firstName", "agentName", "company", "address", "phone"],
    performance: {
      timesUsed: 156,
      avgReplyRate: 4.2,
      avgPositiveRate: 2.1
    }
  }
];

// Detailed Campaign Scenarios with Steps
export const campaignScenarios = {
  probate: {
    name: "Probate Leads - Q1 2025",
    description: "Gentle outreach to families dealing with inherited properties",
    steps: [
      {
        id: "step-1",
        index: 0,
        channel: "sms" as const,
        delayDays: 0,
        template: campaignTemplates[0].body,
        abTest: true,
        variants: [
          {
            id: "var-a",
            variant: "A" as const,
            allocation: 50,
            template: campaignTemplates[0].body
          },
          {
            id: "var-b",
            variant: "B" as const,
            allocation: 50,
            template: "{{firstName}}, I help families with inherited properties at {{address}}. Quick cash sale, no repairs needed, flexible timeline. Can I share how this works? Reply STOP to opt out."
          }
        ],
        conditions: {
          stopOnReply: true,
          stopOnPositive: false,
          branchOnSentiment: false
        }
      },
      {
        id: "step-2",
        index: 1,
        channel: "email" as const,
        delayDays: 3,
        subject: campaignTemplates[5].subject,
        template: campaignTemplates[5].body,
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: false,
          branchOnSentiment: false
        }
      },
      {
        id: "step-3",
        index: 2,
        channel: "sms" as const,
        delayDays: 7,
        template: "Hi {{firstName}}, following up on {{address}}. I know this is a difficult time. If you'd like to discuss your options with no pressure, I'm here to help. Reply STOP to opt out.",
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: false,
          branchOnSentiment: false
        }
      },
      {
        id: "step-4",
        index: 3,
        channel: "voicemail" as const,
        delayDays: 14,
        template: campaignTemplates[7].body,
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: true,
          branchOnSentiment: false
        }
      },
      {
        id: "step-5",
        index: 4,
        channel: "letter" as const,
        delayDays: 21,
        template: "Formal letter with offer details and success stories from other families",
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: true,
          branchOnSentiment: false
        }
      }
    ]
  },
  
  taxDelinquent: {
    name: "Tax Delinquent - Urgent Response",
    description: "Time-sensitive outreach for properties with tax issues",
    steps: [
      {
        id: "step-1",
        index: 0,
        channel: "sms" as const,
        delayDays: 0,
        template: campaignTemplates[1].body,
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: false,
          branchOnSentiment: true
        }
      },
      {
        id: "step-2",
        index: 1,
        channel: "email" as const,
        delayDays: 1,
        subject: campaignTemplates[6].subject,
        template: campaignTemplates[6].body,
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: false,
          branchOnSentiment: false
        }
      },
      {
        id: "step-3",
        index: 2,
        channel: "sms" as const,
        delayDays: 3,
        template: "{{firstName}}, the tax sale for {{address}} is in {{daysLeft}} days. I have cash ready to help. This is time-critical. Can we talk today? Reply STOP to opt out.",
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: true,
          branchOnSentiment: false
        }
      },
      {
        id: "step-4",
        index: 3,
        channel: "voicemail" as const,
        delayDays: 5,
        template: "Urgent voicemail about tax deadline and available solutions",
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: true,
          branchOnSentiment: false
        }
      }
    ]
  },
  
  codeViolations: {
    name: "Code Violations - Problem Solver",
    description: "Target properties with multiple code violations",
    steps: [
      {
        id: "step-1",
        index: 0,
        channel: "sms" as const,
        delayDays: 0,
        template: campaignTemplates[2].body,
        abTest: true,
        variants: [
          {
            id: "var-a",
            variant: "A" as const,
            allocation: 33,
            template: campaignTemplates[2].body
          },
          {
            id: "var-b",
            variant: "B" as const,
            allocation: 33,
            template: "{{firstName}}, dealing with code violations at {{address}}? I'll buy it as-is, handle everything with the city. Cash offer, quick close. Interested? Reply STOP to opt out."
          },
          {
            id: "var-c",
            variant: "C" as const,
            allocation: 34,
            template: "Code violations piling up at {{address}}? Skip the repairs - I'll buy as-is for cash and handle it all. Let's talk solutions. Reply STOP to opt out."
          }
        ],
        conditions: {
          stopOnReply: true,
          stopOnPositive: false,
          branchOnSentiment: false
        }
      },
      {
        id: "step-2",
        index: 1,
        channel: "email" as const,
        delayDays: 2,
        subject: "No Repairs Needed - Cash Offer for {{address}}",
        template: "Detailed email about buying properties with code violations",
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: false,
          branchOnSentiment: false
        }
      },
      {
        id: "step-3",
        index: 2,
        channel: "sms" as const,
        delayDays: 5,
        template: "{{firstName}}, those violations at {{address}} can get expensive fast. I have contractors ready and can close quickly. Want to discuss? Reply STOP to opt out.",
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: true,
          branchOnSentiment: false
        }
      }
    ]
  },
  
  absenteeOwner: {
    name: "Tired Landlords - Remote Property",
    description: "Out-of-state owners and tired landlords",
    steps: [
      {
        id: "step-1",
        index: 0,
        channel: "sms" as const,
        delayDays: 0,
        template: campaignTemplates[4].body,
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: false,
          branchOnSentiment: false
        }
      },
      {
        id: "step-2",
        index: 1,
        channel: "email" as const,
        delayDays: 3,
        subject: "End the Hassle of Long-Distance Property Management",
        template: "Comprehensive email about benefits of selling rental property",
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: false,
          branchOnSentiment: false
        }
      },
      {
        id: "step-3",
        index: 2,
        channel: "sms" as const,
        delayDays: 7,
        template: "{{firstName}}, imagine no more 3am tenant calls for {{address}}. Cash offer, close on your timeline. Let's discuss your exit strategy. Reply STOP to opt out.",
        abTest: false,
        conditions: {
          stopOnReply: true,
          stopOnPositive: true,
          branchOnSentiment: false
        }
      }
    ]
  },
  
  buyerBlast: {
    name: "Buyer List - Hot Deals",
    description: "Market deals to cash buyer list",
    steps: [
      {
        id: "step-1",
        index: 0,
        channel: "sms" as const,
        delayDays: 0,
        template: "🔥 NEW DEAL: {{address}} | {{beds}}bd/{{baths}}ba | ARV ${{arv}} | Ask ${{price}} | Repairs ~${{repairs}} | Reply INFO for details",
        abTest: false,
        conditions: {
          stopOnReply: false,
          stopOnPositive: false,
          branchOnSentiment: false
        }
      },
      {
        id: "step-2",
        index: 1,
        channel: "email" as const,
        delayDays: 0,
        subject: "🏠 New Investment Opportunity: {{address}} - {{roi}}% ROI",
        template: "Detailed property packet with photos, repair estimates, and ARV analysis",
        abTest: false,
        conditions: {
          stopOnReply: false,
          stopOnPositive: false,
          branchOnSentiment: false
        }
      }
    ]
  }
};

// Generate realistic delivery data
export function generateDeliveries(campaignId: string, audienceSize: number, scenario: string): CampaignDelivery[] {
  const deliveries: CampaignDelivery[] = [];
  const steps = campaignScenarios[scenario as keyof typeof campaignScenarios]?.steps || [];
  
  // Realistic funnel drop-off rates
  const dropOffRates = {
    probate: [1.0, 0.85, 0.72, 0.61, 0.53],
    taxDelinquent: [1.0, 0.88, 0.74, 0.65],
    codeViolations: [1.0, 0.82, 0.68],
    absenteeOwner: [1.0, 0.79, 0.65],
    buyerBlast: [1.0, 0.95]
  };
  
  const replyRates = {
    probate: [0.08, 0.06, 0.04, 0.03, 0.02],
    taxDelinquent: [0.15, 0.11, 0.08, 0.05],
    codeViolations: [0.12, 0.08, 0.05],
    absenteeOwner: [0.09, 0.07, 0.04],
    buyerBlast: [0.22, 0.15]
  };
  
  const positiveRates = {
    probate: 0.45,
    taxDelinquent: 0.48,
    codeViolations: 0.42,
    absenteeOwner: 0.38,
    buyerBlast: 0.65
  };
  
  const costPerChannel = {
    sms: 0.015,
    email: 0.001,
    voicemail: 0.10,
    letter: 1.50
  };
  
  const scenarioRates = dropOffRates[scenario as keyof typeof dropOffRates] || [1.0];
  const scenarioReplyRates = replyRates[scenario as keyof typeof replyRates] || [0.1];
  const positiveRate = positiveRates[scenario as keyof typeof positiveRates] || 0.4;
  
  // Generate leads
  const leads = Array.from({ length: audienceSize }, (_, i) => ({
    id: `L-${1000 + i}`,
    name: [
      "John Smith", "Jane Doe", "Mike Johnson", "Sarah Williams", "Robert Brown",
      "Emily Davis", "Chris Miller", "Amanda Wilson", "David Moore", "Lisa Taylor",
      "James Anderson", "Maria Garcia", "William Martinez", "Jennifer Lopez", "Richard Rodriguez"
    ][i % 15],
    property: `${100 + i * 10} ${["Main", "Oak", "Pine", "Elm", "Maple", "Cedar", "Birch", "Willow"][i % 8]} ${["St", "Ave", "Rd", "Ln", "Dr", "Ct"][i % 6]}, ${["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale"][i % 5]}, FL`
  }));
  
  // Generate deliveries for each step
  steps.forEach((step, stepIndex) => {
    const audienceForStep = Math.floor(audienceSize * (scenarioRates[stepIndex] || 0.5));
    const replyRate = scenarioReplyRates[stepIndex] || 0.05;
    
    for (let i = 0; i < audienceForStep; i++) {
      const lead = leads[i];
      const hasReplied = Math.random() < replyRate;
      const sentiment = hasReplied 
        ? (Math.random() < positiveRate ? "positive" : Math.random() < 0.7 ? "neutral" : "negative")
        : undefined;
      
      const baseDate = new Date("2025-01-09T10:00:00Z");
      const offsetDays = 30 - stepIndex * 7;
      const sentAt = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000 + Math.floor(i * 1000));
      
      const delivery: CampaignDelivery = {
        id: `DEL-${campaignId}-${stepIndex}-${i}`,
        campaignId,
        leadId: lead.id,
        leadName: lead.name,
        property: lead.property,
        stepIndex,
        channel: step.channel,
        status: hasReplied ? "replied" : Math.random() > 0.02 ? "delivered" : "bounced",
        sentiment,
        sentAt,
        deliveredAt: new Date(sentAt.getTime() + 1000 * 60 * 2),
        repliedAt: hasReplied ? new Date(sentAt.getTime() + 1000 * 60 * 60 * (2 + Math.random() * 48)) : undefined,
        cost: costPerChannel[step.channel as keyof typeof costPerChannel],
        variant: step.abTest ? (["A", "B", "C"][Math.floor(Math.random() * (step.variants?.length || 1))] as "A" | "B" | "C") : undefined,
        replyMessage: hasReplied ? generateReplyMessage(sentiment!) : undefined
      };
      
      deliveries.push(delivery);
      
      // Stop sending to leads who replied positively
      if (sentiment === "positive" && step.conditions.stopOnPositive) {
        leads.splice(i, 1);
        i--;
      }
    }
  });
  
  return deliveries;
}

function generateReplyMessage(sentiment: string): string {
  const positiveReplies = [
    "Yes, I'm interested. Can you call me?",
    "What's your offer? I might be ready to sell.",
    "Please send more information.",
    "I'd like to discuss this. What's the next step?",
    "How quickly can you close?",
    "Can we meet this week to discuss?"
  ];
  
  const neutralReplies = [
    "Not sure yet. What's the process?",
    "Maybe. Need to think about it.",
    "Can you send me more details?",
    "I'll discuss with my spouse and get back to you.",
    "What kind of price are we talking about?",
    "How does this work exactly?"
  ];
  
  const negativeReplies = [
    "Not interested",
    "Stop contacting me",
    "Already sold",
    "Don't need to sell",
    "Remove me from your list",
    "No thank you"
  ];
  
  const replies = {
    positive: positiveReplies,
    neutral: neutralReplies,
    negative: negativeReplies
  };
  
  const replySet = replies[sentiment as keyof typeof replies];
  return replySet[Math.floor(Math.random() * replySet.length)];
}

// Enhanced mock campaigns with full metrics
export const seedCampaigns = [
  {
    id: "CMP-001",
    name: "Probate Leads - Q1 2025",
    status: "running",
    objective: "inbound",
    scenario: "probate",
    audience: {
      size: 1250,
      filters: ["Probate", "High Equity (60%+)", "Owner Occupied", "Miami-Dade County"]
    },
    channels: ["sms", "email", "voicemail", "letter"],
    abTest: true,
    steps: campaignScenarios.probate.steps,
    metrics: {
      sends: 3750,
      delivered: 3712,
      bounced: 38,
      replies: 298,
      positive: 134,
      neutral: 89,
      negative: 75,
      appointments: 18,
      contracts: 3,
      cost: 487.50,
      revenue: 45000,
      roi: 9136
    },
    progress: 75,
    startDate: "2025-01-18T10:00:00Z",
    lastRun: "2025-02-08T14:54:00Z",
    createdAt: "2025-01-09T10:00:00Z",
    settings: {
      schedule: {
        timezone: "America/New_York",
        quietHours: { start: 9, end: 20 },
        daysOfWeek: ["mon", "tue", "wed", "thu", "fri"]
      },
      throttle: {
        maxPerDay: 500,
        maxPerHour: 100
      },
      compliance: {
        checkDNC: true,
        requireConsent: true,
        honorOptOut: true
      }
    }
  },
  {
    id: "CMP-002",
    name: "Tax Delinquent - Miami-Dade",
    status: "running",
    objective: "inbound",
    scenario: "taxDelinquent",
    audience: {
      size: 890,
      filters: ["Tax Delinquent", "30+ Days Overdue", "SFR", "$5,000+ Owed"]
    },
    channels: ["sms", "email", "voicemail"],
    abTest: false,
    steps: campaignScenarios.taxDelinquent.steps,
    metrics: {
      sends: 2670,
      delivered: 2617,
      bounced: 53,
      replies: 401,
      positive: 192,
      neutral: 124,
      negative: 85,
      appointments: 28,
      contracts: 5,
      cost: 356.00,
      revenue: 75000,
      roi: 21067
    },
    progress: 65,
    startDate: "2025-01-25T10:00:00Z",
    lastRun: "2025-02-08T08:00:00Z",
    createdAt: "2025-01-19T10:00:00Z"
  },
  {
    id: "CMP-003",
    name: "Code Violations - Orlando",
    status: "paused",
    objective: "inbound",
    scenario: "codeViolations",
    audience: {
      size: 456,
      filters: ["Code Violations", "2+ Violations", "Absentee Owner", "Orange County"]
    },
    channels: ["sms", "email"],
    abTest: true,
    steps: campaignScenarios.codeViolations.steps,
    metrics: {
      sends: 912,
      delivered: 901,
      bounced: 11,
      replies: 109,
      positive: 46,
      neutral: 38,
      negative: 25,
      appointments: 8,
      contracts: 1,
      cost: 148.75,
      revenue: 15000,
      roi: 10084
    },
    progress: 40,
    startDate: "2025-01-29T10:00:00Z",
    lastRun: "2025-02-05T10:00:00Z",
    createdAt: "2025-01-24T10:00:00Z"
  },
  {
    id: "CMP-004",
    name: "Tired Landlords - Out of State",
    status: "running",
    objective: "inbound",
    scenario: "absenteeOwner",
    audience: {
      size: 678,
      filters: ["Absentee Owner", "500+ Miles Away", "Multi-Family", "3+ Years Owned"]
    },
    channels: ["sms", "email"],
    abTest: false,
    steps: campaignScenarios.absenteeOwner.steps,
    metrics: {
      sends: 1356,
      delivered: 1329,
      bounced: 27,
      replies: 122,
      positive: 46,
      neutral: 51,
      negative: 25,
      appointments: 9,
      contracts: 2,
      cost: 98.40,
      revenue: 30000,
      roi: 30488
    },
    progress: 55,
    startDate: "2025-01-27T10:00:00Z",
    lastRun: "2025-02-08T00:00:00Z",
    createdAt: "2025-01-21T10:00:00Z"
  },
  {
    id: "CMP-005",
    name: "Pre-foreclosure - Urgent",
    status: "completed",
    objective: "inbound",
    scenario: "taxDelinquent",
    audience: {
      size: 234,
      filters: ["Pre-foreclosure", "NOD Filed", "30-60 Days to Sale", "Broward County"]
    },
    channels: ["sms", "email", "voicemail"],
    abTest: false,
    metrics: {
      sends: 936,
      delivered: 918,
      bounced: 18,
      replies: 168,
      positive: 81,
      neutral: 52,
      negative: 35,
      appointments: 14,
      contracts: 4,
      cost: 156.80,
      revenue: 60000,
      roi: 38265
    },
    progress: 100,
    startDate: "2024-12-25T10:00:00Z",
    lastRun: "2025-01-09T10:00:00Z",
    createdAt: "2024-12-20T10:00:00Z"
  },
  {
    id: "CMP-006",
    name: "Buyer Blast - Fix & Flip Deals",
    status: "running",
    objective: "disposition",
    scenario: "buyerBlast",
    audience: {
      size: 180,
      filters: ["Active Buyers", "Cash Only", "Fix & Flip", "Verified Funds"]
    },
    channels: ["sms", "email"],
    abTest: false,
    steps: campaignScenarios.buyerBlast.steps,
    metrics: {
      sends: 360,
      delivered: 358,
      bounced: 2,
      replies: 79,
      positive: 51,
      neutral: 20,
      negative: 8,
      appointments: 12,
      contracts: 3,
      cost: 5.40,
      revenue: 15000,
      roi: 277778
    },
    progress: 85,
    startDate: "2025-02-05T10:00:00Z",
    lastRun: "2025-02-08T12:00:00Z",
    createdAt: "2025-02-03T10:00:00Z"
  },
  {
    id: "CMP-007",
    name: "Vacant Properties - USPS Data",
    status: "draft",
    objective: "inbound",
    scenario: "absenteeOwner",
    audience: {
      size: 567,
      filters: ["USPS Vacant", "90+ Days", "SFR", "No Liens"]
    },
    channels: ["sms", "email", "letter"],
    abTest: true,
    metrics: {
      sends: 0,
      delivered: 0,
      bounced: 0,
      replies: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      appointments: 0,
      contracts: 0,
      cost: 0,
      revenue: 0,
      roi: 0
    },
    progress: 0,
    startDate: "2025-02-10T10:00:00Z",
    lastRun: null,
    createdAt: "2025-02-07T10:00:00Z"
  },
  {
    id: "CMP-008",
    name: "HOA Liens - Problem Properties",
    status: "running",
    objective: "inbound",
    scenario: "codeViolations",
    audience: {
      size: 123,
      filters: ["HOA Lien", "$2,000+ Owed", "Condo/Townhouse", "Palm Beach County"]
    },
    channels: ["sms", "email"],
    abTest: false,
    metrics: {
      sends: 246,
      delivered: 241,
      bounced: 5,
      replies: 31,
      positive: 14,
      neutral: 10,
      negative: 7,
      appointments: 3,
      contracts: 0,
      cost: 24.10,
      revenue: 0,
      roi: 0
    },
    progress: 30,
    startDate: "2025-02-03T10:00:00Z",
    lastRun: "2025-02-08T04:00:00Z",
    createdAt: "2025-02-01T10:00:00Z"
  },
  {
    id: "CMP-009",
    name: "High Equity Properties - Tampa Bay",
    status: "running",
    objective: "inbound",
    scenario: "highEquity",
    audience: {
      size: 950,
      filters: ["80%+ Equity", "3+ Years Ownership", "Tampa/St. Pete", "Non-Owner Occupied"]
    },
    channels: ["sms", "email", "voicemail"],
    abTest: true,
    steps: [
      {
        id: "step-1",
        name: "Initial Contact",
        channel: "sms",
        delay: 0,
        template: "High Equity Opportunity",
        conditions: {
          sendTime: { start: 10, end: 17 },
          daysOfWeek: ["mon", "tue", "wed", "thu", "fri"],
          stopOnReply: true,
          stopOnPositive: true
        },
        abTest: true,
        variants: [
          { id: "A", subject: "Your equity could work harder", allocation: 50 },
          { id: "B", subject: "Unlock your property's value", allocation: 50 }
        ]
      }
    ],
    metrics: {
      sends: 2850,
      delivered: 2793,
      bounced: 57,
      replies: 342,
      positive: 154,
      neutral: 103,
      negative: 85,
      appointments: 22,
      contracts: 4,
      cost: 428.00,
      revenue: 68000,
      roi: 15888
    },
    progress: 65,
    startDate: "2025-01-22T10:00:00Z",
    lastRun: "2025-02-08T13:30:00Z",
    createdAt: "2025-01-20T10:00:00Z"
  }
];

// Performance Analytics Data
export const campaignAnalytics = {
  stepFunnels: {
    "CMP-001": [
      { step: "Step 1 - Initial SMS", sent: 1250, delivered: 1238, replied: 100, positive: 45 },
      { step: "Step 2 - Email Follow-up", sent: 1063, delivered: 1051, replied: 64, positive: 29 },
      { step: "Step 3 - SMS Reminder", sent: 900, delivered: 891, replied: 45, positive: 20 },
      { step: "Step 4 - Voicemail", sent: 763, delivered: 755, replied: 23, positive: 10 },
      { step: "Step 5 - Letter", sent: 663, delivered: 658, replied: 15, positive: 7 }
    ],
    "CMP-002": [
      { step: "Step 1 - Urgent SMS", sent: 890, delivered: 878, replied: 134, positive: 64 },
      { step: "Step 2 - Email Details", sent: 783, delivered: 771, replied: 98, positive: 47 },
      { step: "Step 3 - Final SMS", sent: 659, delivered: 650, replied: 52, positive: 25 },
      { step: "Step 4 - Voicemail", sent: 579, delivered: 571, replied: 28, positive: 13 }
    ]
  },
  
  geographicPerformance: [
    { location: "Miami-Dade", campaigns: 12, sends: 4500, replies: 540, contracts: 8, revenue: 120000 },
    { location: "Broward", campaigns: 8, sends: 3200, replies: 352, contracts: 5, revenue: 75000 },
    { location: "Palm Beach", campaigns: 9, sends: 3600, replies: 396, contracts: 6, revenue: 90000 },
    { location: "Orange", campaigns: 6, sends: 2400, replies: 240, contracts: 3, revenue: 45000 },
    { location: "Hillsborough", campaigns: 5, sends: 2000, replies: 180, contracts: 2, revenue: 30000 }
  ],
  
  templatePerformance: campaignTemplates.map(template => ({
    ...template,
    metrics: {
      sends: Math.floor(Math.random() * 5000) + 1000,
      replies: Math.floor(Math.random() * 500) + 50,
      positive: Math.floor(Math.random() * 200) + 20,
      avgResponseTime: Math.floor(Math.random() * 48) + 1,
      unsubscribes: Math.floor(Math.random() * 50) + 5
    }
  })),
  
  hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    sends: hour >= 9 && hour <= 20 ? Math.floor(Math.random() * 500) + 100 : 0,
    replies: hour >= 9 && hour <= 20 ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 10),
    positive: hour >= 9 && hour <= 20 ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 5)
  })),
  
  monthlyTrends: Array.from({ length: 12 }, (_, month) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month],
    campaigns: Math.floor(Math.random() * 20) + 5,
    sends: Math.floor(Math.random() * 10000) + 2000,
    replies: Math.floor(Math.random() * 1000) + 200,
    contracts: Math.floor(Math.random() * 10) + 1,
    revenue: Math.floor(Math.random() * 150000) + 30000,
    cost: Math.floor(Math.random() * 2000) + 500
  }))
};

// Export everything as a default object for easy import
export default {
  campaigns: seedCampaigns,
  templates: campaignTemplates,
  scenarios: campaignScenarios,
  analytics: campaignAnalytics,
  generateDeliveries
};