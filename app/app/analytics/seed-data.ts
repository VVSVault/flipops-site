import {
  DimDate,
  DimChannel,
  DimCampaign,
  DimMarket,
  DimUser,
  DimVendor,
  DimProperty,
  FactLead,
  FactMarketingSpend,
  FactDeal,
  FactActivity,
  FactVendorJob,
  CustomDashboard,
  Alert
} from './types';

function generateDateKey(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

const startDate = new Date();
startDate.setDate(startDate.getDate() - 90);

export const dimDates: DimDate[] = [];
for (let i = -90; i <= 365; i++) {
  const date = addDays(new Date(), i);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  dimDates.push({
    dateKey: generateDateKey(date),
    date,
    week: Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7),
    month: date.getMonth() + 1,
    quarter: Math.ceil((date.getMonth() + 1) / 3),
    year: date.getFullYear(),
    monthName: monthNames[date.getMonth()],
    dayOfWeek: dayNames[date.getDay()],
    isWeekend: date.getDay() === 0 || date.getDay() === 6
  });
}

export const dimChannels: DimChannel[] = [
  { id: 'ch-1', name: 'PPC', platform: 'Google', category: 'Digital' },
  { id: 'ch-2', name: 'PPC', platform: 'Meta', category: 'Digital' },
  { id: 'ch-3', name: 'SEO', platform: 'Google', category: 'Organic' },
  { id: 'ch-4', name: 'Direct Mail', category: 'Offline' },
  { id: 'ch-5', name: 'Cold Call', category: 'Offline' },
  { id: 'ch-6', name: 'SMS', category: 'Digital' },
  { id: 'ch-7', name: 'Referral', category: 'Organic' }
];

export const dimMarkets: DimMarket[] = [
  { id: 'mkt-1', city: 'Phoenix', state: 'AZ', zip: '85001', msa: 'Phoenix-Mesa-Scottsdale', region: 'Southwest', population: 1680992 },
  { id: 'mkt-2', city: 'Scottsdale', state: 'AZ', zip: '85250', msa: 'Phoenix-Mesa-Scottsdale', region: 'Southwest', population: 258069 },
  { id: 'mkt-3', city: 'Mesa', state: 'AZ', zip: '85201', msa: 'Phoenix-Mesa-Scottsdale', region: 'Southwest', population: 518012 }
];

export const dimCampaigns: DimCampaign[] = [
  { id: 'camp-1', name: 'Phoenix - Google Search', channelId: 'ch-1', marketId: 'mkt-1', startDate: addDays(new Date(), -90), budget: 25000, status: 'Active' },
  { id: 'camp-2', name: 'Scottsdale - Google Search', channelId: 'ch-1', marketId: 'mkt-2', startDate: addDays(new Date(), -90), budget: 20000, status: 'Active' },
  { id: 'camp-3', name: 'Mesa - Google Search', channelId: 'ch-1', marketId: 'mkt-3', startDate: addDays(new Date(), -60), budget: 15000, status: 'Active' },
  { id: 'camp-4', name: 'Phoenix - Facebook Ads', channelId: 'ch-2', marketId: 'mkt-1', startDate: addDays(new Date(), -75), budget: 12000, status: 'Active' },
  { id: 'camp-5', name: 'Scottsdale - Facebook Ads', channelId: 'ch-2', marketId: 'mkt-2', startDate: addDays(new Date(), -45), budget: 8000, status: 'Active' },
  { id: 'camp-6', name: 'Phoenix - Direct Mail Q1', channelId: 'ch-4', marketId: 'mkt-1', startDate: addDays(new Date(), -80), budget: 6000, status: 'Active' },
  { id: 'camp-7', name: 'Mesa - Direct Mail Q1', channelId: 'ch-4', marketId: 'mkt-3', startDate: addDays(new Date(), -70), budget: 4000, status: 'Active' },
  { id: 'camp-8', name: 'Phoenix - Cold Call Team', channelId: 'ch-5', marketId: 'mkt-1', startDate: addDays(new Date(), -90), budget: 3000, status: 'Active' },
  { id: 'camp-9', name: 'All Markets - SMS Blast', channelId: 'ch-6', marketId: 'mkt-1', startDate: addDays(new Date(), -30), budget: 2000, status: 'Active' }
];

