'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp } from 'lucide-react';

export function ROICalculator() {
  const [values, setValues] = useState({
    activeFlips: 3,
    avgMonthlyLeads: 20,
    hoursPerAnalysis: 2,
    hourlyCost: 75,
    interestRate: 12,
    avgLoanBalance: 250000,
  });

  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setValues(prev => ({ ...prev, [field]: numValue }));
  };

  // Calculate savings
  const timeSaved = values.avgMonthlyLeads * values.hoursPerAnalysis * 0.5;
  const laborSavings = timeSaved * values.hourlyCost;
  const monthlyInterest = (values.interestRate / 100 * values.avgLoanBalance) / 12;
  const interestSavings = monthlyInterest * 0.15; // 15% faster draw cycle
  const totalMonthlySavings = Math.round(laborSavings + interestSavings);

  // Determine plan recommendation
  const getPlanRecommendation = () => {
    if (values.activeFlips <= 2) return 'Starter';
    if (values.activeFlips <= 5) return 'Pro';
    return 'Portfolio';
  };

  return (
    <section id="roi-calculator" className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Calculate Your ROI
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how much time and money automation could save you each month
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Your Numbers
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Active Flips
                    </label>
                    <Input
                      type="number"
                      value={values.activeFlips}
                      onChange={(e) => handleChange('activeFlips', e.target.value)}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Avg Monthly Leads
                    </label>
                    <Input
                      type="number"
                      value={values.avgMonthlyLeads}
                      onChange={(e) => handleChange('avgMonthlyLeads', e.target.value)}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Hours per Deal Analysis
                    </label>
                    <Input
                      type="number"
                      value={values.hoursPerAnalysis}
                      onChange={(e) => handleChange('hoursPerAnalysis', e.target.value)}
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Hourly Cost ($)
                    </label>
                    <Input
                      type="number"
                      value={values.hourlyCost}
                      onChange={(e) => handleChange('hourlyCost', e.target.value)}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Interest Rate (%)
                    </label>
                    <Input
                      type="number"
                      value={values.interestRate}
                      onChange={(e) => handleChange('interestRate', e.target.value)}
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Avg Loan Balance ($)
                    </label>
                    <Input
                      type="number"
                      value={values.avgLoanBalance}
                      onChange={(e) => handleChange('avgLoanBalance', e.target.value)}
                      min="0"
                      step="10000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Your Savings
                </h3>

                <Card className="p-6 bg-primary/5 border-primary/20">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Time Saved</span>
                      <span className="font-semibold">{Math.round(timeSaved)} hrs/month</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Labor Savings</span>
                      <span className="font-semibold">${Math.round(laborSavings)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Interest Savings</span>
                      <span className="font-semibold">${Math.round(interestSavings)}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Monthly Savings</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          ${totalMonthlySavings}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-accent/5 border-accent/20">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Recommended Plan</span>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {getPlanRecommendation()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on your volume, the {getPlanRecommendation()} plan would deliver
                      maximum ROI with features tailored to your scale.
                    </p>
                    <Button className="w-full">
                      Book Your Free Audit
                    </Button>
                  </div>
                </Card>

                <div className="text-sm text-muted-foreground text-center">
                  Annual savings: <span className="font-semibold">${totalMonthlySavings * 12}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}