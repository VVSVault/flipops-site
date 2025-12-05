'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardPreview } from './dashboard-preview';
import Link from 'next/link';

const benefits = [
  'Lead intake + AI deal analyzer (green/yellow/red in seconds)',
  'Contractor milestone & draw reminders (no more delays)',
  'Utility & interest burn dashboard (see daily drag, act faster)',
];

export function Hero() {
  const openCalendly = () => {
    // This will be implemented with the Calendly integration
    const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '#';
    window.open(calendlyUrl, '_blank');
  };

  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-gray-900 dark:text-white">
              Automation for{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Flippers & Investors
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8">
              Find more deals, analyze faster, and keep projects on budget with a peer who actually flips houses.
            </p>

            <ul className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </motion.li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={openCalendly}>
                Book a Free Automation Audit
              </Button>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">
                  Login to Dashboard
                </Button>
              </Link>
              <Button size="lg" variant="ghost">
                <Play className="h-4 w-4 mr-2" />
                See a 3-min Demo
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <DashboardPreview />
            
            {/* Floating cards animation */}
            <motion.div
              className="absolute -top-4 -right-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 border dark:border-zinc-700 z-10"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <p className="text-sm font-semibold text-primary">+37% More Deals</p>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 border dark:border-zinc-700 z-10"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            >
              <p className="text-sm font-semibold text-accent">-15% Holding Costs</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}