export const dimUsers: DimUser[] = [
  { id: 'usr-1', name: 'Tanner Mitchell', email: 'tanner@flipops.com', role: 'Executive', team: 'Leadership', startDate: addDays(new Date(), -365), isActive: true },
  { id: 'usr-2', name: 'Sarah Chen', email: 'sarah@flipops.com', role: 'Acquisition', team: 'Sales', startDate: addDays(new Date(), -180), isActive: true },
  { id: 'usr-3', name: 'Mike Rodriguez', email: 'mike@flipops.com', role: 'Acquisition', team: 'Sales', startDate: addDays(new Date(), -120), isActive: true },
  { id: 'usr-4', name: 'Emily Johnson', email: 'emily@flipops.com', role: 'Disposition', team: 'Sales', startDate: addDays(new Date(), -200), isActive: true },
  { id: 'usr-5', name: 'David Park', email: 'david@flipops.com', role: 'Account Manager', team: 'Operations', startDate: addDays(new Date(), -150), isActive: true },
  { id: 'usr-6', name: 'Jessica Martinez', email: 'jessica@flipops.com', role: 'Admin', team: 'Operations', startDate: addDays(new Date(), -90), isActive: true }
];

export const dimVendors: DimVendor[] = [
  { id: 'vnd-1', name: 'Phoenix Premier Contractors', category: 'Contractor', rating: 4.8, isPreferred: true },
  { id: 'vnd-2', name: 'Blue Wave Plumbing', category: 'Plumber', rating: 3.2, isPreferred: false },
  { id: 'vnd-3', name: 'Lightning Electric Solutions', category: 'Electrician', rating: 4.5, isPreferred: true },
  { id: 'vnd-4', name: 'Desert Cool HVAC', category: 'HVAC', rating: 4.6, isPreferred: true },
  { id: 'vnd-5', name: 'Top Tier Roofing', category: 'Roofer', rating: 4.3, isPreferred: true },
  { id: 'vnd-6', name: 'Green Valley Landscaping', category: 'Landscaper', rating: 4.7, isPreferred: true },
  { id: 'vnd-7', name: 'Precision Painters', category: 'Painter', rating: 4.4, isPreferred: true },
  { id: 'vnd-8', name: 'Southwest Flooring Pros', category: 'Flooring', rating: 3.8, isPreferred: false }
];

const addresses = [
  { street: '123 Cactus Rd', city: 'Phoenix', state: 'AZ', zip: '85001' },
  { street: '456 Desert View Dr', city: 'Scottsdale', state: 'AZ', zip: '85250' },
  { street: '789 Mesa Grande Ave', city: 'Mesa', state: 'AZ', zip: '85201' },
  { street: '321 Sunset Blvd', city: 'Phoenix', state: 'AZ', zip: '85003' },
  { street: '654 Palm Tree Ln', city: 'Scottsdale', state: 'AZ', zip: '85251' },
  { street: '987 Mountain View St', city: 'Mesa', state: 'AZ', zip: '85202' },
  { street: '147 Saguaro Way', city: 'Phoenix', state: 'AZ', zip: '85004' },
  { street: '258 Golf Course Rd', city: 'Scottsdale', state: 'AZ', zip: '85252' },
  { street: '369 University Dr', city: 'Mesa', state: 'AZ', zip: '85203' },
  { street: '741 Camelback Rd', city: 'Phoenix', state: 'AZ', zip: '85005' }
];

export const dimProperties: DimProperty[] = addresses.map((addr, i) => ({
  id: `prop-${i + 1}`,
  address: addr.street,
  city: addr.city,
  state: addr.state,
  zip: addr.zip,
  beds: randomBetween(2, 5),
  baths: randomBetween(1, 3),
  sqft: randomBetween(1200, 3500),
  yearBuilt: randomBetween(1960, 2015),
  propertyType: pickRandom(['SFH', 'Condo', 'Townhouse']),
  lotSize: randomBetween(4000, 12000)
}));

export const factLeads: FactLead[] = [];
let leadCounter = 1;

