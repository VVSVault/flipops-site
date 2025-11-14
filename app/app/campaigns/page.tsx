1"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus,
  MoreVertical,
  Play,
  Pause,
  Copy,
  Archive,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TestTube,
  BarChart3,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,``
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CampaignWizard } from "../components/campaign-wizard";
import { CampaignDetail } from "../components/campaign-detail";
import { seedCampaigns } from "./seed-data";

// Use seed data for campaigns
const mockCampaigns = seedCampaigns.map(campaign => ({
  ...campaign,
  lastRun: campaign.lastRun ? new Date(campaign.lastRun) : null,
  createdAt: new Date(campaign.createdAt)
}));

// Original mock data (kept for reference)
const originalMockCampaigns = [
  {
    id: "CMP-001",
    name: "Probate Leads - Q1 2025",
    status: "running",
    objective: "inbound",
    audience: {
      size: 1250,
      filters: ["Probate", "High Equity", "Owner Occupied"]
    },
    channels: ["sms", "email"],
    abTest: true,
    metrics: {
      sends: 3750,
      delivered: 3712,
      replies: 298,
      positive: 142,
      appointments: 18,
      contracts: 3,
      cost: 487.50
    },
    progress: 75,
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: "CMP-002",
    name: "Tax Delinquent - Miami-Dade",
    status: "paused",
    objective: "inbound",
    audience: {
      size: 890,
      filters: ["Tax Delinquent", "30+ Days", "SFR"]
    },
    channels: ["sms", "voicemail"],
    abTest: false,
    metrics: {
      sends: 1780,
      delivered: 1745,
      replies: 178,
      positive: 71,
      appointments: 12,
      contracts: 2,
      cost: 356.00
    },
    progress: 50,
    lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  },
  {
    id: "CMP-003",
    name: "Code Violations - Orlando",
    status: "running",
    objective: "inbound",
    audience: {
      size: 456,
      filters: ["Code Violations", "2+ Violations", "Absentee Owner"]
    },
    channels: ["sms", "email", "letter"],
    abTest: true,
    metrics: {
      sends: 912,
      delivered: 901,
      replies: 64,
      positive: 28,
      appointments: 5,
      contracts: 1,
      cost: 248.75
    },
    progress: 40,
    lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: "CMP-004",
    name: "Tired Landlords Re-engagement",
    status: "draft",
    objective: "reengage",
    audience: {
      size: 320,
      filters: ["Absentee Owner", "Multi-Family", "High DOM"]
    },
    channels: ["email"],
    abTest: false,
    metrics: {
      sends: 0,
      delivered: 0,
      replies: 0,
      positive: 0,
      appointments: 0,
      contracts: 0,
      cost: 0
    },
    progress: 0,
    lastRun: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: "CMP-005",
    name: "Buyer Blast - Fix & Flip Deals",
    status: "completed",
    objective: "disposition",
    audience: {
      size: 180,
      filters: ["Active Buyers", "Cash Only", "Fix & Flip"]
    },
    channels: ["sms", "email"],
    abTest: false,
    metrics: {
      sends: 360,
      delivered: 358,
      replies: 72,
      positive: 45,
      appointments: 8,
      contracts: 2,
      cost: 54.00
    },
    progress: 100,
    lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  }
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [objectiveFilter, setObjectiveFilter] = useState("all");
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "paused": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "completed": return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
      case "draft": return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <Play className="h-3 w-3" />;
      case "paused": return <Pause className="h-3 w-3" />;
      case "completed": return <CheckCircle className="h-3 w-3" />;
      case "draft": return <Clock className="h-3 w-3" />;
      default: return null;
    }
  };

  const getObjectiveLabel = (objective: string) => {
    switch (objective) {
      case "inbound": return "Lead Generation";
      case "reengage": return "Re-engagement";
      case "disposition": return "Buyer Marketing";
      default: return objective;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (searchQuery && !campaign.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && campaign.status !== statusFilter) {
      return false;
    }
    if (objectiveFilter !== "all" && campaign.objective !== objectiveFilter) {
      return false;
    }
    return true;
  });

  const handleBulkAction = (action: string) => {
    switch (action) {
      case "pause":
        setCampaigns(prev => prev.map(c => 
          selectedCampaigns.includes(c.id) && c.status === "running" 
            ? { ...c, status: "paused" } 
            : c
        ));
        break;
      case "resume":
        setCampaigns(prev => prev.map(c => 
          selectedCampaigns.includes(c.id) && c.status === "paused" 
            ? { ...c, status: "running" } 
            : c
        ));
        break;
      case "duplicate":
        // Implementation for duplicate
        break;
      case "archive":
        setCampaigns(prev => prev.filter(c => !selectedCampaigns.includes(c.id)));
        break;
    }
    setSelectedCampaigns([]);
  };

  // Calculate summary stats
  const totalSends = filteredCampaigns.reduce((sum, c) => sum + c.metrics.sends, 0);
  const totalReplies = filteredCampaigns.reduce((sum, c) => sum + c.metrics.replies, 0);
  const totalContracts = filteredCampaigns.reduce((sum, c) => sum + c.metrics.contracts, 0);
  const totalCost = filteredCampaigns.reduce((sum, c) => sum + c.metrics.cost, 0);
  const avgReplyRate = totalSends > 0 ? (totalReplies / totalSends * 100) : 0;
  const avgPositiveRate = totalReplies > 0 
    ? (filteredCampaigns.reduce((sum, c) => sum + c.metrics.positive, 0) / totalReplies * 100) 
    : 0;

  if (selectedCampaign) {
    return (
      <CampaignDetail 
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage automated multi-channel outreach campaigns
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4 flex-shrink-0">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaigns.filter(c => c.status === "running").length}
                </p>
              </div>
              <Play className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sends</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalSends.toLocaleString()}
                </p>
              </div>
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reply Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgReplyRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Positive</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgPositiveRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Contracts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalContracts}
                </p>
              </div>
              <FileText className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalCost)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-4 flex-shrink-0">
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Objective" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Objectives</SelectItem>
                <SelectItem value="inbound">Lead Generation</SelectItem>
                <SelectItem value="reengage">Re-engagement</SelectItem>
                <SelectItem value="disposition">Buyer Marketing</SelectItem>
              </SelectContent>
            </Select>
            {selectedCampaigns.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("pause")}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("resume")}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("duplicate")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("archive")}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-1 min-h-0 overflow-hidden">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b">
                <TableRow className="border-gray-200 dark:border-gray-700">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCampaigns(filteredCampaigns.map(c => c.id));
                      } else {
                        setSelectedCampaigns([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow 
                  key={campaign.id}
                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.includes(campaign.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCampaigns([...selectedCampaigns, campaign.id]);
                        } else {
                          setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaign.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {campaign.name}
                        </p>
                        {campaign.abTest && (
                          <Badge variant="outline" className="text-xs">
                            <TestTube className="h-3 w-3 mr-1" />
                            A/B
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {campaign.id} • {getObjectiveLabel(campaign.objective)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("gap-1", getStatusColor(campaign.status))}>
                      {getStatusIcon(campaign.status)}
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {campaign.audience.size.toLocaleString()} leads
                      </p>
                      <div className="flex gap-1 mt-1">
                        {campaign.audience.filters.slice(0, 2).map((filter, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {filter}
                          </Badge>
                        ))}
                        {campaign.audience.filters.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{campaign.audience.filters.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {campaign.channels.includes("sms") && (
                        <Badge variant="outline" className="text-xs">SMS</Badge>
                      )}
                      {campaign.channels.includes("email") && (
                        <Badge variant="outline" className="text-xs">Email</Badge>
                      )}
                      {campaign.channels.includes("voicemail") && (
                        <Badge variant="outline" className="text-xs">VM</Badge>
                      )}
                      {campaign.channels.includes("letter") && (
                        <Badge variant="outline" className="text-xs">Letter</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {campaign.metrics.replies}/{campaign.metrics.sends} replies
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {campaign.metrics.sends > 0 
                            ? (campaign.metrics.replies / campaign.metrics.sends * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={campaign.progress} 
                        className="h-1.5"
                      />
                      <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{campaign.metrics.positive} positive</span>
                        <span>{campaign.metrics.appointments} appts</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {campaign.metrics.contracts} deals
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(campaign.metrics.cost)}
                      </p>
                      {campaign.metrics.contracts > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(campaign.metrics.cost / campaign.metrics.contracts)}/deal
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {campaign.lastRun ? (
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {new Date(campaign.lastRun).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(campaign.lastRun).toLocaleTimeString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {campaign.status === "running" && (
                          <DropdownMenuItem>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Campaign
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "paused" && (
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Resume Campaign
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Campaign Wizard Modal */}
      <CampaignWizard 
        open={showWizard}
        onOpenChange={setShowWizard}
        onComplete={(campaign) => {
          setCampaigns([...campaigns, campaign]);
          setShowWizard(false);
        }}
      />
    </div>
  );
}