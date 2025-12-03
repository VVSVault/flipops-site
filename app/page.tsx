// Force static rendering to trigger CSS extraction
export const dynamic = 'force-static';
export const revalidate = false;

import { Header } from './components/header';
import { Hero } from './components/hero';
import { KPICards } from './components/kpi-cards';
import { FeatureGrid } from './components/feature-grid';
import { CaseStudies } from './components/case-studies';
import { ROICalculator } from './components/roi-calculator';
import { FounderStory } from './components/founder-story';
import { Process } from './components/process';
import { FAQs } from './components/faqs';
import { FinalCTA } from './components/final-cta';
import { Footer } from './components/footer';
import { Toaster } from 'sonner';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <KPICards />
        <FeatureGrid />
        <CaseStudies />
        <ROICalculator />
        <FounderStory />
        <Process />
        <FAQs />
        <FinalCTA />
      </main>
      <Footer />
      <Toaster position="bottom-right" />
    </>
  );
}
