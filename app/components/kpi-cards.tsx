'use client';

import { motion } from 'framer-motion';
import { metrics } from '@/app/data/features';

export function KPICards() {
  return (
    <section className="py-12 bg-muted/30 border-y">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-muted-foreground">
            Built by an active investor
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {metric.value}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}