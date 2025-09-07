'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { dealFlowFeatures, operationsFeatures } from '@/app/data/features';

export function FeatureGrid() {
  return (
    <>
      {/* Deal Flow Section */}
      <section id="deal-flow" className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Deal-Flow Automations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop missing deals. Our AI analyzes every lead instantly so you can focus on the winners.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dealFlowFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Operations Section */}
      <section id="operations" className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Operations Automations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Keep projects on time and on budget. Stop bleeding cash on interest and utilities.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {operationsFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 mb-4">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}