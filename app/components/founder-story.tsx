'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Quote } from 'lucide-react';

export function FounderStory() {
  const founderName = process.env.NEXT_PUBLIC_FOUNDER_NAME || 'Elijah Sullivan';

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Card className="p-8 lg:p-12 relative overflow-hidden">
            <Quote className="absolute top-4 left-4 h-12 w-12 text-primary/10" />
            <Quote className="absolute bottom-4 right-4 h-12 w-12 text-primary/10 rotate-180" />
            
            <div className="relative z-10">
              <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-center text-foreground">
                From One Investor to Another
              </h2>
              
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                I flip houses too. After blowing budgets and bleeding interest while waiting on contractors and draws, 
                I built automations to stop the leaks. Now I deploy the same playbook for other investors so you can 
                find more deals and keep more profit.
              </p>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Every automation we build comes from real pain points I&apos;ve experienced firsthand. No theory, 
                no guesswork — just battle-tested solutions that actually move the needle.
              </p>
              
              <div className="text-center">
                <p className="font-semibold text-lg">— {founderName}</p>
                <p className="text-sm text-muted-foreground mt-1">Active Investor & Automation Expert</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}