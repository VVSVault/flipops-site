/**
 * ATTOM Property Discovery Cron Job
 *
 * Schedule: Daily at 6 AM
 * Purpose: Discover investment properties using ATTOM API, score them, and ingest qualified leads
 *
 * Migrated from: n8n workflow "ATTOM Property Discovery"
 */

import {
  createLogger,
  prisma,
  closePrismaConnection,
  getActiveUsers,
  parseInvestorProfile,
  sendSlackNotification,
  formatCurrency,
  sleep,
  retry,
  normalizeAddress,
} from '../shared';

const logger = createLogger('ATTOM Property Discovery');

// ATTOM API Configuration
const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
const ATTOM_API_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

interface AttomProperty {
  identifier?: {
    attomId?: string;
    apn?: string;
    fips?: string;
  };
  address?: {
    line1?: string;
    line2?: string;
    locality?: string;
    countrySubd?: string;
    postal1?: string;
    oneLine?: string;
  };
  lot?: {
    lotsize1?: number;
  };
  building?: {
    rooms?: {
      beds?: number;
      bathstotal?: number;
    };
    size?: {
      livingsize?: number;
    };
    summary?: {
      yearbuilt?: number;
      propertyType?: string;
    };
  };
  assessment?: {
    assessed?: {
      taxyear?: number;
      owner?: {
        name?: string;
        mailingAddress?: string;
      };
    };
    market?: {
      mktttlvalue?: number;
    };
    tax?: {
      taxtotal?: number;
    };
  };
  sale?: {
    date?: {
      salerecdate?: string;
    };
    amount?: {
      saleamt?: number;
    };
  };
  avm?: {
    amount?: {
      value?: number;
    };
  };
}

interface PropertyForIngest {
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  apn: string | null;
  ownerName: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  assessedValue: number | null;
  taxAmount: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  estimatedValue: number | null;
  foreclosure: boolean;
  preForeclosure: boolean;
  taxDelinquent: boolean;
  vacant: boolean;
  bankruptcy: boolean;
  absenteeOwner: boolean;
  sourceId: string | null;
  metadata: {
    matchScore: number;
    attomId?: string;
    fips?: string;
  };
}

interface InvestorProfile {
  targetZipCodes?: string[];
  priceRanges?: Array<{
    min: number;
    max: number;
    weight?: number;
  }>;
  distressIndicators?: {
    taxDelinquent?: number;
    absenteeOwner?: number;
    foreclosure?: number;
    liens?: number;
    vacant?: number;
  };
  preferredCharacteristics?: {
    beds?: { min?: number; max?: number };
    sqft?: { min?: number; max?: number };
    yearBuilt?: { min?: number; max?: number };
  };
  equityRequirements?: {
    minEquityPercent?: number;
    preferredEquityPercent?: number;
  };
  leadPreferences?: {
    dailyMaxLeads?: number;
  };
}

interface DiscoveryStats {
  userId: string;
  userName: string;
  zipsProcessed: number;
  totalProperties: number;
  qualifiedProperties: number;
  propertiesIngested: number;
  averageScore: number;
  topProperties: PropertyForIngest[];
}

/**
 * Main workflow function
 */
