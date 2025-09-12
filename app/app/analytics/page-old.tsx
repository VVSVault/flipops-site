"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
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
  Legend,
  ResponsiveContainer,
  LabelList
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Activity,
  Calendar,
  Filter,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Send,
  Package,
  Briefcase,
  User,
  Star,
  AlertTriangle,
  Info,
  MoreVertical,
  ChevronRight,
  Percent,
  Trophy,
  Award,
  Medal,
  Crown,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  Menu
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
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
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              <TrendIcon className="h-4 w-4" />
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold">{formattedValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}

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
  
  const [kpis, setKpis] = useState<KPIMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [marketingMetrics, setMarketingMetrics] = useState<MarketingMetrics[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics[]>([]);
  const [vendorMetrics, setVendorMetrics] = useState<VendorMetrics[]>([]);
  const [profitability, setProfitability] = useState<DealProfitability[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [waterfall, setWaterfall] = useState<any[]>([]);
  const [compareData, setCompareData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [filters, comparison]);

  const loadData = async () => {
    setRefreshing(true);
    
    const newKpis = calculateKPIs(filters);
    setKpis(newKpis);
    
    const newFunnel = calculateFunnel(filters);
    setFunnel(newFunnel);
    
    const newMarketing = calculateMarketingMetrics(filters);
    setMarketingMetrics(newMarketing);
    
    const newTeam = calculateTeamMetrics(filters);
    setTeamMetrics(newTeam);
    
    const newVendors = calculateVendorMetrics(filters);
    setVendorMetrics(newVendors);
    
    const newProfitability = calculateDealProfitability(filters);
    setProfitability(newProfitability);
    
    const newTrends = calculateTrends('profit', filters, 'week');
    setTrends(newTrends);
    
    const newWaterfall = getProfitWaterfall(undefined, filters);
    setWaterfall(newWaterfall);
    
    const newCompare = compareWithPeriod(filters, comparison);
    setCompareData(newCompare);
    
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    toast.success(`Exporting ${activeTab} dashboard as ${format.toUpperCase()}`);
  };

  const handleDateRangeChange = (range: string) => {
    const now = new Date();
    let from = new Date();
    
    switch (range) {
      case '7d':
        from.setDate(now.getDate() - 7);
        break;
      case '30d':
        from.setDate(now.getDate() - 30);
        break;
      case '90d':
        from.setDate(now.getDate() - 90);
        break;
      case 'mtd':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'qtd':
        from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'ytd':
        from = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    setFilters({ ...filters, dateRange: { from, to: now } });
  };

  if (!kpis) return <div>Loading...</div>;

  return (
    <div className="h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Real-time insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select defaultValue="30d" onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="mtd">Month to Date</SelectItem>
                <SelectItem value="qtd">Quarter to Date</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue="previous" onValueChange={(value) => setComparison({ type: value as any })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous">vs Previous Period</SelectItem>
                <SelectItem value="yoy">vs Year Ago</SelectItem>
                <SelectItem value="none">No Comparison</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex-1" />
            
            <Badge variant="secondary">
              {filters.dateRange && `${filters.dateRange.from.toLocaleDateString()} - ${filters.dateRange.to.toLocaleDateString()}`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full mb-4">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        {/* Executive Dashboard */}
        <TabsContent value="executive" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            <KPICard
              title="Total Leads"
              value={kpis.leads}
              change={compareData?.changes?.leads}
              icon={Users}
            />
            <KPICard
              title="Contracts"
              value={kpis.contracts}
              change={compareData?.changes?.contracts}
              icon={FileText}
            />
            <KPICard
              title="Net Profit"
              value={kpis.netProfit}
              change={compareData?.changes?.netProfit}
              icon={DollarSign}
              format="currency"
            />
            <KPICard
              title="ROMI"
              value={kpis.romi * 100}
              change={compareData?.changes?.romi}
              icon={Target}
              format="percent"
            />
          </div>

          {/* Funnel and Trends */}
          <div className="grid grid-cols-2 gap-4">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Conversion Funnel</CardTitle>
                <CardDescription className="text-xs">Lead to close journey</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={funnel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatNumber(value as number)} />
                    <Bar dataKey="count" fill="#3B82F6">
                      <LabelList dataKey="percentage" position="top" formatter={(value: any) => `${value.toFixed(0)}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Profit Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Profit Trend</CardTitle>
                <CardDescription className="text-xs">Weekly net profit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Profit Waterfall */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Profit Waterfall</CardTitle>
              <CardDescription className="text-xs">Revenue to net profit breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={waterfall}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" angle={-45} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => `$${(Math.abs(value) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Math.abs(value as number))} />
                  <Bar dataKey="value">
                    {waterfall.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Dashboard */}
        <TabsContent value="marketing" className="space-y-6">
          {/* Channel Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>Marketing metrics by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">Contracts</TableHead>
                    <TableHead className="text-right">CPA</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                    <TableHead className="text-right">ROMI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketingMetrics.map((metric) => (
                    <TableRow key={metric.channel}>
                      <TableCell className="font-medium">{metric.channel}</TableCell>
                      <TableCell className="text-right">{formatCurrency(metric.spend)}</TableCell>
                      <TableCell className="text-right">{formatNumber(metric.leads)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(metric.cpl)}</TableCell>
                      <TableCell className="text-right">{formatNumber(metric.contracts)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(metric.cpa)}</TableCell>
                      <TableCell className="text-right">{metric.roas.toFixed(2)}x</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-medium",
                          metric.romi > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatPercent(metric.romi * 100)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Spend vs Performance Charts */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spend vs Leads</CardTitle>
                <CardDescription>By channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={marketingMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis yAxisId="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="spend" fill="#3B82F6" />
                    <Bar yAxisId="right" dataKey="leads" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>Lead sources</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={marketingMetrics}
                      dataKey="leads"
                      nameKey="channel"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry: any) => `${entry.channel}: ${entry.leads}`}
                    >
                      {marketingMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Remaining tabs with simplified content for now */}
        <TabsContent value="acquisition" className="space-y-6">
          {/* Team Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Team Leaderboard</CardTitle>
              <CardDescription>Top performers this period</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Rep</TableHead>
                    <TableHead className="text-right">Touches/Day</TableHead>
                    <TableHead className="text-right">Response Time</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMetrics
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, 5)
                    .map((metric, index) => (
                      <TableRow key={metric.userId}>
                        <TableCell>
                          {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                          {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                          {index === 2 && <Award className="h-5 w-5 text-orange-600" />}
                          {index > 2 && <span className="text-gray-500">{index + 1}</span>}
                        </TableCell>
                        <TableCell className="font-medium">{metric.userName}</TableCell>
                        <TableCell className="text-right">{metric.touchesPerDay.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{metric.firstResponseTime.toFixed(0)}m</TableCell>
                        <TableCell className="text-right">{formatPercent(metric.winRate * 100)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(metric.totalRevenue)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Activity Metrics */}
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Speed to Lead</CardTitle>
                <CardDescription>Average response time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpis.avgSpeedToLead.toFixed(0)} min</div>
                <Progress value={Math.min(100, (15 / kpis.avgSpeedToLead) * 100)} className="mt-2" />
                <p className="text-sm text-gray-500 mt-2">Target: &lt;15 min</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Days to Contract</CardTitle>
                <CardDescription>Average cycle time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpis.avgDaysToContract.toFixed(0)} days</div>
                <Progress value={Math.min(100, (14 / kpis.avgDaysToContract) * 100)} className="mt-2" />
                <p className="text-sm text-gray-500 mt-2">Target: &lt;14 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
                <CardDescription>Lead to close</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatPercent(kpis.conversionRate * 100)}</div>
                <Progress value={kpis.conversionRate * 100} className="mt-2" />
                <p className="text-sm text-gray-500 mt-2">Industry avg: 5%</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profitability Dashboard */}
        <TabsContent value="profitability" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <KPICard
              title="Gross Profit"
              value={kpis.grossProfit}
              icon={DollarSign}
              format="currency"
            />
            <KPICard
              title="Net Profit"
              value={kpis.netProfit}
              icon={Target}
              format="currency"
            />
            <KPICard
              title="Avg MOIC"
              value={profitability.length > 0 ? profitability.reduce((sum, d) => sum + d.moic, 0) / profitability.length : 0}
              icon={Target}
              format="number"
            />
            <KPICard
              title="Avg Margin"
              value={profitability.length > 0 ? profitability.reduce((sum, d) => sum + d.margin, 0) / profitability.length * 100 : 0}
              icon={Percent}
              format="percent"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deal Profitability</CardTitle>
              <CardDescription>Top performing deals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitability.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dealId" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="netProfit" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Dashboard */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Metrics</CardTitle>
              <CardDescription>Individual and team statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Activities</TableHead>
                    <TableHead className="text-right">Deals</TableHead>
                    <TableHead className="text-right">SLA %</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMetrics.map((metric) => (
                    <TableRow key={metric.userId}>
                      <TableCell className="font-medium">{metric.userName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{metric.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{metric.totalActivities}</TableCell>
                      <TableCell className="text-right">{metric.totalDeals}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          metric.followUpSLA > 0.9 ? "text-green-600" : 
                          metric.followUpSLA > 0.7 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {formatPercent(metric.followUpSLA * 100)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(metric.totalRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Dashboard */}
        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance</CardTitle>
              <CardDescription>Reliability and cost metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                    <TableHead className="text-right">On-Time %</TableHead>
                    <TableHead className="text-right">Quote Variance</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorMetrics.map((metric) => (
                    <TableRow key={metric.vendorId}>
                      <TableCell className="font-medium">{metric.vendorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{metric.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{metric.totalJobs}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          metric.onTimePercentage > 90 ? "text-green-600" : 
                          metric.onTimePercentage > 80 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {formatPercent(metric.onTimePercentage)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          Math.abs(metric.quoteVariance) < 5 ? "text-green-600" : 
                          Math.abs(metric.quoteVariance) < 15 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {metric.quoteVariance > 0 ? '+' : ''}{formatPercent(metric.quoteVariance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {metric.avgRating.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(metric.totalSpend)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Vendor Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Alerts</CardTitle>
              <CardDescription>Issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vendorMetrics
                  .filter(v => v.onTimePercentage < 80 || v.quoteVariance > 20)
                  .map(vendor => (
                    <Alert key={vendor.vendorId} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{vendor.vendorName}</AlertTitle>
                      <AlertDescription>
                        {vendor.onTimePercentage < 80 && `On-time delivery at ${formatPercent(vendor.onTimePercentage)}. `}
                        {vendor.quoteVariance > 20 && `Quote variance at +${formatPercent(vendor.quoteVariance)}.`}
                        Consider finding alternative vendors.
                      </AlertDescription>
                    </Alert>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}