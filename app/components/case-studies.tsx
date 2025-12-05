'use client';

import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { TrendingDown, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

const caseStudies = [
  {
    id: 'project-a',
    title: 'Downtown Flip',
    location: 'Marcus Rodriguez',
    stats: {
      budgetOverrun: { before: 23, after: 3 },
      interestBurn: { before: 850, after: 425 },
      daysOnMarket: { before: 47, after: 28 },
      roi: { before: 18, after: 31 }
    },
    testimonial: 'Caught a $15k budget issue before it became a $40k disaster. Game changer.'
  },
  {
    id: 'project-b',
    title: 'Suburban Rehab',
    location: 'Sarah Chen',
    stats: {
      budgetOverrun: { before: 18, after: 2 },
      interestBurn: { before: 720, after: 380 },
      daysOnMarket: { before: 52, after: 31 },
      roi: { before: 22, after: 34 }
    },
    testimonial: 'Draw packages that used to take 3 days now take 30 minutes.'
  }
];

export function CaseStudies() {
  return (
    <section id="case-study" className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-foreground">
            Real Results from My Portfolio
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how automation transformed actual flips. These aren&apos;t hypotheticals.
          </p>
        </motion.div>

        <Tabs defaultValue="project-a" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            {caseStudies.map((study) => (
              <TabsTrigger key={study.id} value={study.id}>
                {study.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {caseStudies.map((study) => (
            <TabsContent key={study.id} value={study.id}>
              <div className="grid lg:grid-cols-2 gap-8 mt-8">
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Budget Control
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Budget Overrun %</span>
                        <span className="text-sm font-medium">
                          {study.stats.budgetOverrun.before}% → {study.stats.budgetOverrun.after}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-destructive to-primary"
                          initial={{ width: '0%' }}
                          whileInView={{ width: `${100 - study.stats.budgetOverrun.after * 2}%` }}
                          transition={{ duration: 1 }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Automated alerts caught issues {Math.round((study.stats.budgetOverrun.before - study.stats.budgetOverrun.after) / study.stats.budgetOverrun.before * 100)}% faster
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Holding Cost Reduction
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Daily Interest Burn</span>
                        <span className="text-sm font-medium">
                          ${study.stats.interestBurn.before} → ${study.stats.interestBurn.after}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-accent to-primary"
                          initial={{ width: '0%' }}
                          whileInView={{ width: `${100 - (study.stats.interestBurn.after / study.stats.interestBurn.before) * 100}%` }}
                          transition={{ duration: 1 }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Saved ${Math.round((study.stats.interestBurn.before - study.stats.interestBurn.after) * 30)} per month
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    Time to Sale
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Days on Market</span>
                        <span className="text-sm font-medium">
                          {study.stats.daysOnMarket.before} → {study.stats.daysOnMarket.after} days
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          initial={{ width: '0%' }}
                          whileInView={{ width: `${100 - (study.stats.daysOnMarket.after / study.stats.daysOnMarket.before) * 100}%` }}
                          transition={{ duration: 1 }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {study.stats.daysOnMarket.before - study.stats.daysOnMarket.after} fewer days of carrying costs
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-primary" />
                    ROI Improvement
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Return on Investment</span>
                        <span className="text-sm font-medium">
                          {study.stats.roi.before}% → {study.stats.roi.after}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          initial={{ width: '0%' }}
                          whileInView={{ width: `${(study.stats.roi.after / 50) * 100}%` }}
                          transition={{ duration: 1 }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      +{study.stats.roi.after - study.stats.roi.before}% ROI improvement
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="mt-8 p-6 bg-muted/30">
                <p className="text-lg italic text-center">
                  &ldquo;{study.testimonial}&rdquo;
                </p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  — {study.location}
                </p>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}