// Comprehensive seed data for Vendors module

export interface Vendor {
  id: string;
  name: string;
  categories: string[];
  phone: string;
  email: string;
  website?: string;
  locationCity: string;
  locationState: string;
  zip: string;
  description: string;
  logoUrl?: string;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  availabilityStatus: 'available' | 'limited' | 'booked' | 'unknown';
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  currency: string;
  tags: string[];
  insuranceExpiry?: Date;
  licenseExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface VendorDocument {
  id: string;
  vendorId: string;
  docType: 'insurance_cert' | 'business_license' | 'w9' | 'certification' | 'other';
  fileUrl: string;
  fileName: string;
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing';
  expiryDate?: Date;
  uploadedAt: Date;
}

export interface VendorReview {
  id: string;
  vendorId: string;
  authorUserId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  projectId?: string;
  projectName?: string;
  attachments?: string[];
  createdAt: Date;
}

export interface VendorAvailability {
  id: string;
  vendorId: string;
  date: Date;
  status: 'free' | 'busy' | 'tentative' | 'unknown';
  source: 'manual' | 'google_calendar' | 'outlook' | 'ical' | 'import';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  locationCity: string;
  locationState: string;
  budgetMin: number;
  budgetMax: number;
  startDate: Date;
  dueDate: Date;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdByUserId: string;
  createdAt: Date;
}

export interface ProjectVendorMap {
  id: string;
  projectId: string;
  vendorId: string;
  role: string;
  selectionStatus: 'recommended' | 'invited' | 'shortlisted' | 'hired' | 'declined' | 'not_selected';
  quotedAmount?: number;
  contractId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorContract {
  id: string;
  vendorId: string;
  projectId: string;
  status: 'draft' | 'sent' | 'signed' | 'cancelled';
  fileUrl: string;
  amount: number;
  signedAt?: Date;
  createdAt: Date;
}

export interface VendorInvoice {
  id: string;
  vendorId: string;
  projectId: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  amount: number;
  currency: string;
  dueDate: Date;
  fileUrl?: string;
  paidAt?: Date;
  createdAt: Date;
}

export interface VendorMessage {
  id: string;
  threadId?: string;
  vendorId: string;
  projectId?: string;
  senderType: 'user' | 'vendor' | 'system';
  senderName: string;
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface VendorMatchEvent {
  id: string;
  projectId: string;
  vendorId: string;
  score: number;
  factors: {
    rating: number;
    proximity: number;
    availability: number;
    categoryMatch: number;
    priceFit: number;
  };
  createdAt: Date;
}

// Seed Data
const now = new Date();
const dayMs = 24 * 60 * 60 * 1000;

// Categories
export const categories: VendorCategory[] = [
  { id: 'CAT-001', name: 'Roofing', slug: 'roofing', icon: 'Home' },
  { id: 'CAT-002', name: 'Plumbing', slug: 'plumbing', icon: 'Droplet' },
  { id: 'CAT-003', name: 'Electrical', slug: 'electrical', icon: 'Zap' },
  { id: 'CAT-004', name: 'HVAC', slug: 'hvac', icon: 'Wind' },
  { id: 'CAT-005', name: 'Landscaping', slug: 'landscaping', icon: 'Trees' },
  { id: 'CAT-006', name: 'General Contractor', slug: 'general-contractor', icon: 'HardHat' },
  { id: 'CAT-007', name: 'Painting', slug: 'painting', icon: 'Paintbrush' },
  { id: 'CAT-008', name: 'Flooring', slug: 'flooring', icon: 'Square' },
];

// 12 Vendors with mix of ratings and statuses
export const vendors: Vendor[] = [
  {
    id: 'VND-001',
    name: 'Acme Roofing Solutions',
    categories: ['roofing', 'general-contractor'],
    phone: '(555) 123-4567',
    email: 'contact@acmeroofing.com',
    website: 'https://acmeroofing.com',
    locationCity: 'Phoenix',
    locationState: 'AZ',
    zip: '85001',
    description: 'Professional roofing services with 20+ years experience. Specializing in residential and commercial roofing.',
    logoUrl: '/logos/acme-roofing.png',
    ratingAvg: 4.8,
    ratingCount: 120,
    isVerified: true,
    availabilityStatus: 'available',
    hourlyRateMin: 85,
    hourlyRateMax: 150,
    currency: 'USD',
    tags: ['licensed', 'insured', 'emergency-service', '24/7'],
    insuranceExpiry: new Date(now.getTime() + 180 * dayMs), // 6 months
    licenseExpiry: new Date(now.getTime() + 365 * dayMs),
    createdAt: new Date(now.getTime() - 730 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-002',
    name: 'Blue Wave Plumbing',
    categories: ['plumbing'],
    phone: '(555) 234-5678',
    email: 'service@bluewaveplumbing.com',
    website: 'https://bluewaveplumbing.com',
    locationCity: 'Scottsdale',
    locationState: 'AZ',
    zip: '85250',
    description: 'Full-service plumbing contractor. Water heaters, leak detection, drain cleaning, and emergency repairs.',
    ratingAvg: 4.6,
    ratingCount: 89,
    isVerified: true,
    availabilityStatus: 'limited',
    hourlyRateMin: 75,
    hourlyRateMax: 125,
    currency: 'USD',
    tags: ['licensed', 'insured', 'same-day-service'],
    insuranceExpiry: new Date(now.getTime() + 30 * dayMs), // Expiring soon
    licenseExpiry: new Date(now.getTime() + 200 * dayMs),
    createdAt: new Date(now.getTime() - 500 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-003',
    name: 'Lightning Electric Co',
    categories: ['electrical'],
    phone: '(555) 345-6789',
    email: 'info@lightningelectric.com',
    locationCity: 'Phoenix',
    locationState: 'AZ',
    zip: '85003',
    description: 'Residential and commercial electrical services. Panel upgrades, rewiring, smart home installation.',
    ratingAvg: 4.9,
    ratingCount: 156,
    isVerified: true,
    availabilityStatus: 'available',
    hourlyRateMin: 90,
    hourlyRateMax: 140,
    currency: 'USD',
    tags: ['licensed', 'insured', 'tesla-certified', 'smart-home'],
    insuranceExpiry: new Date(now.getTime() - 10 * dayMs), // Expired
    licenseExpiry: new Date(now.getTime() + 300 * dayMs),
    createdAt: new Date(now.getTime() - 900 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-004',
    name: 'Cool Breeze HVAC',
    categories: ['hvac'],
    phone: '(555) 456-7890',
    email: 'schedule@coolbreezehvac.com',
    website: 'https://coolbreezehvac.com',
    locationCity: 'Mesa',
    locationState: 'AZ',
    zip: '85201',
    description: 'HVAC installation, repair, and maintenance. Energy-efficient solutions and 24/7 emergency service.',
    ratingAvg: 4.7,
    ratingCount: 98,
    isVerified: true,
    availabilityStatus: 'available',
    hourlyRateMin: 80,
    hourlyRateMax: 130,
    currency: 'USD',
    tags: ['licensed', 'insured', 'energy-star', 'emergency-service'],
    insuranceExpiry: new Date(now.getTime() + 90 * dayMs),
    licenseExpiry: new Date(now.getTime() + 400 * dayMs),
    createdAt: new Date(now.getTime() - 600 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-005',
    name: 'Desert Bloom Landscaping',
    categories: ['landscaping'],
    phone: '(555) 567-8901',
    email: 'info@desertbloom.com',
    locationCity: 'Tempe',
    locationState: 'AZ',
    zip: '85281',
    description: 'Custom landscape design, installation, and maintenance. Xeriscaping specialists.',
    ratingAvg: 4.5,
    ratingCount: 67,
    isVerified: false,
    availabilityStatus: 'booked',
    hourlyRateMin: 50,
    hourlyRateMax: 85,
    currency: 'USD',
    tags: ['insured', 'xeriscaping', 'irrigation'],
    insuranceExpiry: new Date(now.getTime() + 120 * dayMs),
    createdAt: new Date(now.getTime() - 400 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-006',
    name: 'ProBuild General Contractors',
    categories: ['general-contractor', 'roofing', 'flooring'],
    phone: '(555) 678-9012',
    email: 'projects@probuildgc.com',
    website: 'https://probuildgc.com',
    locationCity: 'Phoenix',
    locationState: 'AZ',
    zip: '85004',
    description: 'Full-service general contracting. New construction, renovations, and commercial projects.',
    ratingAvg: 4.4,
    ratingCount: 45,
    isVerified: true,
    availabilityStatus: 'limited',
    hourlyRateMin: 100,
    hourlyRateMax: 200,
    currency: 'USD',
    tags: ['licensed', 'insured', 'bonded', 'commercial'],
    insuranceExpiry: new Date(now.getTime() + 250 * dayMs),
    licenseExpiry: new Date(now.getTime() + 500 * dayMs),
    createdAt: new Date(now.getTime() - 800 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-007',
    name: 'Precision Painting Plus',
    categories: ['painting'],
    phone: '(555) 789-0123',
    email: 'quote@precisionpainting.com',
    locationCity: 'Chandler',
    locationState: 'AZ',
    zip: '85224',
    description: 'Interior and exterior painting. Cabinet refinishing and decorative finishes.',
    ratingAvg: 4.2,
    ratingCount: 34,
    isVerified: false,
    availabilityStatus: 'available',
    hourlyRateMin: 45,
    hourlyRateMax: 75,
    currency: 'USD',
    tags: ['insured', 'eco-friendly', 'cabinet-refinishing'],
    insuranceExpiry: new Date(now.getTime() + 45 * dayMs), // Expiring soon
    createdAt: new Date(now.getTime() - 300 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-008',
    name: 'Elite Flooring Solutions',
    categories: ['flooring'],
    phone: '(555) 890-1234',
    email: 'sales@eliteflooring.com',
    locationCity: 'Gilbert',
    locationState: 'AZ',
    zip: '85295',
    description: 'Hardwood, tile, carpet, and luxury vinyl installation. Floor refinishing and repair.',
    ratingAvg: 4.3,
    ratingCount: 28,
    isVerified: true,
    availabilityStatus: 'available',
    hourlyRateMin: 60,
    hourlyRateMax: 100,
    currency: 'USD',
    tags: ['licensed', 'insured', 'showroom'],
    insuranceExpiry: new Date(now.getTime() + 200 * dayMs),
    licenseExpiry: new Date(now.getTime() + 350 * dayMs),
    createdAt: new Date(now.getTime() - 450 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-009',
    name: 'New Horizon Roofing',
    categories: ['roofing'],
    phone: '(555) 901-2345',
    email: 'info@newhorizonroofing.com',
    locationCity: 'Las Vegas',
    locationState: 'NV',
    zip: '89101',
    description: 'Residential roofing specialist. Shingle, tile, and flat roof systems.',
    ratingAvg: 3.8,
    ratingCount: 12,
    isVerified: false,
    availabilityStatus: 'unknown',
    hourlyRateMin: 70,
    hourlyRateMax: 110,
    currency: 'USD',
    tags: ['insured', 'residential'],
    insuranceExpiry: new Date(now.getTime() - 30 * dayMs), // Expired
    createdAt: new Date(now.getTime() - 200 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-010',
    name: 'QuickFix Plumbing',
    categories: ['plumbing'],
    phone: '(555) 012-3456',
    email: 'service@quickfixplumbing.com',
    locationCity: 'Phoenix',
    locationState: 'AZ',
    zip: '85007',
    description: 'Emergency plumbing services. Available 24/7 for urgent repairs.',
    ratingAvg: 0,
    ratingCount: 0, // No reviews yet
    isVerified: false,
    availabilityStatus: 'available',
    hourlyRateMin: 65,
    hourlyRateMax: 95,
    currency: 'USD',
    tags: ['24/7', 'emergency-service'],
    createdAt: new Date(now.getTime() - 30 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-011',
    name: 'Spark Masters Electric',
    categories: ['electrical'],
    phone: '(555) 123-4567',
    email: 'contact@sparkmasters.com',
    locationCity: 'Tucson',
    locationState: 'AZ',
    zip: '85701',
    description: 'Commercial and industrial electrical services. Generator installation and maintenance.',
    ratingAvg: 4.6,
    ratingCount: 78,
    isVerified: true,
    availabilityStatus: 'limited',
    hourlyRateMin: 95,
    hourlyRateMax: 160,
    currency: 'USD',
    tags: ['licensed', 'insured', 'commercial', 'industrial'],
    insuranceExpiry: new Date(now.getTime() + 15 * dayMs), // Expiring soon
    licenseExpiry: new Date(now.getTime() + 280 * dayMs),
    createdAt: new Date(now.getTime() - 650 * dayMs),
    updatedAt: now,
  },
  {
    id: 'VND-012',
    name: 'Green Thumb Gardens',
    categories: ['landscaping'],
    phone: '(555) 234-5678',
    email: 'hello@greenthumbgardens.com',
    locationCity: 'Phoenix',
    locationState: 'AZ',
    zip: '85008',
    description: 'Organic gardening and sustainable landscaping. Native plant specialists.',
    ratingAvg: 0,
    ratingCount: 0, // No reviews yet
    isVerified: false,
    availabilityStatus: 'available',
    hourlyRateMin: 40,
    hourlyRateMax: 70,
    currency: 'USD',
    tags: ['organic', 'sustainable', 'native-plants'],
    createdAt: new Date(now.getTime() - 60 * dayMs),
    updatedAt: now,
  },
];

// Reviews
export const reviews: VendorReview[] = [
  // Acme Roofing - multiple reviews
  {
    id: 'REV-001',
    vendorId: 'VND-001',
    authorUserId: 'USR-001',
    authorName: 'John Smith',
    rating: 5,
    title: 'Excellent work on our roof replacement',
    comment: 'Acme Roofing did an outstanding job replacing our entire roof. Professional, on-time, and clean work site. Highly recommend!',
    projectId: 'PRJ-001',
    projectName: '123 Main St Roof Replacement',
    createdAt: new Date(now.getTime() - 30 * dayMs),
  },
  {
    id: 'REV-002',
    vendorId: 'VND-001',
    authorUserId: 'USR-002',
    authorName: 'Sarah Johnson',
    rating: 4,
    title: 'Good service, slightly over budget',
    comment: 'Quality work but came in about 10% over initial estimate due to unexpected repairs. Still satisfied overall.',
    projectId: 'PRJ-002',
    projectName: '456 Oak Ave Repair',
    createdAt: new Date(now.getTime() - 60 * dayMs),
  },
  {
    id: 'REV-003',
    vendorId: 'VND-001',
    authorUserId: 'USR-003',
    authorName: 'Mike Davis',
    rating: 5,
    title: 'Emergency repair saved the day',
    comment: 'Had a major leak during monsoon season. They came out same day and fixed it. Lifesavers!',
    createdAt: new Date(now.getTime() - 90 * dayMs),
  },
  // Lightning Electric - high rated
  {
    id: 'REV-004',
    vendorId: 'VND-003',
    authorUserId: 'USR-004',
    authorName: 'Emily Chen',
    rating: 5,
    title: 'Professional and knowledgeable',
    comment: 'Upgraded our electrical panel and installed Tesla charger. Very professional and explained everything clearly.',
    projectId: 'PRJ-003',
    projectName: 'Panel Upgrade & EV Charger',
    attachments: ['/attachments/panel-before.jpg', '/attachments/panel-after.jpg'],
    createdAt: new Date(now.getTime() - 45 * dayMs),
  },
  // Cool Breeze HVAC
  {
    id: 'REV-005',
    vendorId: 'VND-004',
    authorUserId: 'USR-005',
    authorName: 'Robert Wilson',
    rating: 5,
    title: 'New AC installation went smoothly',
    comment: 'Replaced our 20-year-old AC unit. Great communication throughout the process and very clean installation.',
    projectId: 'PRJ-004',
    projectName: 'AC Replacement',
    createdAt: new Date(now.getTime() - 20 * dayMs),
  },
  // Desert Bloom Landscaping
  {
    id: 'REV-006',
    vendorId: 'VND-005',
    authorUserId: 'USR-006',
    authorName: 'Lisa Martinez',
    rating: 4,
    title: 'Beautiful xeriscaping design',
    comment: 'Transformed our water-hungry lawn into a beautiful desert landscape. Took longer than expected but results are great.',
    createdAt: new Date(now.getTime() - 75 * dayMs),
  },
  // New Horizon Roofing - lower rated
  {
    id: 'REV-007',
    vendorId: 'VND-009',
    authorUserId: 'USR-007',
    authorName: 'Tom Anderson',
    rating: 3,
    title: 'Average work, poor communication',
    comment: 'Job was completed but had to call multiple times for updates. Work quality was okay but not great.',
    createdAt: new Date(now.getTime() - 40 * dayMs),
  },
];

// Documents
export const documents: VendorDocument[] = [
  // Acme Roofing - all valid
  {
    id: 'DOC-001',
    vendorId: 'VND-001',
    docType: 'insurance_cert',
    fileUrl: '/docs/acme-insurance-2024.pdf',
    fileName: 'General Liability Insurance Certificate',
    status: 'valid',
    expiryDate: new Date(now.getTime() + 180 * dayMs),
    uploadedAt: new Date(now.getTime() - 30 * dayMs),
  },
  {
    id: 'DOC-002',
    vendorId: 'VND-001',
    docType: 'business_license',
    fileUrl: '/docs/acme-license-2024.pdf',
    fileName: 'AZ ROC License #123456',
    status: 'valid',
    expiryDate: new Date(now.getTime() + 365 * dayMs),
    uploadedAt: new Date(now.getTime() - 30 * dayMs),
  },
  // Blue Wave Plumbing - expiring soon
  {
    id: 'DOC-003',
    vendorId: 'VND-002',
    docType: 'insurance_cert',
    fileUrl: '/docs/bluewave-insurance.pdf',
    fileName: 'General Liability Insurance',
    status: 'expiring_soon',
    expiryDate: new Date(now.getTime() + 30 * dayMs),
    uploadedAt: new Date(now.getTime() - 60 * dayMs),
  },
  // Lightning Electric - expired insurance
  {
    id: 'DOC-004',
    vendorId: 'VND-003',
    docType: 'insurance_cert',
    fileUrl: '/docs/lightning-insurance-expired.pdf',
    fileName: 'General Liability Insurance',
    status: 'expired',
    expiryDate: new Date(now.getTime() - 10 * dayMs),
    uploadedAt: new Date(now.getTime() - 200 * dayMs),
  },
  {
    id: 'DOC-005',
    vendorId: 'VND-003',
    docType: 'business_license',
    fileUrl: '/docs/lightning-license.pdf',
    fileName: 'Electrical Contractor License',
    status: 'valid',
    expiryDate: new Date(now.getTime() + 300 * dayMs),
    uploadedAt: new Date(now.getTime() - 100 * dayMs),
  },
  // Spark Masters - expiring soon
  {
    id: 'DOC-006',
    vendorId: 'VND-011',
    docType: 'insurance_cert',
    fileUrl: '/docs/spark-insurance.pdf',
    fileName: 'Commercial General Liability',
    status: 'expiring_soon',
    expiryDate: new Date(now.getTime() + 15 * dayMs),
    uploadedAt: new Date(now.getTime() - 90 * dayMs),
  },
  // New Horizon - expired
  {
    id: 'DOC-007',
    vendorId: 'VND-009',
    docType: 'insurance_cert',
    fileUrl: '/docs/newhorizon-insurance.pdf',
    fileName: 'General Liability Insurance',
    status: 'expired',
    expiryDate: new Date(now.getTime() - 30 * dayMs),
    uploadedAt: new Date(now.getTime() - 180 * dayMs),
  },
];

// Generate availability for next 6 weeks
export const generateAvailability = (): VendorAvailability[] => {
  const availability: VendorAvailability[] = [];
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  vendors.forEach(vendor => {
    for (let i = 0; i < 42; i++) { // 6 weeks
      const date = new Date(startDate.getTime() + i * dayMs);
      const dayOfWeek = date.getDay();
      
      let status: VendorAvailability['status'] = 'free';
      
      // Create patterns based on vendor
      if (vendor.availabilityStatus === 'booked') {
        status = 'busy';
      } else if (vendor.availabilityStatus === 'limited') {
        // Limited availability - only Tue/Thu
        status = (dayOfWeek === 2 || dayOfWeek === 4) ? 'free' : 'busy';
      } else if (vendor.availabilityStatus === 'available') {
        // Available most days, busy on some
        if (dayOfWeek === 0) status = 'busy'; // Sundays busy
        else if (Math.random() < 0.2) status = 'tentative'; // 20% tentative
      } else {
        // Unknown - sparse data
        status = Math.random() < 0.3 ? 'free' : 'unknown';
      }
      
      availability.push({
        id: `AVL-${vendor.id}-${i}`,
        vendorId: vendor.id,
        date,
        status,
        source: vendor.id === 'VND-001' ? 'google_calendar' : 'manual',
      });
    }
  });
  
  return availability;
};

// Projects
export const projects: Project[] = [
  {
    id: 'PRJ-001',
    title: '123 Main St Roof Replacement',
    description: 'Complete roof replacement for 2,500 sq ft home. Remove old shingles, repair decking as needed, install new architectural shingles.',
    locationCity: 'Phoenix',
    locationState: 'AZ',
    budgetMin: 8000,
    budgetMax: 12000,
    startDate: new Date(now.getTime() - 45 * dayMs),
    dueDate: new Date(now.getTime() - 30 * dayMs),
    status: 'completed',
    createdByUserId: 'USR-001',
    createdAt: new Date(now.getTime() - 60 * dayMs),
  },
  {
    id: 'PRJ-002',
    title: '456 Oak Ave Roof Repair',
    description: 'Repair storm damage to roof. Replace damaged shingles and flashing around chimney.',
    locationCity: 'Scottsdale',
    locationState: 'AZ',
    budgetMin: 2000,
    budgetMax: 4000,
    startDate: new Date(now.getTime() - 20 * dayMs),
    dueDate: new Date(now.getTime() - 10 * dayMs),
    status: 'completed',
    createdByUserId: 'USR-002',
    createdAt: new Date(now.getTime() - 30 * dayMs),
  },
  {
    id: 'PRJ-003',
    title: 'Panel Upgrade & EV Charger',
    description: 'Upgrade electrical panel from 100A to 200A and install Tesla wall charger in garage.',
    locationCity: 'Phoenix',
    locationState: 'AZ',
    budgetMin: 3500,
    budgetMax: 5000,
    startDate: new Date(now.getTime() + 7 * dayMs),
    dueDate: new Date(now.getTime() + 14 * dayMs),
    status: 'active',
    createdByUserId: 'USR-004',
    createdAt: new Date(now.getTime() - 5 * dayMs),
  },
  {
    id: 'PRJ-004',
    title: 'AC Replacement',
    description: 'Replace 5-ton AC unit and air handler. Include new thermostat and duct inspection.',
    locationCity: 'Mesa',
    locationState: 'AZ',
    budgetMin: 6000,
    budgetMax: 9000,
    startDate: new Date(now.getTime() + 3 * dayMs),
    dueDate: new Date(now.getTime() + 7 * dayMs),
    status: 'planning',
    createdByUserId: 'USR-005',
    createdAt: new Date(now.getTime() - 2 * dayMs),
  },
];

// Project-Vendor Mappings
export const projectVendorMaps: ProjectVendorMap[] = [
  // Project 1 - Roof Replacement (completed)
  {
    id: 'PVM-001',
    projectId: 'PRJ-001',
    vendorId: 'VND-001', // Acme Roofing
    role: 'Primary Contractor',
    selectionStatus: 'hired',
    quotedAmount: 10500,
    contractId: 'CON-001',
    createdAt: new Date(now.getTime() - 55 * dayMs),
    updatedAt: new Date(now.getTime() - 30 * dayMs),
  },
  {
    id: 'PVM-002',
    projectId: 'PRJ-001',
    vendorId: 'VND-006', // ProBuild
    role: 'General Contractor',
    selectionStatus: 'declined',
    quotedAmount: 11800,
    createdAt: new Date(now.getTime() - 55 * dayMs),
    updatedAt: new Date(now.getTime() - 50 * dayMs),
  },
  {
    id: 'PVM-003',
    projectId: 'PRJ-001',
    vendorId: 'VND-009', // New Horizon
    role: 'Roofing',
    selectionStatus: 'not_selected',
    quotedAmount: 8500,
    createdAt: new Date(now.getTime() - 55 * dayMs),
    updatedAt: new Date(now.getTime() - 50 * dayMs),
  },
  // Project 2 - Roof Repair (completed)
  {
    id: 'PVM-004',
    projectId: 'PRJ-002',
    vendorId: 'VND-001', // Acme Roofing
    role: 'Roofing Contractor',
    selectionStatus: 'hired',
    quotedAmount: 3200,
    contractId: 'CON-002',
    createdAt: new Date(now.getTime() - 25 * dayMs),
    updatedAt: new Date(now.getTime() - 10 * dayMs),
  },
  // Project 3 - Electrical (active)
  {
    id: 'PVM-005',
    projectId: 'PRJ-003',
    vendorId: 'VND-003', // Lightning Electric
    role: 'Electrical Contractor',
    selectionStatus: 'shortlisted',
    quotedAmount: 4200,
    createdAt: new Date(now.getTime() - 4 * dayMs),
    updatedAt: new Date(now.getTime() - 1 * dayMs),
  },
  {
    id: 'PVM-006',
    projectId: 'PRJ-003',
    vendorId: 'VND-011', // Spark Masters
    role: 'Electrical Contractor',
    selectionStatus: 'invited',
    quotedAmount: 4500,
    createdAt: new Date(now.getTime() - 4 * dayMs),
    updatedAt: new Date(now.getTime() - 2 * dayMs),
  },
  // Project 4 - AC (planning)
  {
    id: 'PVM-007',
    projectId: 'PRJ-004',
    vendorId: 'VND-004', // Cool Breeze
    role: 'HVAC Contractor',
    selectionStatus: 'recommended',
    createdAt: new Date(now.getTime() - 1 * dayMs),
    updatedAt: new Date(now.getTime() - 1 * dayMs),
  },
];

// Contracts
export const contracts: VendorContract[] = [
  {
    id: 'CON-001',
    vendorId: 'VND-001',
    projectId: 'PRJ-001',
    status: 'signed',
    fileUrl: '/contracts/con-001-signed.pdf',
    amount: 10500,
    signedAt: new Date(now.getTime() - 44 * dayMs),
    createdAt: new Date(now.getTime() - 50 * dayMs),
  },
  {
    id: 'CON-002',
    vendorId: 'VND-001',
    projectId: 'PRJ-002',
    status: 'signed',
    fileUrl: '/contracts/con-002-signed.pdf',
    amount: 3200,
    signedAt: new Date(now.getTime() - 19 * dayMs),
    createdAt: new Date(now.getTime() - 24 * dayMs),
  },
  {
    id: 'CON-003',
    vendorId: 'VND-003',
    projectId: 'PRJ-003',
    status: 'sent',
    fileUrl: '/contracts/con-003-draft.pdf',
    amount: 4200,
    createdAt: new Date(now.getTime() - 2 * dayMs),
  },
];

// Invoices
export const invoices: VendorInvoice[] = [
  {
    id: 'INV-001',
    vendorId: 'VND-001',
    projectId: 'PRJ-001',
    invoiceNumber: 'ACM-2024-001',
    status: 'paid',
    amount: 10500,
    currency: 'USD',
    dueDate: new Date(now.getTime() - 15 * dayMs),
    fileUrl: '/invoices/inv-001.pdf',
    paidAt: new Date(now.getTime() - 20 * dayMs),
    createdAt: new Date(now.getTime() - 30 * dayMs),
  },
  {
    id: 'INV-002',
    vendorId: 'VND-001',
    projectId: 'PRJ-002',
    invoiceNumber: 'ACM-2024-002',
    status: 'sent',
    amount: 3200,
    currency: 'USD',
    dueDate: new Date(now.getTime() + 5 * dayMs),
    fileUrl: '/invoices/inv-002.pdf',
    createdAt: new Date(now.getTime() - 5 * dayMs),
  },
  {
    id: 'INV-003',
    vendorId: 'VND-003',
    projectId: 'PRJ-003',
    invoiceNumber: 'LE-2024-047',
    status: 'draft',
    amount: 4200,
    currency: 'USD',
    dueDate: new Date(now.getTime() + 30 * dayMs),
    createdAt: now,
  },
];

// Messages
export const messages: VendorMessage[] = [
  {
    id: 'MSG-001',
    threadId: 'THR-001',
    vendorId: 'VND-001',
    projectId: 'PRJ-001',
    senderType: 'user',
    senderName: 'John Smith',
    message: 'Hi, we need the roof replacement done before the monsoon season. Can you start next week?',
    createdAt: new Date(now.getTime() - 58 * dayMs),
  },
  {
    id: 'MSG-002',
    threadId: 'THR-001',
    vendorId: 'VND-001',
    projectId: 'PRJ-001',
    senderType: 'vendor',
    senderName: 'Acme Roofing',
    message: 'Yes, we can start Monday. I\'ll send over the contract today for your review.',
    createdAt: new Date(now.getTime() - 57 * dayMs),
  },
  {
    id: 'MSG-003',
    threadId: 'THR-001',
    vendorId: 'VND-001',
    projectId: 'PRJ-001',
    senderType: 'system',
    senderName: 'System',
    message: 'Contract CON-001 has been created and sent for signature.',
    createdAt: new Date(now.getTime() - 50 * dayMs),
  },
  {
    id: 'MSG-004',
    vendorId: 'VND-003',
    projectId: 'PRJ-003',
    senderType: 'user',
    senderName: 'Emily Chen',
    message: 'Can you also run a dedicated circuit for the Tesla charger?',
    createdAt: new Date(now.getTime() - 3 * dayMs),
  },
  {
    id: 'MSG-005',
    vendorId: 'VND-003',
    projectId: 'PRJ-003',
    senderType: 'vendor',
    senderName: 'Lightning Electric',
    message: 'Yes, that\'s included in the quote. We\'ll run a 60-amp circuit directly from the new panel.',
    attachments: ['/attachments/tesla-charger-specs.pdf'],
    createdAt: new Date(now.getTime() - 2 * dayMs),
  },
];

// Match Events (for recommendations)
export const matchEvents: VendorMatchEvent[] = [
  {
    id: 'MATCH-001',
    projectId: 'PRJ-004',
    vendorId: 'VND-004',
    score: 0.92,
    factors: {
      rating: 0.94,
      proximity: 1.0,
      availability: 1.0,
      categoryMatch: 1.0,
      priceFit: 0.85,
    },
    createdAt: new Date(now.getTime() - 1 * dayMs),
  },
];

// Vendor matching logic
export const calculateVendorMatch = (
  vendor: Vendor,
  project: Project,
  availability: VendorAvailability[]
): VendorMatchEvent['factors'] & { totalScore: number } => {
  // Category match (0.35 weight)
  let categoryMatch = 0;
  if (project.title.toLowerCase().includes('roof') && vendor.categories.includes('roofing')) {
    categoryMatch = 1.0;
  } else if (project.title.toLowerCase().includes('electric') && vendor.categories.includes('electrical')) {
    categoryMatch = 1.0;
  } else if (project.title.toLowerCase().includes('ac') || project.title.toLowerCase().includes('hvac')) {
    if (vendor.categories.includes('hvac')) categoryMatch = 1.0;
  } else if (vendor.categories.includes('general-contractor')) {
    categoryMatch = 0.7; // GC can handle most projects
  }
  
  // Rating (0.25 weight) - normalized with review count consideration
  const ratingScore = vendor.ratingCount > 0 
    ? (vendor.ratingAvg / 5) * Math.min(1, Math.log(1 + vendor.ratingCount) / 5)
    : 0.3; // New vendors get a small boost
  
  // Availability (0.2 weight)
  const projectDays = Math.ceil((project.dueDate.getTime() - project.startDate.getTime()) / dayMs);
  const vendorAvailability = availability.filter(a => 
    a.vendorId === vendor.id &&
    a.date >= project.startDate &&
    a.date <= project.dueDate
  );
  const freeDays = vendorAvailability.filter(a => a.status === 'free').length;
  const availabilityScore = freeDays / Math.max(projectDays, 1);
  
  // Proximity (0.1 weight)
  let proximityScore = 0.3; // Default for out of state
  if (vendor.locationCity === project.locationCity && vendor.locationState === project.locationState) {
    proximityScore = 1.0;
  } else if (vendor.locationState === project.locationState) {
    proximityScore = 0.6;
  }
  
  // Price fit (0.1 weight)
  let priceFit = 0.5; // Default if no rate info
  if (vendor.hourlyRateMin && vendor.hourlyRateMax) {
    const vendorMidRate = (vendor.hourlyRateMin + vendor.hourlyRateMax) / 2;
    const projectMidBudget = (project.budgetMin + project.budgetMax) / 2;
    const estimatedHours = projectMidBudget / 100; // Rough estimate
    const vendorEstimate = vendorMidRate * estimatedHours;
    
    if (vendorEstimate <= project.budgetMax && vendorEstimate >= project.budgetMin) {
      priceFit = 1.0;
    } else if (vendorEstimate < project.budgetMin) {
      priceFit = 0.8; // Might be too cheap/low quality
    } else if (vendorEstimate <= project.budgetMax * 1.2) {
      priceFit = 0.6; // Slightly over budget
    } else {
      priceFit = 0.2; // Way over budget
    }
  }
  
  // Calculate weighted total
  const totalScore = 
    categoryMatch * 0.35 +
    ratingScore * 0.25 +
    availabilityScore * 0.2 +
    proximityScore * 0.1 +
    priceFit * 0.1;
  
  return {
    categoryMatch,
    rating: ratingScore,
    availability: availabilityScore,
    proximity: proximityScore,
    priceFit,
    totalScore,
  };
};

// Export all seed data
export const vendorsSeedData = {
  vendors,
  categories,
  documents,
  reviews,
  availability: generateAvailability(),
  projects,
  projectVendorMaps,
  contracts,
  invoices,
  messages,
  matchEvents,
  calculateVendorMatch,
};