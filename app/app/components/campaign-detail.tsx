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
  Target
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Audience</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {campaign.audience.size.toLocaleString()}
                </p>
              </div>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Sent</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {campaign.metrics.sends.toLocaleString()}
                </p>
              </div>
              <Send className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Delivered</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {((campaign.metrics.delivered / campaign.metrics.sends) * 100).toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Replies</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {campaign.metrics.replies}
                </p>
                <p className="text-xs text-gray-500">
                  {((campaign.metrics.replies / campaign.metrics.sends) * 100).toFixed(1)}%
                </p>
              </div>
              <MessageSquare className="h-6 w-6 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Positive</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {campaign.metrics.positive}
                </p>
                <p className="text-xs text-gray-500">
                  {campaign.metrics.replies > 0 
                    ? ((campaign.metrics.positive / campaign.metrics.replies) * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Contracts</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {campaign.metrics.contracts}
                </p>
                <p className="text-xs text-gray-500">
                  ${campaign.metrics.contracts > 0 
                    ? (campaign.metrics.cost / campaign.metrics.contracts).toFixed(0) 
                    : 0}/deal
                </p>
              </div>
              <FileText className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Cost</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(campaign.metrics.cost)}
                </p>
                <p className="text-xs text-gray-500">
                  ${(campaign.metrics.cost / campaign.metrics.sends).toFixed(3)}/msg
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Campaign Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {campaign.progress}% Complete
            </span>
          </div>
          <Progress value={campaign.progress} className="h-2" />
          {isSimulating && (
            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Simulating campaign activity...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Step Funnel */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Step Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.stepFunnel.map((step, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {step.step}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {step.sent} sent
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(step.delivered / step.sent) * 100} 
                        className="h-8"
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                        {step.delivered} delivered • {step.replied} replied • {step.positive} positive
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Channel Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm">Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Sends</TableHead>
                      <TableHead>Reply %</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAnalytics.channelPerformance.map((channel) => (
                      <TableRow key={channel.channel}>
                        <TableCell className="font-medium">{channel.channel}</TableCell>
                        <TableCell>{channel.sends.toLocaleString()}</TableCell>
                        <TableCell>{channel.replyRate}%</TableCell>
                        <TableCell>${channel.cost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm">Sentiment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full" />
                      <span className="text-sm">Positive</span>
                    </div>
                    <span className="text-sm font-medium">
                      {mockAnalytics.sentimentBreakdown.positive} ({((mockAnalytics.sentimentBreakdown.positive / 350) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full" />
                      <span className="text-sm">Neutral</span>
                    </div>
                    <span className="text-sm font-medium">
                      {mockAnalytics.sentimentBreakdown.neutral} ({((mockAnalytics.sentimentBreakdown.neutral / 350) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full" />
                      <span className="text-sm">Negative</span>
                    </div>
                    <span className="text-sm font-medium">
                      {mockAnalytics.sentimentBreakdown.negative} ({((mockAnalytics.sentimentBreakdown.negative / 350) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-gray-500 rounded-full" />
                      <span className="text-sm">Unclassified</span>
                    </div>
                    <span className="text-sm font-medium">
                      {mockAnalytics.sentimentBreakdown.unclassified} ({((mockAnalytics.sentimentBreakdown.unclassified / 350) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
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

          {/* Geographic Performance */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm">Geographic Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Sends</TableHead>
                    <TableHead>Replies</TableHead>
                    <TableHead>Reply Rate</TableHead>
                    <TableHead>Contracts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAnalytics.geographicPerformance.map((location) => (
                    <TableRow key={location.location}>
                      <TableCell className="font-medium">{location.location}</TableCell>
                      <TableCell>{location.sends}</TableCell>
                      <TableCell>{location.replies}</TableCell>
                      <TableCell>
                        {((location.replies / location.sends) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.contracts > 0 ? "default" : "secondary"}>
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
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  A/B Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant</TableHead>
                      <TableHead>Sends</TableHead>
                      <TableHead>Reply Rate</TableHead>
                      <TableHead>Positive Rate</TableHead>
                      <TableHead>Cost/Reply</TableHead>
                      <TableHead>Winner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Variant A</TableCell>
                      <TableCell>625</TableCell>
                      <TableCell>12.8%</TableCell>
                      <TableCell>48.8%</TableCell>
                      <TableCell>$0.47</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">Winner</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Variant B</TableCell>
                      <TableCell>625</TableCell>
                      <TableCell>10.4%</TableCell>
                      <TableCell>43.1%</TableCell>
                      <TableCell>$0.58</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.slice(0, 20).map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{delivery.leadName}</p>
                          <p className="text-xs text-gray-500">{delivery.leadId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{delivery.property}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          Step {delivery.step}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {delivery.channel.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-sm font-medium", getDeliveryStatusColor(delivery.status))}>
                          {delivery.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {delivery.sentiment && getSentimentIcon(delivery.sentiment)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {delivery.sentAt.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        ${delivery.cost.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm">Audience Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {campaign.audience.filters.map((filter: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {filter}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm">Audience Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sample of leads matching your criteria:
              </p>
              <div className="mt-4 space-y-2">
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
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Compliance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Throttle Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Max per Day</span>
                <span className="text-sm font-medium">500</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Max per Hour</span>
                <span className="text-sm font-medium">100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Rate</span>
                <span className="text-sm font-medium text-green-600">42/hour</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}