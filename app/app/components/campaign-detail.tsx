"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  RefreshCw,
  Download,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  TestTube,
  ChevronDown,
  Eye,
  Send,
  Target,
  Minus,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CampaignDetailProps {
  campaign: any;
  onBack: () => void;
}

// Mock delivery data
const generateMockDeliveries = (campaignId: string) => {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `DEL-${i + 1}`,
    leadId: `L-${1000 + i}`,
    leadName: ["John Smith", "Jane Doe", "Mike Johnson", "Sarah Williams", "Robert Brown"][i % 5],
    property: `${100 + i * 10} ${["Main", "Oak", "Pine", "Elm", "Maple"][i % 5]} St`,
    step: Math.floor(i / 10) + 1,
    channel: ["sms", "email", "voicemail"][i % 3],
    status: ["queued", "sent", "delivered", "bounced", "replied"][Math.floor(Math.random() * 5)],
    sentiment: i % 7 === 0 ? "positive" : i % 5 === 0 ? "negative" : "neutral",
    sentAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    cost: [0.015, 0.001, 0.10][i % 3]
  }));
};

// Mock analytics data
const mockAnalytics = {
  stepFunnel: [
    { step: "Step 1 - Initial SMS", sent: 1250, delivered: 1238, replied: 125, positive: 50 },
    { step: "Step 2 - Follow-up Email", sent: 1113, delivered: 1098, replied: 88, positive: 35 },
    { step: "Step 3 - Second SMS", sent: 990, delivered: 978, replied: 59, positive: 24 },
    { step: "Step 4 - VM Drop", sent: 906, delivered: 892, replied: 36, positive: 15 },
    { step: "Step 5 - Final Email", sent: 856, delivered: 845, replied: 28, positive: 10 }
  ],
  hourlyPerformance: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    sends: Math.floor(Math.random() * 200),
    replies: Math.floor(Math.random() * 20)
  })),
  sentimentBreakdown: {
    positive: 142,
    neutral: 108,
    negative: 48,
    unclassified: 52
  },
  channelPerformance: [
    { channel: "SMS", sends: 2240, deliveryRate: 98.2, replyRate: 12.5, cost: 33.60 },
    { channel: "Email", sends: 1969, deliveryRate: 96.8, replyRate: 7.2, cost: 1.97 },
    { channel: "Voicemail", sends: 906, deliveryRate: 98.5, replyRate: 4.0, cost: 90.60 }
  ],
  geographicPerformance: [
    { location: "Miami-Dade", sends: 450, replies: 54, contracts: 2 },
    { location: "Broward", sends: 380, replies: 38, contracts: 1 },
    { location: "Palm Beach", sends: 420, replies: 50, contracts: 0 }
  ]
};

