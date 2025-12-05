'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export function FinalCTA() {
  const openCalendly = () => {
    const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '#';
    window.open(calendlyUrl, '_blank');
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">
            Ready to stop leaving money on the table?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join dozens of investors who&apos;ve automated their way to better margins and faster deals.
            The audit is free, and you&apos;ll walk away with actionable insights either way.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={openCalendly} className="group">
              Book Audit
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Watch 3-min Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            No credit card required • Results in 2-3 weeks • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}