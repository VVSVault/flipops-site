'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { processSteps } from '@/app/data/features';

export function Process() {
  return (
    <section id="process" className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-foreground">
            Simple Process, Real Results
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From audit to automation in weeks, not months
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Connector line */}
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary to-accent opacity-30" />
                  )}
                  
                  <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-20" />
                        <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent text-white">
                          <span className="font-bold text-lg">{step.step}</span>
                        </div>
                      </div>
                      
                      <Icon className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}