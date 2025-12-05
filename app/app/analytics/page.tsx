
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Download,
  FileText,
  RefreshCw,
  Star,
  AlertTriangle,
  Trophy,
  Award,
  Medal,
  Crown,
  Percent
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  calculateKPIs,
  calculateFunnel,
  calculateMarketingMetrics,
  calculateDealProfitability,
  calculateTeamMetrics,
  calculateVendorMetrics,
  calculateTrends,
  compareWithPeriod,
  getProfitWaterfall
} from "./analytics-service";
import type { 
  DashboardFilters, 
  ComparisonPeriod, 
  KPIMetrics, 
  FunnelStage, 
  MarketingMetrics, 
  TeamMetrics, 
  VendorMetrics, 
  DealProfitability 
} from "./types";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.abs(value));
}

function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`;
}

function KPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  format = 'number'
}: { 
  title: string; 
  value: number; 
  change?: number; 
  icon: React.ElementType;
  format?: 'number' | 'currency' | 'percent';
}) {
  const formattedValue = format === 'currency' ? formatCurrency(value) :
                         format === 'percent' ? formatPercent(value) :
                         formatNumber(value);
  
  const isPositive = change && change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded">
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              <TrendIcon className="h-3 w-3" />
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold">{formattedValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Default demo data for fallback
const DEFAULT_KPIS: KPIMetrics = {
  leads: 1247,
  qualifiedLeads: 561,
  appointments: 280,
  offers: 168,
  contracts: 89,
  closedDeals: 76,
  netProfit: 1842000,
  grossProfit: 2156000,
  totalSpend: 52000,
  romi: 35.4,
  roas: 48.2,
  avgDaysToContract: 12,
  avgSpeedToLead: 8,
  conversionRate: 0.061
};

const DEFAULT_FUNNEL: FunnelStage[] = [
  { stage: 'Leads', count: 1247, percentage: 100, conversionToNext: 45 },
  { stage: 'Qualified', count: 561, percentage: 45, conversionToNext: 50 },
  { stage: 'Appointments', count: 280, percentage: 22.5, conversionToNext: 60 },
  { stage: 'Offers', count: 168, percentage: 13.5, conversionToNext: 53 },
  { stage: 'Contracts', count: 89, percentage: 7.1, conversionToNext: 85 },
  { stage: 'Closed', count: 76, percentage: 6.1 }
];

const DEFAULT_WATERFALL = [
  { stage: 'Revenue', value: 3250000, isProfit: true },
  { stage: 'Purchase', value: 780000 },
  { stage: 'Gross Profit', value: 2470000, isProfit: true },
  { stage: 'Rehab', value: 425000 },
  { stage: 'Holding', value: 87000 },
  { stage: 'Closing', value: 116000 },
  { stage: 'Net Profit', value: 1842000, isProfit: true }
];

const DEFAULT_TRENDS = [
  { date: new Date('2024-01-01'), value: 380000 },
  { date: new Date('2024-01-08'), value: 420000 },
  { date: new Date('2024-01-15'), value: 465000 },
  { date: new Date('2024-01-22'), value: 512000 },
  { date: new Date('2024-01-29'), value: 485000 }
];

const DEFAULT_MARKETING: MarketingMetrics[] = [
  { channel: 'PPC', spend: 28000, leads: 562, contracts: 45, closedDeals: 38, cpl: 49.82, cpa: 622, cpd: 737, roas: 52.3, romi: 41.2 },
  { channel: 'SEO', spend: 5000, leads: 245, contracts: 12, closedDeals: 10, cpl: 20.41, cpa: 417, cpd: 500, roas: 28.4, romi: 22.6 },
  { channel: 'Direct Mail', spend: 8000, leads: 186, contracts: 9, closedDeals: 8, cpl: 43.01, cpa: 889, cpd: 1000, roas: 18.5, romi: 14.2 },
  { channel: 'Cold Call', spend: 6000, leads: 142, contracts: 7, closedDeals: 6, cpl: 42.25, cpa: 857, cpd: 1000, roas: 15.8, romi: 11.3 },
  { channel: 'SMS', spend: 3000, leads: 87, contracts: 5, closedDeals: 4, cpl: 34.48, cpa: 600, cpd: 750, roas: 12.6, romi: 9.8 },
  { channel: 'Referral', spend: 2000, leads: 25, contracts: 11, closedDeals: 10, cpl: 80, cpa: 182, cpd: 200, roas: 85.2, romi: 72.5 }
];

const DEFAULT_TEAM: TeamMetrics[] = [
  { userId: '1', userName: 'Sarah Chen', role: 'Acquisition', touchesPerDay: 48, firstResponseTime: 5, appointmentSetRate: 0.42, offerRate: 0.65, winRate: 0.58, followUpSLA: 0.96, totalActivities: 1440, totalDeals: 28, totalRevenue: 1120000 },
  { userId: '2', userName: 'Mike Rodriguez', role: 'Acquisition', touchesPerDay: 42, firstResponseTime: 8, appointmentSetRate: 0.38, offerRate: 0.60, winRate: 0.52, followUpSLA: 0.92, totalActivities: 1260, totalDeals: 24, totalRevenue: 960000 },
  { userId: '3', userName: 'Emily Johnson', role: 'Disposition', touchesPerDay: 36, firstResponseTime: 12, appointmentSetRate: 0.35, offerRate: 0.55, winRate: 0.48, followUpSLA: 0.88, totalActivities: 1080, totalDeals: 20, totalRevenue: 800000 },
  { userId: '4', userName: 'David Park', role: 'Account Manager', touchesPerDay: 32, firstResponseTime: 15, appointmentSetRate: 0.32, offerRate: 0.50, winRate: 0.45, followUpSLA: 0.85, totalActivities: 960, totalDeals: 16, totalRevenue: 640000 }
];

const DEFAULT_VENDORS: VendorMetrics[] = [
  { vendorId: '1', vendorName: 'Phoenix Premier Contractors', category: 'Contractor', totalJobs: 42, onTimePercentage: 95, quoteVariance: 3.2, avgRating: 4.8, changeOrderRate: 5, totalSpend: 425000, avgJobValue: 10119 },
  { vendorId: '2', vendorName: 'Lightning Electric Solutions', category: 'Electrician', totalJobs: 28, onTimePercentage: 92, quoteVariance: 2.8, avgRating: 4.6, changeOrderRate: 3, totalSpend: 84000, avgJobValue: 3000 },
  { vendorId: '3', vendorName: 'Desert Cool HVAC', category: 'HVAC', totalJobs: 24, onTimePercentage: 88, quoteVariance: 4.5, avgRating: 4.5, changeOrderRate: 8, totalSpend: 96000, avgJobValue: 4000 },
  { vendorId: '4', vendorName: 'Blue Wave Plumbing', category: 'Plumber', totalJobs: 18, onTimePercentage: 72, quoteVariance: 28.5, avgRating: 3.2, changeOrderRate: 35, totalSpend: 63000, avgJobValue: 3500 },
  { vendorId: '5', vendorName: 'Sunset Roofing Specialists', category: 'Roofing', totalJobs: 15, onTimePercentage: 91, quoteVariance: 5.1, avgRating: 4.7, changeOrderRate: 6, totalSpend: 120000, avgJobValue: 8000 },
  { vendorId: '6', vendorName: 'Valley Floor & Tile', category: 'Flooring', totalJobs: 22, onTimePercentage: 85, quoteVariance: 7.3, avgRating: 4.4, changeOrderRate: 10, totalSpend: 88000, avgJobValue: 4000 },
  { vendorId: '7', vendorName: 'Pro Paint Arizona', category: 'Painting', totalJobs: 31, onTimePercentage: 94, quoteVariance: 2.1, avgRating: 4.9, changeOrderRate: 2, totalSpend: 62000, avgJobValue: 2000 },
  { vendorId: '8', vendorName: 'GreenThumb Landscaping', category: 'Landscaping', totalJobs: 19, onTimePercentage: 78, quoteVariance: 15.8, avgRating: 3.8, changeOrderRate: 22, totalSpend: 38000, avgJobValue: 2000 },
  { vendorId: '9', vendorName: 'QuickFix Drywall', category: 'Drywall', totalJobs: 14, onTimePercentage: 68, quoteVariance: 32.1, avgRating: 3.5, changeOrderRate: 28, totalSpend: 42000, avgJobValue: 3000 },
  { vendorId: '10', vendorName: 'Budget Windows & Doors', category: 'Windows', totalJobs: 11, onTimePercentage: 75, quoteVariance: 19.7, avgRating: 3.9, changeOrderRate: 18, totalSpend: 55000, avgJobValue: 5000 }
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("executive");
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    }
  });
  const [comparison, setComparison] = useState<ComparisonPeriod>({ type: 'previous' });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);
  const [dataPeriod, setDataPeriod] = useState(30);

  // State for API data with fallback to demo data
  const [kpis, setKpis] = useState<KPIMetrics>(DEFAULT_KPIS);
  const [funnel, setFunnel] = useState<FunnelStage[]>(DEFAULT_FUNNEL);
  const [waterfall, setWaterfall] = useState(DEFAULT_WATERFALL);
  const [trends, setTrends] = useState(DEFAULT_TRENDS);
  const [marketingMetrics, setMarketingMetrics] = useState<MarketingMetrics[]>(DEFAULT_MARKETING);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics[]>(DEFAULT_TEAM);
  const [vendorMetrics, setVendorMetrics] = useState<VendorMetrics[]>(DEFAULT_VENDORS);

  // Fetch analytics data from API
  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/analytics?period=${dataPeriod}&tab=all`);
      if (response.ok) {
        const data = await response.json();

        // Update state with API data, keeping defaults as fallback
        if (data.kpis) setKpis(data.kpis);
        if (data.funnel) setFunnel(data.funnel);
        if (data.waterfall) setWaterfall(data.waterfall);
        if (data.trends) {
          setTrends(data.trends.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          })));
        }
        if (data.marketingMetrics) setMarketingMetrics(data.marketingMetrics);
        if (data.teamMetrics) setTeamMetrics(data.teamMetrics);
        if (data.vendorMetrics && data.vendorMetrics.length > 0) {
          setVendorMetrics(data.vendorMetrics);
        }

        setHasRealData(data.hasRealData || false);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [dataPeriod]);

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (format !== 'csv') {
      toast.info(`${format.toUpperCase()} export coming soon`);
      return;
    }

    let csvContent = "";
    let filename = "";

    switch (activeTab) {
      case "executive":
        filename = "executive-kpis";
        csvContent = "Metric,Value\n";
        csvContent += `Total Leads,${kpis.leads}\n`;
        csvContent += `Qualified Leads,${kpis.qualifiedLeads}\n`;
        csvContent += `Appointments,${kpis.appointments}\n`;
        csvContent += `Offers,${kpis.offers}\n`;
        csvContent += `Contracts,${kpis.contracts}\n`;
        csvContent += `Closed Deals,${kpis.closedDeals}\n`;
        csvContent += `Net Profit,$${kpis.netProfit}\n`;
        csvContent += `Gross Profit,$${kpis.grossProfit}\n`;
        csvContent += `ROMI,${kpis.romi}x\n`;
        break;

      case "marketing":
        filename = "marketing-performance";
        csvContent = "Channel,Spend,Leads,Contracts,Closed Deals,CPL,CPA,ROAS,ROMI\n";
        marketingMetrics.forEach(m => {
          csvContent += `${m.channel},$${m.spend},${m.leads},${m.contracts},${m.closedDeals},$${m.cpl.toFixed(2)},$${m.cpa},${m.roas}x,${m.romi}x\n`;
        });
        break;

      case "team":
        filename = "team-performance";
        csvContent = "Name,Role,Touches/Day,Response Time (min),Win Rate,Deals,Revenue\n";
        teamMetrics.forEach(m => {
          csvContent += `${m.userName},${m.role},${m.touchesPerDay},${m.firstResponseTime},${(m.winRate * 100).toFixed(1)}%,${m.totalDeals},$${m.totalRevenue}\n`;
        });
        break;

      case "vendors":
        filename = "vendor-performance";
        csvContent = "Vendor,Category,Jobs,On-Time %,Quote Variance,Rating,Total Spend\n";
        vendorMetrics.forEach(v => {
          csvContent += `"${v.vendorName}",${v.category},${v.totalJobs},${v.onTimePercentage}%,${v.quoteVariance}%,${v.avgRating},$${v.totalSpend}\n`;
        });
        break;

      default:
        filename = "analytics-export";
        csvContent = "Tab,Note\n";
        csvContent += `${activeTab},Export not implemented for this tab\n`;
    }

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${activeTab} dashboard as CSV`);
  };

  const handleDateRangeChange = (range: string) => {
    const now = new Date();
    let from = new Date();
    let days = 30;

    switch (range) {
      case '7d':
        from.setDate(now.getDate() - 7);
        days = 7;
        break;
      case '30d':
        from.setDate(now.getDate() - 30);
        days = 30;
        break;
      case '90d':
        from.setDate(now.getDate() - 90);
        days = 90;
        break;
    }

    setFilters({ ...filters, dateRange: { from, to: now } });
    setDataPeriod(days); // This will trigger the useEffect to fetch new data
  };

  const handleRefresh = () => {
    fetchAnalytics();
    toast.success("Data refreshed!");
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Compact Header */}
      <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-bold">Analytics Dashboard</h1>
              <p className="text-[10px] text-gray-500">
                AI-Powered Insights • {kpis.romi}x ROMI • {kpis.closedDeals} Deals Closed
              </p>
            </div>
            {!loading && (
              <Badge variant={hasRealData ? "default" : "secondary"} className="text-[10px]">
                {hasRealData ? "Live Data" : "Demo Data"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("h-3 w-3 mr-1", refreshing && "animate-spin")} />
              {refreshing ? "Loading..." : "Refresh"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>Export as Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900/50 border-b">
        <div className="flex items-center gap-3">
          <Select defaultValue="30d" onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="previous">
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">vs Previous Period</SelectItem>
              <SelectItem value="yoy">vs Year Over Year</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex-1" />
          
          <Badge variant="secondary" className="text-[10px]">
            Jan 1 - Jan 30, 2024
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mx-4 mt-2 grid grid-cols-6 w-auto">
            <TabsTrigger value="executive" className="text-xs">Executive</TabsTrigger>
            <TabsTrigger value="marketing" className="text-xs">Marketing</TabsTrigger>
            <TabsTrigger value="acquisition" className="text-xs">Acquisition</TabsTrigger>
            <TabsTrigger value="profitability" className="text-xs">Profitability</TabsTrigger>
            <TabsTrigger value="team" className="text-xs">Team</TabsTrigger>
            <TabsTrigger value="vendors" className="text-xs">Vendors</TabsTrigger>
          </TabsList>

          {/* Executive Dashboard */}
          <TabsContent value="executive" className="flex-1 overflow-y-auto px-4 pb-4 mt-2">
            <div className="space-y-3">
              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-2">
                <KPICard title="Total Leads" value={1247} change={32} icon={Users} />
                <KPICard title="Contracts" value={89} change={18} icon={FileText} />
                <KPICard title="Net Profit" value={1842000} change={24} icon={DollarSign} format="currency" />
                <KPICard title="ROMI" value={35.4} change={15} icon={Target} format="percent" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Funnel */}
                <Card>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm">Conversion Funnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={funnel}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6">
                          <LabelList dataKey="percentage" position="top" formatter={(v: any) => `${v}%`} fontSize={10} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Trend */}
                <Card>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm">Weekly Profit Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => formatCurrency(v as number)} />
                        <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Waterfall */}
              <Card>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm">Profit Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={waterfall} margin={{ bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" angle={-30} textAnchor="end" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} domain={[0, 3500000]} ticks={[0, 1000000, 2000000, 3000000]} />
                      <Tooltip formatter={(v) => formatCurrency(v as number)} />
                      <Bar dataKey="value">
                        {waterfall.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isProfit ? '#10B981' : '#93C5FD'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Marketing Dashboard */}
          <TabsContent value="marketing" className="flex-1 overflow-hidden p-2 mt-0">
            <div className="h-full bg-white dark:bg-gray-900 rounded-lg border p-3 flex flex-col">
              {/* Marketing KPIs - Compact height */}
              <div className="grid grid-cols-6 gap-2 mb-3" style={{ flexShrink: 0 }}>
                {[
                  { title: "Total Spend", value: 52000, change: -12, icon: DollarSign, format: "currency" },
                  { title: "Total Leads", value: 1247, change: 32, icon: Users, format: "number" },
                  { title: "CPL", value: 41.7, change: -8, icon: Target, format: "currency" },
                  { title: "CPA", value: 584, change: -15, icon: FileText, format: "currency" },
                  { title: "ROAS", value: 48.2, change: 22, icon: TrendingUp, format: "percent" },
                  { title: "ROMI", value: 35.4, change: 15, icon: Trophy, format: "percent" }
                ].map((kpi, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded">
                          <kpi.icon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        {kpi.change !== undefined && (
                          <div className={cn(
                            "flex items-center gap-0.5 text-[10px] font-medium",
                            kpi.change > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {kpi.change > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                            {Math.abs(kpi.change)}%
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.title}</p>
                        <p className="text-2xl font-bold">
                          {kpi.format === 'currency' ? formatCurrency(kpi.value) :
                           kpi.format === 'percent' ? formatPercent(kpi.value) :
                           formatNumber(kpi.value)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Rest of content in flex container */}
              <div className="flex-1 flex flex-col gap-2" style={{ minHeight: 0 }}>
                {/* Channel Performance Table */}
                <Card className="flex-shrink-0">
                  <CardHeader className="pb-1 pt-2">
                    <CardTitle className="text-sm">Channel Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Channel</TableHead>
                            <TableHead className="text-xs text-right">Spend</TableHead>
                            <TableHead className="text-xs text-right">Leads</TableHead>
                            <TableHead className="text-xs text-right">CPL</TableHead>
                            <TableHead className="text-xs text-right">ROMI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {marketingMetrics.slice(0, 4).map((m) => (
                            <TableRow key={m.channel}>
                              <TableCell className="text-xs font-medium py-1">{m.channel}</TableCell>
                              <TableCell className="text-xs text-right py-1">{formatCurrency(m.spend)}</TableCell>
                              <TableCell className="text-xs text-right py-1">{m.leads}</TableCell>
                              <TableCell className="text-xs text-right py-1">{formatCurrency(m.cpl)}</TableCell>
                              <TableCell className="text-xs text-right font-medium text-green-600 py-1">{m.romi.toFixed(1)}x</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Charts - Fill remaining space */}
                <div className="grid grid-cols-2 gap-2 flex-1" style={{ minHeight: 0 }}>
                  <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="pb-1 pt-2 flex-shrink-0">
                      <CardTitle className="text-sm">Lead Source Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 flex-1">
                      <div className="flex h-full">
                        <div className="flex flex-col justify-center space-y-1 pr-2">
                          {marketingMetrics.map((m, i) => {
                            const totalLeads = marketingMetrics.reduce((acc, curr) => acc + curr.leads, 0);
                            return (
                              <div key={m.channel} className="flex items-center gap-1 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-0.5 -m-0.5 transition-colors">
                                <div className="w-2 h-2 rounded flex-shrink-0 transition-transform group-hover:scale-125" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] whitespace-nowrap font-medium">{m.channel}:</span>
                                <span className="text-[10px] text-gray-600">{m.leads}</span>
                                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 rounded ml-1 overflow-hidden">
                                  <div 
                                    className="h-full transition-all duration-300 group-hover:opacity-100 opacity-60" 
                                    style={{ 
                                      width: `${(m.leads / totalLeads) * 100}%`,
                                      backgroundColor: COLORS[i % COLORS.length]
                                    }} 
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={marketingMetrics}
                                dataKey="leads"
                                nameKey="channel"
                                cx="50%"
                                cy="50%"
                                outerRadius="70%"
                                animationBegin={0}
                                animationDuration={300}
                              >
                                {marketingMetrics.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]}
                                    style={{ cursor: 'pointer' }}
                                    className="hover:opacity-80 transition-opacity"
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="pb-1 pt-2 flex-shrink-0">
                      <CardTitle className="text-sm">Weekly Campaign Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { week: 'W1', ppc: 145, seo: 62, email: 43 },
                          { week: 'W2', ppc: 162, seo: 68, email: 51 },
                          { week: 'W3', ppc: 138, seo: 71, email: 47 },
                          { week: 'W4', ppc: 177, seo: 75, email: 58 }
                        ]} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="ppc" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                          <Area type="monotone" dataKey="seo" stackId="1" stroke="#10B981" fill="#10B981" />
                          <Area type="monotone" dataKey="email" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="acquisition" className="flex-1 overflow-y-auto p-2 mt-0">
            <div className="h-full bg-white dark:bg-gray-900 rounded-lg border p-3 space-y-3">
              {/* Acquisition Metrics */}
              <div className="grid grid-cols-4 gap-2">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">8 min</div>
                    <p className="text-xs text-gray-500">Avg Speed to Lead</p>
                    <Progress value={85} className="mt-2 h-1" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">12 days</div>
                    <p className="text-xs text-gray-500">Avg Days to Contract</p>
                    <Progress value={75} className="mt-2 h-1" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">6.1%</div>
                    <p className="text-xs text-gray-500">Conversion Rate</p>
                    <Progress value={61} className="mt-2 h-1" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">45%</div>
                    <p className="text-xs text-gray-500">Qualification Rate</p>
                    <Progress value={45} className="mt-2 h-1" />
                  </CardContent>
                </Card>
              </div>

              {/* Lead Source Quality */}
              <Card>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm">Lead Quality by Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {marketingMetrics.map((m) => {
                      const qualRate = (m.contracts / m.leads * 100).toFixed(1);
                      return (
                        <div key={m.channel} className="flex items-center justify-between">
                          <span className="text-xs font-medium">{m.channel}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={parseFloat(qualRate)} className="w-24 h-1" />
                            <span className="text-xs text-gray-500 w-10 text-right">{qualRate}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Speed Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm">Response Time Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>&lt; 5 min</span>
                        <span className="font-medium">42%</span>
                      </div>
                      <Progress value={42} className="h-1" />
                      <div className="flex justify-between text-xs mt-2">
                        <span>5-15 min</span>
                        <span className="font-medium">31%</span>
                      </div>
                      <Progress value={31} className="h-1" />
                      <div className="flex justify-between text-xs mt-2">
                        <span>15-60 min</span>
                        <span className="font-medium">18%</span>
                      </div>
                      <Progress value={18} className="h-1" />
                      <div className="flex justify-between text-xs mt-2">
                        <span>&gt; 60 min</span>
                        <span className="font-medium">9%</span>
                      </div>
                      <Progress value={9} className="h-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm">Daily Lead Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={[
                        { hour: '6am', leads: 12 },
                        { hour: '9am', leads: 45 },
                        { hour: '12pm', leads: 78 },
                        { hour: '3pm', leads: 92 },
                        { hour: '6pm', leads: 54 },
                        { hour: '9pm', leads: 23 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="leads" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profitability" className="flex-1 overflow-y-auto p-2 mt-0">
            <div className="h-full bg-white dark:bg-gray-900 rounded-lg border p-3 space-y-3">
              {/* Profitability KPIs */}
              <div className="grid grid-cols-5 gap-2">
                <KPICard title="Gross Profit" value={2156000} change={18} icon={DollarSign} format="currency" />
                <KPICard title="Net Profit" value={1842000} change={24} icon={Target} format="currency" />
                <KPICard title="Avg MOIC" value={2.36} change={12} icon={Trophy} />
                <KPICard title="Avg Margin" value={56.7} change={8} icon={Percent} format="percent" />
                <KPICard title="Avg Deal Size" value={42763} change={15} icon={FileText} format="currency" />
              </div>

              {/* Deal Analysis - Compact Layout */}
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm">Profit by Market</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={[
                        { market: 'Phoenix', profit: 680000, deals: 28 },
                        { market: 'Tucson', profit: 520000, deals: 22 },
                        { market: 'Scottsdale', profit: 420000, deals: 18 },
                        { market: 'Mesa', profit: 222000, deals: 8 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="market" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => formatCurrency(v as number)} />
                        <Bar dataKey="profit" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm">Top Performing Deals</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="space-y-1 overflow-y-auto max-h-[120px]">
                      {[
                        { address: '123 Main St', market: 'Phoenix', profit: 140000, margin: 77.8 },
                        { address: '456 Oak Ave', market: 'Scottsdale', profit: 165000, margin: 75.0 },
                        { address: '789 Elm Dr', market: 'Tucson', profit: 105000, margin: 70.0 },
                        { address: '321 Pine Rd', market: 'Mesa', profit: 110000, margin: 66.7 }
                      ].map((deal) => (
                        <div key={deal.address} className="flex justify-between items-center p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                          <div>
                            <p className="text-xs font-medium">{deal.address}</p>
                            <p className="text-[10px] text-gray-500">{deal.market}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-green-600">{formatCurrency(deal.profit)}</p>
                            <p className="text-[10px] text-gray-500">{deal.margin.toFixed(1)}% margin</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Margin Distribution and Deal Size - Side by side */}
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm">Margin Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="w-[55%]">
                        <ResponsiveContainer width="100%" height={140}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: '60%+', value: 32, count: 32 },
                                { name: '50-60%', value: 28, count: 28 },
                                { name: '40-50%', value: 12, count: 12 },
                                { name: '30-40%', value: 4, count: 4 }
                              ]}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={55}
                              animationBegin={0}
                              animationDuration={300}
                            >
                              {[0, 1, 2, 3].map((index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={['#10B981', '#3B82F6', '#F59E0B', '#EF4444'][index]}
                                  style={{ cursor: 'pointer' }}
                                  className="hover:opacity-80 transition-opacity"
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 flex flex-col justify-center space-y-2">
                        {['60%+', '50-60%', '40-50%', '30-40%'].map((label, i) => {
                          const data = [32, 28, 12, 4][i];
                          const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
                          return (
                            <div key={label} className="flex items-center gap-2 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1 transition-colors">
                              <div className="w-3 h-3 rounded transition-transform group-hover:scale-125" style={{ backgroundColor: colors[i] }} />
                              <span className="text-xs font-medium">{label}</span>
                              <span className="text-xs text-gray-500">({data})</span>
                              <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded ml-2 overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-300 group-hover:opacity-100 opacity-60" 
                                  style={{ 
                                    width: `${(data / 76) * 100}%`,
                                    backgroundColor: colors[i]
                                  }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm">Average Deal Size by Market</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={[
                        { market: 'Scottsdale', size: 55000 },
                        { market: 'Phoenix', size: 42000 },
                        { market: 'Tucson', size: 38000 },
                        { market: 'Mesa', size: 35000 }
                      ]} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="market" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => formatCurrency(v as number)} />
                        <Bar dataKey="size" fill="#8B5CF6">
                          {[0, 1, 2, 3].map((index) => (
                            <Cell key={`cell-${index}`} fill={['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'][index]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="flex-1 overflow-y-auto p-2 mt-0">
            <div className="h-full bg-white dark:bg-gray-900 rounded-lg border p-3 space-y-3">
              {/* Team Performance Overview */}
              <div className="grid grid-cols-4 gap-2">
                <KPICard title="Total Team" value={4} icon={Users} />
                <KPICard title="Avg Touches/Day" value={39.5} change={12} icon={Target} />
                <KPICard title="Avg Win Rate" value={50.8} change={8} icon={Trophy} format="percent" />
                <KPICard title="Total Revenue" value={3520000} change={24} icon={DollarSign} format="currency" />
              </div>

              {/* Team Leaderboard */}
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm">Revenue Leaderboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Rank</TableHead>
                          <TableHead className="text-xs">Rep</TableHead>
                          <TableHead className="text-xs text-right">Revenue</TableHead>
                          <TableHead className="text-xs text-right">Deals</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMetrics.map((m, i) => (
                          <TableRow key={m.userId}>
                            <TableCell className="text-xs">
                              {i === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                              {i === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                              {i === 2 && <Award className="h-4 w-4 text-orange-600" />}
                              {i > 2 && i + 1}
                            </TableCell>
                            <TableCell className="text-xs font-medium">{m.userName}</TableCell>
                            <TableCell className="text-xs text-right">{formatCurrency(m.totalRevenue)}</TableCell>
                            <TableCell className="text-xs text-right">{m.totalDeals}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm">Activity Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {teamMetrics.map((m) => (
                        <div key={m.userId} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{m.userName}</span>
                            <span>{m.touchesPerDay} touches/day</span>
                          </div>
                          <Progress value={m.touchesPerDay / 50 * 100} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Individual Performance Cards */}
              <div className="grid grid-cols-2 gap-2">
                {teamMetrics.slice(0, 2).map((member) => (
                  <Card key={member.userId}>
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm">{member.userName}</CardTitle>
                      <p className="text-[10px] text-gray-500">{member.role}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold">{member.totalDeals}</p>
                          <p className="text-[10px] text-gray-500">Deals</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{(member.winRate * 100).toFixed(0)}%</p>
                          <p className="text-[10px] text-gray-500">Win Rate</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{member.firstResponseTime}m</p>
                          <p className="text-[10px] text-gray-500">Response</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between text-xs">
                          <span>SLA Compliance</span>
                          <span className="font-medium">{(member.followUpSLA * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={member.followUpSLA * 100} className="mt-1 h-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vendors" className="flex-1 p-2 mt-0" style={{ overflow: 'hidden' }}>
            <div className="h-full bg-white dark:bg-gray-900 rounded-lg border p-3 flex flex-col" style={{ maxHeight: '100%' }}>
              {/* Vendor Overview - Fixed height */}
              <div className="grid grid-cols-4 gap-2 mb-2" style={{ flexShrink: 0 }}>
                <KPICard title="Active Vendors" value={14} icon={Users} />
                <KPICard title="Total Spend" value={668000} change={-8} icon={DollarSign} format="currency" />
                <KPICard title="Avg Rating" value={4.3} change={5} icon={Star} />
                <KPICard title="On-Time Rate" value={86.8} change={12} icon={Target} format="percent" />
              </div>

              {/* Rest of content in flex container */}
              <div className="flex-1 flex flex-col gap-2" style={{ minHeight: 0 }}>
                {/* Performance Alerts - Card style display */}
                <div className="mb-2" style={{ flexShrink: 0 }}>
                  <h3 className="text-xs font-medium mb-2">Performance Alerts</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {vendorMetrics
                      .filter(v => v.onTimePercentage < 80)
                      .map(vendor => (
                        <Card key={vendor.vendorId} className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
                          <CardContent className="p-2">
                            <div className="flex items-center justify-between mb-1">
                              <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                              <span className={cn(
                                "text-xs font-bold",
                                vendor.onTimePercentage < 75 ? "text-red-600" : "text-yellow-600"
                              )}>
                                {vendor.onTimePercentage}%
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-medium truncate">{vendor.vendorName}</p>
                              <p className="text-[10px] text-gray-600 dark:text-gray-400">{vendor.category}</p>
                              <p className="text-[10px] text-gray-500 mt-1">Variance: +{vendor.quoteVariance.toFixed(0)}%</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    {vendorMetrics.filter(v => v.onTimePercentage < 80).length === 0 && (
                      <Card className="col-span-4 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20">
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-green-600 dark:text-green-400">No performance issues detected</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Vendor Performance and Spend - Takes remaining space */}
                <div className="grid grid-cols-2 gap-2 flex-1" style={{ minHeight: 0 }}>
                  <Card className="overflow-hidden flex flex-col">
                    <CardHeader className="pb-2 pt-2" style={{ flexShrink: 0 }}>
                      <CardTitle className="text-sm">Vendor Performance Matrix</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                      <div className="h-full overflow-y-auto pr-2" style={{ maxHeight: '100%' }}>
                        {vendorMetrics.map((vendor) => (
                          <div key={vendor.vendorId} className="flex justify-between items-center p-2 mb-1 border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{vendor.vendorName}</p>
                              <p className="text-[10px] text-gray-500">{vendor.category}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <span className={cn(
                                  "text-xs font-bold block",
                                  vendor.onTimePercentage >= 90 ? "text-green-600" :
                                  vendor.onTimePercentage >= 80 ? "text-yellow-600" :
                                  "text-red-600"
                                )}>
                                  {vendor.onTimePercentage}%
                                </span>
                                <span className="text-[10px] text-gray-500">on-time</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-medium">{vendor.avgRating}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden flex flex-col">
                    <CardHeader className="pb-1 pt-1" style={{ flexShrink: 0 }}>
                      <CardTitle className="text-xs">Spend by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="p-1 flex-1" style={{ minHeight: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { cat: 'Contr', spend: 425000 },
                          { cat: 'Roof', spend: 120000 },
                          { cat: 'HVAC', spend: 96000 },
                          { cat: 'Floor', spend: 88000 },
                          { cat: 'Elec', spend: 84000 },
                          { cat: 'Plumb', spend: 63000 },
                          { cat: 'Paint', spend: 62000 },
                          { cat: 'Land', spend: 38000 }
                        ]} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                        <XAxis dataKey="cat" tick={{ fontSize: 8 }} />
                        <YAxis tick={{ fontSize: 8 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={25} />
                        <Tooltip formatter={(v) => formatCurrency(v as number)} />
                        <Bar dataKey="spend" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}