const channelConversionRates = {
  'ch-1': { qualified: 0.45, appointment: 0.25, offer: 0.15, contract: 0.08 },
  'ch-2': { qualified: 0.40, appointment: 0.22, offer: 0.12, contract: 0.06 },
  'ch-3': { qualified: 0.35, appointment: 0.18, offer: 0.10, contract: 0.05 },
  'ch-4': { qualified: 0.30, appointment: 0.15, offer: 0.08, contract: 0.05 },
  'ch-5': { qualified: 0.25, appointment: 0.12, offer: 0.06, contract: 0.03 },
  'ch-6': { qualified: 0.28, appointment: 0.14, offer: 0.07, contract: 0.04 },
  'ch-7': { qualified: 0.60, appointment: 0.35, offer: 0.25, contract: 0.15 }
};

const leadsByChannel = {
  'ch-1': 450,
  'ch-2': 280,
  'ch-3': 150,
  'ch-4': 120,
  'ch-5': 100,
  'ch-6': 80,
  'ch-7': 20
};

for (const [channelId, leadCount] of Object.entries(leadsByChannel)) {
  const rates = channelConversionRates[channelId as keyof typeof channelConversionRates];
  const campaigns = dimCampaigns.filter(c => c.channelId === channelId);
  
  for (let i = 0; i < leadCount; i++) {
    const createdDate = addDays(startDate, randomBetween(0, 89));
    const createdDateKey = generateDateKey(createdDate);
    const campaign = campaigns.length > 0 ? pickRandom(campaigns) : null;
    const market = campaign ? dimMarkets.find(m => m.id === campaign.marketId)! : pickRandom(dimMarkets);
    const owner = pickRandom(dimUsers.filter(u => u.role === 'Acquisition'));
    
    let stage: FactLead['currentStage'] = 'Lead';
    let firstContactedDateKey: string | undefined;
    let qualifiedDateKey: string | undefined;
    let appointmentSetDateKey: string | undefined;
    let offerDateKey: string | undefined;
    
    const rand = Math.random();
    
    if (rand < rates.qualified) {
      stage = 'Qualified';
      const daysToContact = channelId === 'ch-1' ? randomBetween(0, 1) : randomBetween(1, 3);
      firstContactedDateKey = generateDateKey(addDays(createdDate, daysToContact));
      qualifiedDateKey = generateDateKey(addDays(createdDate, daysToContact + randomBetween(1, 2)));
      
      if (rand < rates.appointment) {
        stage = 'Appointment';
        appointmentSetDateKey = generateDateKey(addDays(createdDate, daysToContact + randomBetween(2, 5)));
        
        if (rand < rates.offer) {
          stage = 'Offer';
          offerDateKey = generateDateKey(addDays(createdDate, daysToContact + randomBetween(5, 10)));
          
          if (rand < rates.contract) {
            stage = 'Contract';
          }
        }
      }
    }
    
    factLeads.push({
      leadId: `lead-${leadCounter++}`,
      createdDateKey,
      firstContactedDateKey,
      qualifiedDateKey,
      appointmentSetDateKey,
      offerDateKey,
      currentStage: stage,
      channelId,
      campaignId: campaign?.id,
      marketId: market.id,
      userOwnerId: owner.id,
      costsAttributionUsd: randomFloat(25, 250),
      leadScore: randomBetween(1, 100),
      source: campaign?.name || 'Direct'
    });
  }
}

export const factMarketingSpend: FactMarketingSpend[] = [];
for (const campaign of dimCampaigns) {
  const campaignDays = 90;
  const dailyBudget = (campaign.budget || 0) / campaignDays;
  
  for (let day = 0; day < campaignDays; day++) {
    const date = addDays(campaign.startDate, day);
    if (date > new Date()) break;
    
    const dateKey = generateDateKey(date);
    const dayVariance = randomFloat(0.7, 1.3);
    const spend = dailyBudget * dayVariance;
    
    let impressions = 0;
    let clicks = 0;
    let calls = 0;
    let forms = 0;
    let sms = 0;
    
    if (campaign.channelId === 'ch-1' || campaign.channelId === 'ch-2') {
      impressions = randomBetween(1000, 5000);
      clicks = randomBetween(50, 200);
      forms = randomBetween(5, 20);
    } else if (campaign.channelId === 'ch-4') {
      impressions = randomBetween(500, 1500);
      calls = randomBetween(5, 15);
    } else if (campaign.channelId === 'ch-5') {
      calls = randomBetween(50, 150);
    } else if (campaign.channelId === 'ch-6') {
      sms = randomBetween(100, 500);
    }
    
    factMarketingSpend.push({
      campaignId: campaign.id,
      dateKey,
      spendUsd: spend,
      impressions,
      clicks,
      calls,
      forms,
      sms,
      cpc: clicks > 0 ? spend / clicks : undefined,
      cpl: undefined,
      conversionRate: clicks > 0 ? (forms + calls) / clicks : undefined
    });
  }
}