async function attomPropertyDiscovery() {
  logger.info('Starting ATTOM property discovery');

  if (!ATTOM_API_KEY) {
    logger.error('ATTOM_API_KEY environment variable not set');
    throw new Error('ATTOM_API_KEY environment variable is required');
  }

  try {
    // Get all active users with Slack webhooks
    const users = await getActiveUsers();
    const usersWithSlack = users.filter((u) => u.slackWebhook);

    logger.info(`Processing ATTOM discovery for ${usersWithSlack.length} users`);

    let totalPropertiesFound = 0;
    let totalNotifications = 0;

    // Process each user
    for (const user of usersWithSlack) {
      try {
        logger.debug(`Processing discovery for user: ${user.name}`);

        // Parse investor profile
        const profile = parseInvestorProfile(user);
        if (!profile) {
          logger.warn(`User ${user.name} has no investor profile, skipping`);
          continue;
        }

        // Get target ZIP codes from investor profile
        const targetZipCodes = profile.targetZipCodes || [];
        if (targetZipCodes.length === 0) {
          logger.warn(`User ${user.name} has no target ZIP codes, skipping`);
          continue;
        }

        // Limit to first 20 ZIPs per run to avoid API rate limits
        const zipsToProcess = targetZipCodes.slice(0, 20);

        logger.info(
          `Discovering properties for user ${user.name} across ${zipsToProcess.length} ZIP codes`
        );

        // Process each ZIP code
        const allProperties: PropertyForIngest[] = [];

        for (const zip of zipsToProcess) {
          try {
            logger.debug(`Fetching properties for ZIP: ${zip}`);

            // Fetch properties from ATTOM API
            const properties = await fetchAttomProperties(zip, profile);

            // Score and filter properties
            const scoredProperties = scoreAndFilterProperties(
              properties,
              profile,
              user.minScore || 65
            );

            allProperties.push(...scoredProperties);

            // Rate limit: 1 second between API calls
            await sleep(1000);
          } catch (zipError) {
            logger.error(`Failed to process ZIP ${zip}`, zipError);
          }
        }

        // Remove duplicates and sort by score
        const uniqueProperties = deduplicateProperties(allProperties);

        // Limit to daily max leads
        const dailyMax = profile.leadPreferences?.dailyMaxLeads || 20;
        const finalProperties = uniqueProperties.slice(0, dailyMax);

        if (finalProperties.length === 0) {
          logger.debug(`No qualified properties found for user: ${user.name}`);
          continue;
        }

        logger.info(
          `Found ${finalProperties.length} qualified properties for user: ${user.name}`
        );

        totalPropertiesFound += finalProperties.length;

        // Ingest properties into database
        const ingestResult = await ingestProperties(user.id, finalProperties);

        // Send Slack notification
        const stats: DiscoveryStats = {
          userId: user.id,
          userName: user.name,
          zipsProcessed: zipsToProcess.length,
          totalProperties: allProperties.length,
          qualifiedProperties: uniqueProperties.length,
          propertiesIngested: ingestResult.created + ingestResult.updated,
          averageScore:
            finalProperties.length > 0
              ? Math.round(
                  finalProperties.reduce((sum, p) => sum + p.metadata.matchScore, 0) /
                    finalProperties.length
                )
              : 0,
          topProperties: finalProperties.slice(0, 5), // Top 5 for notification
        };

        const sent = await sendDiscoveryNotification(
          user.slackWebhook!,
          stats,
          ingestResult,
          user.minScore || 65
        );

        if (sent) {
          totalNotifications++;
        }
      } catch (error) {
        logger.error(
          `Failed to process ATTOM discovery for user ${user.id}`,
          error
        );
      }
    }

    logger.success(
      `ATTOM discovery complete: ${totalPropertiesFound} properties found, ${totalNotifications} notifications sent`
    );
  } catch (error) {
    logger.error('ATTOM property discovery workflow failed', error);
    throw error;
  } finally {
    await closePrismaConnection();
  }
}

/**
 * Fetch properties from ATTOM Sales API
 */
