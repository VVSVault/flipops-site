'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Clock,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function DashboardPreview() {
  const [dealCount, setDealCount] = useState(0);
  const [savings, setSavings] = useState(0);
  const [burnRate, setBurnRate] = useState(0);

  useEffect(() => {
    // Animate numbers on mount
    const dealTimer = setInterval(() => {
      setDealCount(prev => (prev < 47 ? prev + 1 : 47));
    }, 50);
    
    const savingsTimer = setInterval(() => {
      setSavings(prev => (prev < 12450 ? prev + 245 : 12450));
    }, 30);
    
    const burnTimer = setInterval(() => {
      setBurnRate(prev => (prev < 1250 ? prev + 25 : 1250));
    }, 40);

    return () => {
      clearInterval(dealTimer);
      clearInterval(savingsTimer);
      clearInterval(burnTimer);
    };
  }, []);

  const alerts = [
    { type: 'warning', message: 'Kitchen renovation 15% over budget', time: '2 min ago' },
    { type: 'success', message: 'Draw #3 approved - $45,000 released', time: '1 hour ago' },
    { type: 'info', message: 'New lead: 4-bed flip opportunity in Westside', time: '3 hours ago' },
  ];

  const deals = [
    { name: '1547 Maple Ave', status: 'analysis', arv: 425000, profit: 65000 },
    { name: '892 Pine Street', status: 'rehab', arv: 380000, profit: 48000 },
    { name: '2210 Oak Boulevard', status: 'offer', arv: 510000, profit: 72000 },
  ];

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">FlipOps Dashboard</h3>
          <Badge variant="outline" className="bg-primary/10">
            Live Demo
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Deals</p>
                  <p className="text-2xl font-bold">{dealCount}</p>
                  <p className="text-xs text-primary flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +12 this month
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Savings</p>
                  <p className="text-2xl font-bold">${savings.toLocaleString()}</p>
                  <p className="text-xs text-accent flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    vs manual process
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-accent opacity-50" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4 bg-gradient-to-br from-destructive/10 to-destructive/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Daily Burn Rate</p>
                  <p className="text-2xl font-bold">${burnRate}</p>
                  <p className="text-xs text-destructive flex items-center mt-1">
                    <ArrowDown className="h-3 w-3 mr-1" />
                    -23% with automation
                  </p>
                </div>
                <Clock className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Deal Pipeline */}
        <div>
          <h4 className="text-sm font-medium mb-3">Deal Pipeline</h4>
          <div className="space-y-2">
            {deals.map((deal, index) => (
              <motion.div
                key={deal.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        deal.status === 'rehab' ? 'bg-primary' : 
                        deal.status === 'analysis' ? 'bg-accent' : 
                        'bg-muted-foreground'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{deal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ARV: ${(deal.arv / 1000).toFixed(0)}K • Profit: ${(deal.profit / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {deal.status}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Alerts</h4>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-start gap-3 text-sm"
              >
                {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-primary mt-0.5" />}
                {alert.type === 'info' && <TrendingUp className="h-4 w-4 text-accent mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}