export function CampaignDetail({ campaign, onBack }: CampaignDetailProps) {
  const [currentTab, setCurrentTab] = useState("overview");
  const [deliveries] = useState(generateMockDeliveries(campaign.id));
  const [timeRange, setTimeRange] = useState("7d");
  const [isSimulating, setIsSimulating] = useState(false);

  const formatNumber = (num: number) => num.toLocaleString();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "paused": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "completed": return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
      case "draft": return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "text-green-600 dark:text-green-400";
      case "bounced": return "text-red-600 dark:text-red-400";
      case "replied": return "text-blue-600 dark:text-blue-400";
      case "sent": return "text-yellow-600 dark:text-yellow-400";
      case "queued": return "text-gray-600 dark:text-gray-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "negative": return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "neutral": return <Activity className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const handlePauseResume = () => {
    if (campaign.status === "running") {
      toast.success("Campaign paused");
    } else if (campaign.status === "paused") {
      toast.success("Campaign resumed");
    }
  };

  const handleSimulation = () => {
    setIsSimulating(true);
    toast.info("Starting simulation mode...");
    
    // Simulate progress
    setTimeout(() => {
      setIsSimulating(false);
      toast.success("Simulation complete! Check the deliveries tab for results.");
    }, 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.name}
              </h1>
              <Badge className={cn("gap-1", getStatusColor(campaign.status))}>
                {campaign.status}
              </Badge>
              {campaign.abTest && (
                <Badge variant="outline" className="gap-1">
                  <TestTube className="h-3 w-3" />
                  A/B Test
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {campaign.id} • Created {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "running" && (
            <Button variant="outline" onClick={handlePauseResume}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button variant="outline" onClick={handlePauseResume}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          {campaign.status === "draft" && (
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Start Campaign
            </Button>
          )}
          <Button variant="outline" onClick={handleSimulation}>
            <TestTube className="h-4 w-4 mr-2" />
            Simulate
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics - Compact chips with larger text */}
      <div className="flex-shrink-0 grid grid-cols-4 md:grid-cols-7 gap-1.5 mb-3">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="px-2.5 py-1.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Audience</p>
                <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
                  {formatNumber(campaign.audience.size)}
                </p>
              </div>
              <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="px-2.5 py-1.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sent</p>
                <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
                  {formatNumber(campaign.metrics.sends)}
                </p>
              </div>
              <Send className="h-4 w-4 text-purple-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="px-2.5 py-1.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Delivered</p>
                <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
                  {((campaign.metrics.delivered / campaign.metrics.sends) * 100).toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="px-2.5 py-1.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Replies</p>
                <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
                  {campaign.metrics.replies} <span className="text-[10px] font-normal text-gray-500">({((campaign.metrics.replies / campaign.metrics.sends) * 100).toFixed(1)}%)</span>
                </p>
              </div>
              <MessageSquare className="h-4 w-4 text-cyan-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hidden md:block">
          <CardContent className="px-2.5 py-1.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Positive</p>
                <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
                  {campaign.metrics.positive} <span className="text-[10px] font-normal text-gray-500">({campaign.metrics.replies > 0 ? ((campaign.metrics.positive / campaign.metrics.replies) * 100).toFixed(0) : 0}%)</span>
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hidden md:block">
          <CardContent className="px-2.5 py-1.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contracts</p>
                <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
                  {campaign.metrics.contracts} <span className="text-[10px] font-normal text-gray-500">(${campaign.metrics.contracts > 0 ? (campaign.metrics.cost / campaign.metrics.contracts).toFixed(0) : 0}/deal)</span>
                </p>
              </div>
              <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hidden md:block">
          <CardContent className="px-2.5 py-1.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Cost</p>
                <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
                  {formatCurrency(campaign.metrics.cost)} <span className="text-[10px] font-normal text-gray-500">(${(campaign.metrics.cost / campaign.metrics.sends).toFixed(3)}/msg)</span>
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar - Inline */}
      <div className="flex-shrink-0 flex items-center gap-3 mb-3 px-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
          Progress
        </span>
        <Progress value={campaign.progress} className="h-1.5 flex-1" />
        <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
          {campaign.progress}%
        </span>
        {isSimulating && (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
        )}
      </div>

      {/* Tabs - Scrollable Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 min-h-0 mt-3">
          {/* Step Funnel on top, Channel Performance + Sentiment below - fills available space */}
          <div className="h-full flex flex-col gap-2">
            {/* Step Funnel - Stacked vertical */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="py-1.5 px-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                  Step Funnel
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2 pt-0">
                <div className="space-y-1">
                  {mockAnalytics.stepFunnel.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-32 truncate">
                        {step.step}
                      </span>
                      <div className="relative flex-1">
                        <Progress
                          value={(step.delivered / step.sent) * 100}
                          className="h-5"
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium tabular-nums">
                          {formatNumber(step.delivered)} delivered • {step.replied} replied • {step.positive} positive
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 tabular-nums w-16 text-right">
                        {formatNumber(step.sent)} sent
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel Performance + Sentiment side by side - fills remaining space */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1 min-h-0">
              {/* Channel Performance - Visual cards */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col">
                <CardHeader className="py-1.5 px-3 flex-shrink-0">
                  <CardTitle className="text-sm">Channel Performance</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {[
                      { channel: "SMS", sends: 2240, replyRate: 12.5, cost: 33.60, color: "from-blue-500 to-blue-600", iconColor: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
                      { channel: "Email", sends: 1969, replyRate: 7.2, cost: 1.97, color: "from-purple-500 to-purple-600", iconColor: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
                      { channel: "Voicemail", sends: 906, replyRate: 4, cost: 90.60, color: "from-orange-500 to-orange-600", iconColor: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30" }
                    ].map((ch) => (
                      <div key={ch.channel} className={cn("rounded-lg p-2.5 border border-gray-100 dark:border-gray-700", ch.bgColor)}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {ch.channel === "SMS" && <MessageSquare className={cn("h-4 w-4", ch.iconColor)} />}
                            {ch.channel === "Email" && <Mail className={cn("h-4 w-4", ch.iconColor)} />}
                            {ch.channel === "Voicemail" && <Phone className={cn("h-4 w-4", ch.iconColor)} />}
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">{ch.channel}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-500 tabular-nums">{formatNumber(ch.sends)} sent</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full bg-gradient-to-r", ch.color)}
                                style={{ width: `${(ch.replyRate / 15) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-bold text-gray-900 dark:text-white tabular-nums">{ch.replyRate}%</span>
                            <span className="text-gray-500 tabular-nums">${ch.cost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Summary row */}
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Total across channels</span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-gray-900 dark:text-white tabular-nums">5,115 sends</span>
                      <span className="font-medium text-green-600 tabular-nums">8.5% avg reply</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sentiment Breakdown - Visual donut style */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col">
                <CardHeader className="py-1.5 px-3 flex-shrink-0">
                  <CardTitle className="text-sm">Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 flex-1 flex flex-col">
                  {/* Visual sentiment blocks */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {[
                      { label: "Positive", value: 142, pct: 41, color: "bg-gradient-to-br from-green-400 to-green-600", textColor: "text-green-700 dark:text-green-400", iconColor: "text-green-600", bgLight: "bg-green-50 dark:bg-green-950/30", iconType: "positive" },
                      { label: "Neutral", value: 108, pct: 31, color: "bg-gradient-to-br from-yellow-400 to-yellow-500", textColor: "text-yellow-700 dark:text-yellow-400", iconColor: "text-yellow-600", bgLight: "bg-yellow-50 dark:bg-yellow-950/30", iconType: "neutral" },
                      { label: "Negative", value: 48, pct: 14, color: "bg-gradient-to-br from-red-400 to-red-600", textColor: "text-red-700 dark:text-red-400", iconColor: "text-red-600", bgLight: "bg-red-50 dark:bg-red-950/30", iconType: "negative" },
                      { label: "Other", value: 52, pct: 15, color: "bg-gradient-to-br from-gray-400 to-gray-500", textColor: "text-gray-700 dark:text-gray-400", iconColor: "text-gray-500", bgLight: "bg-gray-50 dark:bg-gray-800", iconType: "other" }
                    ].map((item) => (
                      <div key={item.label} className={cn("rounded-lg p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col", item.bgLight)}>
                        <div className="flex items-center justify-between mb-1">
                          {item.iconType === "positive" && <TrendingUp className={cn("h-4 w-4", item.iconColor)} />}
                          {item.iconType === "neutral" && <Minus className={cn("h-4 w-4", item.iconColor)} />}
                          {item.iconType === "negative" && <TrendingDown className={cn("h-4 w-4", item.iconColor)} />}
                          {item.iconType === "other" && <HelpCircle className={cn("h-4 w-4", item.iconColor)} />}
                          <span className={cn("text-xl font-bold tabular-nums", item.textColor)}>{item.pct}%</span>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <div className={cn("h-1.5 rounded-full mb-1.5", item.color)} style={{ width: `${item.pct * 2}%` }} />
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                            <span className="text-xs text-gray-500 tabular-nums">{item.value}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Stacked bar at bottom */}
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="h-3 rounded-full overflow-hidden flex shadow-inner">
                      <div className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all" style={{ width: '41%' }} />
                      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full transition-all" style={{ width: '31%' }} />
                      <div className="bg-gradient-to-r from-red-400 to-red-500 h-full transition-all" style={{ width: '14%' }} />
                      <div className="bg-gradient-to-r from-gray-400 to-gray-500 h-full transition-all" style={{ width: '14%' }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-500">
                      <span>350 total replies analyzed</span>
                      <span className="font-medium text-green-600">72% actionable</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 min-h-0 mt-4">
          <ScrollArea className="h-full" type="always">
            <div className="pr-4 space-y-4 pb-6">
              {/* Time Range Selector */}
              <div className="flex justify-end">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Geographic Performance & A/B Test Side by Side */}
              <div className={cn("grid gap-4", campaign.abTest ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Geographic Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Location</TableHead>
                          <TableHead className="text-xs text-right">Sends</TableHead>
                          <TableHead className="text-xs text-right">Replies</TableHead>
                          <TableHead className="text-xs text-right">Rate</TableHead>
                          <TableHead className="text-xs text-right">Deals</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockAnalytics.geographicPerformance.map((location) => (
                          <TableRow key={location.location}>
                            <TableCell className="font-medium text-sm py-2">{location.location}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">{location.sends}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">{location.replies}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">
                              {((location.replies / location.sends) * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-right py-2">
                              <Badge variant={location.contracts > 0 ? "default" : "secondary"} className="text-xs">
                                {location.contracts}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* A/B Test Results (if applicable) */}
                {campaign.abTest && (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TestTube className="h-4 w-4" />
                        A/B Test Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Variant</TableHead>
                            <TableHead className="text-xs text-right">Sends</TableHead>
                            <TableHead className="text-xs text-right">Reply</TableHead>
                            <TableHead className="text-xs text-right">Positive</TableHead>
                            <TableHead className="text-xs text-right">$/Reply</TableHead>
                            <TableHead className="text-xs"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium text-sm py-2">Variant A</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">625</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">12.8%</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">48.8%</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">$0.47</TableCell>
                            <TableCell className="py-2">
                              <Badge className="bg-green-100 text-green-700 text-xs">Winner</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium text-sm py-2">Variant B</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">625</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">10.4%</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">43.1%</TableCell>
                            <TableCell className="text-right tabular-nums text-sm py-2">$0.58</TableCell>
                            <TableCell className="py-2">-</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="deliveries" className="flex-1 min-h-0 mt-4">
          <ScrollArea className="h-full" type="always">
            <div className="pr-4 pb-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Lead</TableHead>
                        <TableHead className="text-xs">Property</TableHead>
                        <TableHead className="text-xs">Step</TableHead>
                        <TableHead className="text-xs">Channel</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Sentiment</TableHead>
                        <TableHead className="text-xs">Sent At</TableHead>
                        <TableHead className="text-xs text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveries.slice(0, 20).map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="py-2">
                            <div>
                              <p className="font-medium text-sm">{delivery.leadName}</p>
                              <p className="text-xs text-gray-500">{delivery.leadId}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm py-2">{delivery.property}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="text-xs">
                              Step {delivery.step}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="secondary" className="text-xs">
                              {delivery.channel.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className={cn("text-sm font-medium", getDeliveryStatusColor(delivery.status))}>
                              {delivery.status}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            {delivery.sentiment && getSentimentIcon(delivery.sentiment)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 py-2">
                            {delivery.sentAt.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-right tabular-nums py-2">
                            ${delivery.cost.toFixed(3)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="audience" className="flex-1 min-h-0 mt-4">
          <ScrollArea className="h-full" type="always">
            <div className="pr-4 pb-6">
              {/* Side by side layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Audience Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {campaign.audience.filters.map((filter: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {filter}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Matched</span>
                        <span className="font-medium tabular-nums">{formatNumber(campaign.audience.size)} leads</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Audience Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Sample of leads matching your criteria:
                    </p>
                    <div className="space-y-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                          <div>
                            <p className="text-sm font-medium">Lead #{1000 + i}</p>
                            <p className="text-xs text-gray-500">
                              {100 + i * 10} Main St, Miami, FL
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">Probate</Badge>
                            <Badge variant="outline" className="text-xs">High Equity</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 min-h-0 mt-4">
          <ScrollArea className="h-full" type="always">
            <div className="pr-4 pb-6">
              {/* Side by side layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Compliance Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">DNC Check</span>
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Consent Required</span>
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quiet Hours</span>
                      <span className="text-sm text-gray-600">8:00 AM - 8:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Opt-out Handling</span>
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Automatic
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Throttle Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Max per Day</span>
                      <span className="text-sm font-medium tabular-nums">500</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Max per Hour</span>
                      <span className="text-sm font-medium tabular-nums">100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current Rate</span>
                      <span className="text-sm font-medium text-green-600 tabular-nums">42/hour</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Re-export for use in pages
export default CampaignDetail;