async function fetchAttomProperties(
  zip: string,
  profile: InvestorProfile
): Promise<AttomProperty[]> {
  const params = new URLSearchParams({
    postalcode: zip,
    pagesize: '20',
  });

  // Add price filters if investor has preferences (use correct ATTOM parameter names)
  if (profile.priceRanges && profile.priceRanges.length > 0) {
    const primaryRange = profile.priceRanges[0];
    if (primaryRange.min) params.append('minsaleamt', primaryRange.min.toString());
    if (primaryRange.max) params.append('maxsaleamt', primaryRange.max.toString());
  }

  const url = `${ATTOM_API_BASE}/sale/snapshot?${params.toString()}`;

  const response = await retry(
    async () => {
      const res = await fetch(url, {
        headers: {
          apikey: ATTOM_API_KEY!,
          accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`ATTOM API error: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const data = await res.json();
      return data.property || [];
    },
    {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
    }
  );

  return response;
}

/**
 * Calculate match score based on investor profile
 * Returns 0-100 score
 */
function calculateMatchScore(
  property: AttomProperty,
  profile: InvestorProfile
): number {
  let score = 0;

  // Price Match (30 points)
  if (profile.priceRanges && profile.priceRanges.length > 0) {
    for (const range of profile.priceRanges) {
      const price = property.sale?.amount?.saleamt || 0;
      if (price >= range.min && price <= range.max) {
        score += 30 * (range.weight || 1.0);
        break;
      }
    }
  }

  // Distress Indicators (40 points max)
  const distress = profile.distressIndicators || {};
  const assessment = property.assessment?.assessed || {};

  // Tax delinquency (8.5 points)
  if (
    assessment.taxyear &&
    parseInt(assessment.taxyear.toString()) < new Date().getFullYear() - 1
  ) {
    score += (distress.taxDelinquent || 0.8) * 8.5;
  }

  // Absentee owner (7.5 points)
  if (
    assessment.owner?.mailingAddress &&
    property.address?.oneLine &&
    assessment.owner.mailingAddress !== property.address.oneLine
  ) {
    score += (distress.absenteeOwner || 0.6) * 7.5;
  }

  // Property Characteristics (15 points)
  const chars = profile.preferredCharacteristics || {};
  const building = property.building || {};

  // Bedrooms (5 points)
  if (chars.beds && building.rooms?.beds) {
    const beds = parseInt(building.rooms.beds.toString());
    if (beds >= (chars.beds.min || 0) && beds <= (chars.beds.max || 10)) {
      score += 5;
    }
  }

  // Square footage (5 points)
  if (chars.sqft && building.size?.livingsize) {
    const sqft = parseInt(building.size.livingsize.toString());
    if (sqft >= (chars.sqft.min || 0) && sqft <= (chars.sqft.max || 10000)) {
      score += 5;
    }
  }

  // Year built (5 points)
  if (chars.yearBuilt && building.summary?.yearbuilt) {
    const year = parseInt(building.summary.yearbuilt.toString());
    if (
      year >= (chars.yearBuilt.min || 1900) &&
      year <= (chars.yearBuilt.max || 2025)
    ) {
      score += 5;
    }
  }

  // Equity Potential (15 points)
  const salePrice = property.sale?.amount?.saleamt || 0;
  const avm = property.avm?.amount?.value || salePrice;

  if (salePrice > 0 && avm > 0) {
    const equityPercent = ((avm - salePrice) / avm) * 100;
    const equityReq = profile.equityRequirements || {};

    if (equityPercent >= (equityReq.preferredEquityPercent || 40)) {
      score += 15;
    } else if (equityPercent >= (equityReq.minEquityPercent || 20)) {
      score += 8;
    }
  }

  return Math.round(score);
}

/**
 * Transform ATTOM property to FlipOps ingest format
 */
function transformProperty(
  property: AttomProperty,
  matchScore: number
): PropertyForIngest {
  const address = property.address || {};
  const sale = property.sale || {};
  const assessment = property.assessment?.assessed || {};
  const building = property.building || {};

  return {
    address: address.line1 || '',
    city: address.locality || '',
    state: address.countrySubd || '',
    zip: address.postal1 || '',
    county: address.oneLine?.split(',')[2]?.trim() || null,
    apn: property.identifier?.apn || null,
    ownerName: assessment.owner?.name || null,
    propertyType: building.summary?.propertyType || null,
    bedrooms: building.rooms?.beds
      ? parseInt(building.rooms.beds.toString())
      : null,
    bathrooms: building.rooms?.bathstotal
      ? parseFloat(building.rooms.bathstotal.toString())
      : null,
    squareFeet: building.size?.livingsize
      ? parseInt(building.size.livingsize.toString())
      : null,
    lotSize: property.lot?.lotsize1
      ? parseInt(property.lot.lotsize1.toString())
      : null,
    yearBuilt: building.summary?.yearbuilt
      ? parseInt(building.summary.yearbuilt.toString())
      : null,
    assessedValue: property.assessment?.market?.mktttlvalue
      ? parseFloat(property.assessment.market.mktttlvalue.toString())
      : null,
    taxAmount: property.assessment?.tax?.taxtotal
      ? parseFloat(property.assessment.tax.taxtotal.toString())
      : null,
    lastSaleDate: sale.date?.salerecdate || null,
    lastSalePrice: sale.amount?.saleamt
      ? parseFloat(sale.amount.saleamt.toString())
      : null,
    estimatedValue: property.avm?.amount?.value
      ? parseFloat(property.avm.amount.value.toString())
      : null,
    foreclosure: false,
    preForeclosure: false,
    taxDelinquent: assessment.taxyear
      ? parseInt(assessment.taxyear.toString()) < new Date().getFullYear() - 1
      : false,
    vacant: false,
    bankruptcy: false,
    absenteeOwner:
      assessment.owner?.mailingAddress && address.oneLine
        ? assessment.owner.mailingAddress !== address.oneLine
        : false,
    sourceId: property.identifier?.attomId || null,
    metadata: {
      matchScore,
      attomId: property.identifier?.attomId,
      fips: property.identifier?.fips,
    },
  };
}

/**
 * Score and filter properties
 */
function scoreAndFilterProperties(
  properties: AttomProperty[],
  profile: InvestorProfile,
  minScore: number
): PropertyForIngest[] {
  const scoredProperties: PropertyForIngest[] = [];

  for (const property of properties) {
    try {
      // Calculate match score
      const matchScore = calculateMatchScore(property, profile);

      // Only process properties that meet minimum score
      if (matchScore >= minScore) {
        const transformed = transformProperty(property, matchScore);
        scoredProperties.push(transformed);
      }
    } catch (error) {
      logger.error('Property scoring error', error);
    }
  }

  // Sort by score (highest first)
  scoredProperties.sort((a, b) => b.metadata.matchScore - a.metadata.matchScore);

  return scoredProperties;
}

/**
 * Deduplicate properties by address
 */
function deduplicateProperties(
  properties: PropertyForIngest[]
): PropertyForIngest[] {
  const uniqueProperties: PropertyForIngest[] = [];
  const seen = new Set<string>();

  for (const prop of properties) {
    // Normalize address to catch variations like "123 Main St" vs "123 Main Street"
    const normalizedAddress = normalizeAddress(prop.address);
    const normalizedCity = normalizeAddress(prop.city);
    const key = `${normalizedAddress}-${normalizedCity}-${prop.state}-${prop.zip}`;

    if (!seen.has(key)) {
      seen.add(key);
      uniqueProperties.push(prop);
    }
  }

  // Sort by score (highest first)
  uniqueProperties.sort(
    (a, b) => b.metadata.matchScore - a.metadata.matchScore
  );

  return uniqueProperties;
}

/**
 * Ingest properties using direct Prisma access
 */
async function ingestProperties(
  userId: string,
  properties: PropertyForIngest[]
): Promise<{ created: number; updated: number; skipped: number }> {
  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
  };

  for (const property of properties) {
    try {
      // Check if property already exists for this user
      const existing = await prisma.property.findUnique({
        where: {
          userId_address_city_state_zip: {
            userId,
            address: property.address,
            city: property.city,
            state: property.state,
            zip: property.zip,
          },
        },
      });

      if (existing) {
        // Update existing property with new data
        await prisma.property.update({
          where: { id: existing.id },
          data: {
            county: property.county ?? existing.county,
            apn: property.apn ?? existing.apn,
            ownerName: property.ownerName ?? existing.ownerName,
            propertyType: property.propertyType ?? existing.propertyType,
            bedrooms: property.bedrooms ?? existing.bedrooms,
            bathrooms: property.bathrooms ?? existing.bathrooms,
            squareFeet: property.squareFeet ?? existing.squareFeet,
            lotSize: property.lotSize ?? existing.lotSize,
            yearBuilt: property.yearBuilt ?? existing.yearBuilt,
            assessedValue: property.assessedValue ?? existing.assessedValue,
            taxAmount: property.taxAmount ?? existing.taxAmount,
            lastSaleDate: property.lastSaleDate ?? existing.lastSaleDate,
            lastSalePrice: property.lastSalePrice ?? existing.lastSalePrice,
            estimatedValue: property.estimatedValue ?? existing.estimatedValue,
            foreclosure: property.foreclosure,
            preForeclosure: property.preForeclosure,
            taxDelinquent: property.taxDelinquent,
            vacant: property.vacant,
            bankruptcy: property.bankruptcy,
            absenteeOwner: property.absenteeOwner,
            dataSource: 'attom',
            sourceId: property.sourceId ?? existing.sourceId,
            metadata: JSON.stringify(property.metadata),
            updatedAt: new Date(),
          },
        });

        results.updated++;
      } else {
        // Create new property
        await prisma.property.create({
          data: {
            userId,
            address: property.address,
            city: property.city,
            state: property.state,
            zip: property.zip,
            county: property.county,
            apn: property.apn,
            ownerName: property.ownerName,
            propertyType: property.propertyType,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            squareFeet: property.squareFeet,
            lotSize: property.lotSize,
            yearBuilt: property.yearBuilt,
            assessedValue: property.assessedValue,
            taxAmount: property.taxAmount,
            lastSaleDate: property.lastSaleDate,
            lastSalePrice: property.lastSalePrice,
            estimatedValue: property.estimatedValue,
            foreclosure: property.foreclosure,
            preForeclosure: property.preForeclosure,
            taxDelinquent: property.taxDelinquent,
            vacant: property.vacant,
            bankruptcy: property.bankruptcy,
            absenteeOwner: property.absenteeOwner,
            dataSource: 'attom',
            sourceId: property.sourceId,
            metadata: JSON.stringify(property.metadata),
            enriched: false,
          },
        });

        results.created++;
      }
    } catch (propertyError) {
      logger.error('Failed to process property', propertyError);
      results.skipped++;
    }
  }

  return results;
}

/**
 * Send Slack notification for discovery results
 */
async function sendDiscoveryNotification(
  slackWebhook: string,
  stats: DiscoveryStats,
  ingestResult: { created: number; updated: number; skipped: number },
  minScore: number
): Promise<boolean> {
  logger.info(
    `Sending discovery notification to ${stats.userName} for ${stats.propertiesIngested} properties`
  );

  // Format top properties for Slack
  const propertyList = stats.topProperties
    .map(
      (p, i) =>
        `${i + 1}. *${p.address}, ${p.city}, ${p.state}* - Score: ${
          p.metadata.matchScore
        }/100 (${formatCurrency(p.lastSalePrice || 0)})`
    )
    .join('\n');

  const message =
    `*Investor:* ${stats.userName}\n` +
    `*Properties Found:* ${stats.qualifiedProperties} qualified leads\n` +
    `*Average Score:* ${stats.averageScore}/100\n` +
    `*Ingested:* ${ingestResult.created} new, ${ingestResult.updated} updated\n\n` +
    `*Top Properties:*\n${propertyList}`;

  const fields = [
    {
      title: 'Total Found',
      value: stats.qualifiedProperties.toString(),
    },
    {
      title: 'Avg Score',
      value: `${stats.averageScore}/100`,
    },
    {
      title: 'New Properties',
      value: ingestResult.created.toString(),
    },
    {
      title: 'Updated',
      value: ingestResult.updated.toString(),
    },
  ];

  const notification = await sendSlackNotification({
    webhook: slackWebhook,
    title: '🏘️ ATTOM Property Discovery - Daily Report',
    message,
    fields,
    color: 'good',
    data: {
      context: `Processed ${stats.totalProperties} properties across ${stats.zipsProcessed} ZIP codes | Min Score: ${minScore}`,
    },
  });

  if (!notification.success) {
    logger.error(
      `Failed to send discovery notification to ${stats.userName}`,
      notification.error
    );
    return false;
  }

  logger.info(`Discovery notification sent to ${stats.userName}`);
  return true;
}

/**
 * Execute the workflow
 */
if (require.main === module) {
  attomPropertyDiscovery()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { attomPropertyDiscovery };