export const factDeals: FactDeal[] = [];
const contractedLeads = factLeads.filter(l => l.currentStage === 'Contract');
let dealCounter = 1;

for (const lead of contractedLeads) {
  const property = pickRandom(dimProperties);
  const dealType = pickRandom(['Wholesale', 'Wholesale', 'Wholesale', 'Flip', 'Flip', 'Wholetail', 'Rental']);
  const acqUser = dimUsers.find(u => u.id === lead.userOwnerId);
  const dispoUser = pickRandom(dimUsers.filter(u => u.role === 'Disposition'));
  
  const contractDate = lead.offerDateKey ? 
    addDays(new Date(lead.offerDateKey.slice(0, 4) + '-' + lead.offerDateKey.slice(4, 6) + '-' + lead.offerDateKey.slice(6, 8)), randomBetween(2, 7)) :
    addDays(new Date(), -randomBetween(30, 60));
  
  const arvUsd = property.sqft * randomBetween(200, 400);
  const purchasePriceUsd = arvUsd * randomFloat(0.50, 0.65);  // Buy at 50-65% of ARV
  
  let revenueUsd = 0;
  let assignmentFeeUsd = 0;
  let rehabBudgetUsd = 0;
  let rehabActualUsd = 0;
  let holdingCostsUsd = 0;
  let closingCostsBuyUsd = purchasePriceUsd * 0.02;
  let closingCostsSellUsd = 0;
  
  if (dealType === 'Wholesale') {
    // Wholesale: just assignment fee, pure profit
    assignmentFeeUsd = randomBetween(8000, 25000);
    revenueUsd = assignmentFeeUsd;
    rehabBudgetUsd = 0;
    rehabActualUsd = 0;
    holdingCostsUsd = 0;
    closingCostsSellUsd = 0;
  } else if (dealType === 'Flip' || dealType === 'Wholetail') {
    // Flip: buy low, rehab, sell at 90-95% ARV
    rehabBudgetUsd = property.sqft * randomBetween(25, 45);
    rehabActualUsd = rehabBudgetUsd * randomFloat(0.95, 1.10);  // Usually close to budget
    holdingCostsUsd = randomBetween(3000, 8000);
    closingCostsSellUsd = arvUsd * 0.06;
    revenueUsd = arvUsd * randomFloat(0.90, 0.98);  // Sell at 90-98% of ARV
  } else if (dealType === 'Rental') {
    // Rental: lower rehab, annual rental income
    rehabBudgetUsd = property.sqft * randomBetween(10, 25);
    rehabActualUsd = rehabBudgetUsd * randomFloat(0.95, 1.05);
    revenueUsd = randomBetween(1500, 2500) * 12;  // Annual rental income
  }
  
  const isCloseed = Math.random() < 0.85;
  const closedDate = isCloseed ? addDays(contractDate, randomBetween(14, 45)) : undefined;
  
  factDeals.push({
    dealId: `deal-${dealCounter++}`,
    propertyId: property.id,
    marketId: lead.marketId,
    acqUserId: acqUser?.id,
    dispoUserId: dispoUser.id,
    contractedDateKey: generateDateKey(contractDate),
    closedDateKey: closedDate ? generateDateKey(closedDate) : undefined,
    dispositionDateKey: closedDate ? generateDateKey(addDays(closedDate, randomBetween(1, 7))) : undefined,
    dealType: dealType as FactDeal['dealType'],
    stage: isCloseed ? 'Closed' : pickRandom(['Contract', 'Due Diligence', 'Closing']),
    revenueUsd,
    purchasePriceUsd,
    arvUsd,
    rehabBudgetUsd,
    rehabActualUsd,
    holdingCostsUsd,
    closingCostsBuyUsd,
    closingCostsSellUsd,
    marketingAllocatedUsd: randomBetween(200, 1500),  // Reasonable marketing cost per deal
    vendorCostsUsd: dealType === 'Wholesale' ? 0 : randomBetween(500, 2500),  // No vendor costs for wholesale
    otherIncomeUsd: Math.random() < 0.1 ? randomBetween(500, 2000) : 0,
    assignmentFeeUsd,
    daysToContract: randomBetween(5, 30),
    daysToClose: closedDate ? Math.floor((closedDate.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined
  });
}

export const factActivities: FactActivity[] = [];
let activityCounter = 1;

const activityTypes = ['Call', 'SMS', 'Email', 'Appointment', 'Offer', 'Note', 'Task'];
const outcomes = ['Connected', 'No Answer', 'Left VM', 'Wrong Number', 'Not Interested', 'Scheduled', 'Completed'];

for (const user of dimUsers.filter(u => ['Acquisition', 'Disposition', 'Account Manager'].includes(u.role))) {
  const userLeads = factLeads.filter(l => l.userOwnerId === user.id);
  const activitiesPerLead = randomBetween(3, 8);
  
  for (const lead of userLeads) {
    for (let i = 0; i < activitiesPerLead; i++) {
      const activityDate = addDays(
        new Date(lead.createdDateKey.slice(0, 4) + '-' + lead.createdDateKey.slice(4, 6) + '-' + lead.createdDateKey.slice(6, 8)),
        randomBetween(0, 14)
      );
      
      const activityType = pickRandom(activityTypes);
      let duration = 0;
      
      if (activityType === 'Call') {
        duration = randomBetween(30, 600);
      } else if (activityType === 'Appointment') {
        duration = randomBetween(1800, 5400);
      }
      
      factActivities.push({
        activityId: `act-${activityCounter++}`,
        userId: user.id,
        leadId: lead.leadId,
        activityType: activityType as FactActivity['activityType'],
        outcome: pickRandom(outcomes) as FactActivity['outcome'],
        durationSec: duration,
        createdDateKey: generateDateKey(activityDate),
        createdTime: `${randomBetween(8, 18).toString().padStart(2, '0')}:${randomBetween(0, 59).toString().padStart(2, '0')}:00`
      });
    }
  }
}

export const factVendorJobs: FactVendorJob[] = [];
let jobCounter = 1;

for (const deal of factDeals.filter(d => d.dealType !== 'Wholesale')) {
  const jobCount = randomBetween(2, 6);
  
  for (let i = 0; i < jobCount; i++) {
    const vendor = pickRandom(dimVendors);
    const quoted = randomBetween(1000, 15000);
    const variance = vendor.rating && vendor.rating < 4 ? randomFloat(-0.1, 0.35) : randomFloat(-0.05, 0.15);
    const actual = quoted * (1 + variance);
    
    const startDate = deal.contractedDateKey ? 
      addDays(new Date(deal.contractedDateKey.slice(0, 4) + '-' + deal.contractedDateKey.slice(4, 6) + '-' + deal.contractedDateKey.slice(6, 8)), randomBetween(5, 15)) :
      addDays(new Date(), -randomBetween(30, 60));
    const dueDate = addDays(startDate, randomBetween(3, 21));
    const completedDate = addDays(startDate, randomBetween(3, 25));
    const onTime = completedDate <= dueDate;
    
    factVendorJobs.push({
      jobId: `job-${jobCounter++}`,
      vendorId: vendor.id,
      dealId: deal.dealId,
      category: vendor.category,
      quotedUsd: quoted,
      actualUsd: actual,
      startDateKey: generateDateKey(startDate),
      dueDateKey: generateDateKey(dueDate),
      completedDateKey: generateDateKey(completedDate),
      onTime,
      changeOrdersCount: variance > 0.15 ? randomBetween(1, 3) : 0,
      ratingGiven: vendor.rating ? Math.max(1, Math.min(5, vendor.rating + randomFloat(-1, 1))) : undefined,
      notes: variance > 0.2 ? 'Significant scope changes required' : undefined
    });
  }
}

export const customDashboards: CustomDashboard[] = [
  {
    id: 'dash-1',
    name: 'Executive Overview - Last 30 Days',
    description: 'High-level KPIs and performance metrics',
    userId: 'usr-1',
    isShared: true,
    layout: {
      widgets: [
        {
          id: 'w1',
          type: 'kpi',
          title: 'Total Leads',
          dataSource: 'leads',
          config: { metric: 'count', format: 'number' },
          position: { x: 0, y: 0, w: 2, h: 1 }
        },
        {
          id: 'w2',
          type: 'kpi',
          title: 'Contracts',
          dataSource: 'deals',
          config: { metric: 'contracts', format: 'number' },
          position: { x: 2, y: 0, w: 2, h: 1 }
        },
        {
          id: 'w3',
          type: 'kpi',
          title: 'Net Profit',
          dataSource: 'profitability',
          config: { metric: 'netProfit', format: 'currency' },
          position: { x: 4, y: 0, w: 2, h: 1 }
        },
        {
          id: 'w4',
          type: 'kpi',
          title: 'ROMI',
          dataSource: 'marketing',
          config: { metric: 'romi', format: 'percentage' },
          position: { x: 6, y: 0, w: 2, h: 1 }
        },
        {
          id: 'w5',
          type: 'funnel',
          title: 'Conversion Funnel',
          dataSource: 'funnel',
          config: { stages: ['Lead', 'Qualified', 'Appointment', 'Offer', 'Contract', 'Closed'] },
          position: { x: 0, y: 1, w: 4, h: 3 }
        },
        {
          id: 'w6',
          type: 'chart',
          title: 'Profit Trend',
          dataSource: 'profitability_trend',
          config: { chartType: 'area', metric: 'netProfit' },
          position: { x: 4, y: 1, w: 4, h: 3 }
        }
      ],
      columns: 8,
      rowHeight: 120
    },
    filters: {
      dateRange: { from: addDays(new Date(), -30), to: new Date() }
    },
    createdAt: addDays(new Date(), -60),
    updatedAt: new Date()
  },
  {
    id: 'dash-2',
    name: 'Marketing Performance - By Campaign',
    description: 'Detailed marketing metrics and ROI analysis',
    userId: 'usr-1',
    isShared: true,
    layout: {
      widgets: [
        {
          id: 'w1',
          type: 'table',
          title: 'Campaign Performance',
          dataSource: 'marketing_campaigns',
          config: { 
            columns: ['Campaign', 'Spend', 'Leads', 'CPL', 'CPA', 'ROAS'],
            sortBy: 'ROAS',
            sortOrder: 'desc'
          },
          position: { x: 0, y: 0, w: 8, h: 3 }
        },
        {
          id: 'w2',
          type: 'chart',
          title: 'Spend vs Leads by Channel',
          dataSource: 'marketing_channels',
          config: { 
            chartType: 'bar',
            metrics: ['spend', 'leads'],
            groupBy: 'channel'
          },
          position: { x: 0, y: 3, w: 4, h: 2 }
        },
        {
          id: 'w3',
          type: 'heatmap',
          title: 'ROMI by Market & Channel',
          dataSource: 'marketing_heatmap',
          config: { 
            xAxis: 'market',
            yAxis: 'channel',
            metric: 'romi'
          },
          position: { x: 4, y: 3, w: 4, h: 2 }
        }
      ],
      columns: 8,
      rowHeight: 120
    },
    filters: {
      dateRange: { from: addDays(new Date(), -90), to: new Date() }
    },
    createdAt: addDays(new Date(), -45),
    updatedAt: new Date()
  },
  {
    id: 'dash-3',
    name: 'Acquisition - Rep Leaderboard',
    description: 'Team performance metrics and rankings',
    userId: 'usr-2',
    isShared: true,
    layout: {
      widgets: [
        {
          id: 'w1',
          type: 'table',
          title: 'Rep Leaderboard',
          dataSource: 'team_leaderboard',
          config: { 
            columns: ['Rep', 'Touches/Day', 'Appointments', 'Offers', 'Contracts', 'Win Rate'],
            sortBy: 'Contracts',
            sortOrder: 'desc',
            highlight: 'top3'
          },
          position: { x: 0, y: 0, w: 8, h: 3 }
        },
        {
          id: 'w2',
          type: 'chart',
          title: 'Activity Distribution',
          dataSource: 'team_activities',
          config: { 
            chartType: 'donut',
            metric: 'count',
            groupBy: 'activityType'
          },
          position: { x: 0, y: 3, w: 4, h: 2 }
        },
        {
          id: 'w3',
          type: 'chart',
          title: 'Speed to Lead',
          dataSource: 'team_response',
          config: { 
            chartType: 'histogram',
            metric: 'responseTime',
            bins: 10
          },
          position: { x: 4, y: 3, w: 4, h: 2 }
        }
      ],
      columns: 8,
      rowHeight: 120
    },
    filters: {
      dateRange: { from: addDays(new Date(), -30), to: new Date() }
    },
    createdAt: addDays(new Date(), -30),
    updatedAt: new Date()
  },
  {
    id: 'dash-4',
    name: 'Profit Analysis - Market Comparison',
    description: 'Deal profitability and market performance',
    userId: 'usr-4',
    isShared: true,
    layout: {
      widgets: [
        {
          id: 'w1',
          type: 'chart',
          title: 'Profit Waterfall',
          dataSource: 'profit_waterfall',
          config: { 
            chartType: 'waterfall',
            stages: ['Revenue', 'Purchase', 'Rehab', 'Holding', 'Closing', 'Marketing', 'Net Profit']
          },
          position: { x: 0, y: 0, w: 8, h: 3 }
        },
        {
          id: 'w2',
          type: 'chart',
          title: 'MOIC by Market',
          dataSource: 'profit_moic',
          config: { 
            chartType: 'column',
            metric: 'moic',
            groupBy: 'market'
          },
          position: { x: 0, y: 3, w: 4, h: 2 }
        },
        {
          id: 'w3',
          type: 'chart',
          title: 'Rehab Variance',
          dataSource: 'profit_rehab',
          config: { 
            chartType: 'boxplot',
            metric: 'rehabVariance',
            groupBy: 'dealType'
          },
          position: { x: 4, y: 3, w: 4, h: 2 }
        }
      ],
      columns: 8,
      rowHeight: 120
    },
    filters: {
      dateRange: { from: addDays(new Date(), -90), to: new Date() },
      dealTypes: ['Flip', 'Wholetail']
    },
    createdAt: addDays(new Date(), -15),
    updatedAt: new Date()
  }
];

export const alerts: Alert[] = [
  {
    id: 'alert-1',
    name: 'Lead SLA Breach',
    type: 'SLA',
    condition: {
      metric: 'firstResponseTime',
      operator: '>',
      value: 15,
      timeWindow: 'minutes'
    },
    actions: [
      {
        type: 'Slack',
        recipients: ['#sales-alerts'],
        message: 'PPC lead not contacted within 15 minutes'
      },
      {
        type: 'Email',
        recipients: ['sales-manager@flipops.com']
      }
    ],
    isActive: true,
    frequency: 'Real-time'
  },
  {
    id: 'alert-2',
    name: 'Campaign Fatigue',
    type: 'Performance',
    condition: {
      metric: 'cplChange',
      operator: '>',
      value: 30,
      timeWindow: 'week'
    },
    actions: [
      {
        type: 'In-App',
        recipients: ['marketing-team'],
        message: 'Campaign CPL increased by 30% week-over-week'
      }
    ],
    isActive: true,
    frequency: 'Daily'
  },
  {
    id: 'alert-3',
    name: 'Profit Guardrail',
    type: 'Profit',
    condition: {
      metric: 'arvDiscount',
      operator: '<',
      value: 20,
      timeWindow: 'immediate'
    },
    actions: [
      {
        type: 'Slack',
        recipients: ['#acquisitions'],
        message: 'Deal ARV discount below 20% - High Risk'
      }
    ],
    isActive: true,
    frequency: 'Real-time'
  },
  {
    id: 'alert-4',
    name: 'Vendor Reliability',
    type: 'Vendor',
    condition: {
      metric: 'onTimePercentage',
      operator: '<',
      value: 80,
      timeWindow: '30days'
    },
    actions: [
      {
        type: 'In-App',
        recipients: ['operations-team'],
        message: 'Vendor on-time percentage below 80%'
      }
    ],
    isActive: true,
    frequency: 'Weekly'
  }
];

export const analyticsSeedData = {
  dimDates,
  dimChannels,
  dimCampaigns,
  dimMarkets,
  dimUsers,
  dimVendors,
  dimProperties,
  factLeads,
  factMarketingSpend,
  factDeals,
  factActivities,
  factVendorJobs,
  customDashboards,
  alerts
};