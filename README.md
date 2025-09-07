# FlipOps - Real Estate Investor Automation Platform

A high-converting, single-page marketing site for FlipOps - automation services tailored for real estate investors and house flippers.

## Features

- **Modern Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS v4
- **Component Library**: shadcn/ui components with custom theming
- **Animations**: Smooth Framer Motion animations throughout
- **ROI Calculator**: Interactive tool to demonstrate value proposition
- **Lead Capture**: API integration with CRM webhooks and email notifications
- **SEO Optimized**: Full metadata, Open Graph, and structured data support
- **Performance**: Optimized for Core Web Vitals with lazy loading
- **Responsive**: Mobile-first design that works on all devices

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flipops-site.git
cd flipops-site

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Brand configuration
NEXT_PUBLIC_BRAND_NAME=FlipOps
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-slug/automation-audit
NEXT_PUBLIC_CRM_WEBHOOK_URL=https://your-crm-endpoint.com/webhook

# Resend Email API Key (for sending notifications)
RESEND_API_KEY=re_your_api_key

# Founder info
NEXT_PUBLIC_FOUNDER_NAME=Tanner Carlson
```

## Project Structure

```
flipops-site/
├── app/
│   ├── components/        # React components
│   │   ├── header.tsx     # Sticky navigation
│   │   ├── hero.tsx       # Hero section
│   │   ├── kpi-cards.tsx  # Metrics display
│   │   ├── feature-grid.tsx # Deal flow & operations features
│   │   ├── case-studies.tsx # Portfolio examples with tabs
│   │   ├── roi-calculator.tsx # Interactive calculator
│   │   ├── founder-story.tsx # About section
│   │   ├── process.tsx    # 4-step process timeline
│   │   ├── faqs.tsx       # Accordion FAQs
│   │   ├── final-cta.tsx  # Bottom CTA
│   │   └── footer.tsx     # Site footer
│   ├── data/              # Static data
│   │   ├── features.ts    # Feature lists
│   │   └── faqs.ts        # FAQ content
│   ├── api/
│   │   └── lead/          # Lead capture API
│   ├── globals.css        # Global styles & theme
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Main landing page
├── components/ui/         # shadcn/ui components
├── lib/                   # Utilities
└── public/               # Static assets
```

## Customization

### Brand Colors

Edit the CSS custom properties in `app/globals.css`:

```css
:root {
  --primary: oklch(0.596 0.154 162.243);  /* Green #16a34a */
  --accent: oklch(0.663 0.173 216.618);   /* Blue #0ea5e9 */
}
```

### Copy & Content

- **Features**: Edit `app/data/features.ts`
- **FAQs**: Edit `app/data/faqs.ts`
- **Hero**: Edit `app/components/hero.tsx`
- **Case Studies**: Edit `app/components/case-studies.tsx`

### Integrations

#### Calendly
Replace the Calendly URL in `.env.local` with your actual booking link.

#### CRM Webhook
The lead capture API sends POST requests to your CRM webhook URL with the following payload:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "companySize": "1-5",
  "monthlyDeals": 10,
  "biggestBlocker": "deal-analysis",
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "summer-2024",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "source": "FlipOps Website"
}
```

#### Email Notifications
Configure Resend API key to receive email notifications for new leads.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Performance

Target metrics:
- Lighthouse Performance: 95+
- First Contentful Paint: < 1.2s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.05
- Time to Interactive: < 3.8s

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
npm run type-check # TypeScript check
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact hello@flipops.io

---

Built with ❤️ for real estate investors by real estate investors
