"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  FileText, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const kpis = [
  {
    label: "New Leads (24h)",
    value: "12",
    change: "+20%",
    trend: "up",
    icon: Users,
  },
  {
    label: "New Leads (7d)",
    value: "84",
    change: "+15%",
    trend: "up",
    icon: Users,
  },
  {
    label: "Engaged",
    value: "23",
    change: "+8%",
    trend: "up",
    icon: MessageSquare,
  },
  {
    label: "Offers Out",
    value: "7",
    change: "-2",
    trend: "down",
    icon: FileText,
  },
  {
    label: "Under Contract",
    value: "3",
    change: "0",
    trend: "neutral",
    icon: CheckCircle,
  },
  {
    label: "Closed Won",
    value: "$1.2M",
    change: "+$200K",
    trend: "up",
    icon: DollarSign,
  },
];

const hotLeads = [
  { id: "L-1234", property: "123 Main St", score: 92, source: "PPC", status: "Hot" },
  { id: "L-1235", property: "456 Oak Ave", score: 88, source: "Direct Mail", status: "Warm" },
  { id: "L-1236", property: "789 Pine Rd", score: 85, source: "Cold Call", status: "Warm" },
];

const needsUnderwriting = [
  { id: "P-5678", address: "321 Elm St", arv: "$250K", repairs: "TBD" },
  { id: "P-5679", address: "654 Maple Dr", arv: "$180K", repairs: "TBD" },
];

const slaBreaches = [
  { lead: "L-1237", task: "Follow up call", overdue: "2 days" },
  { lead: "L-1238", task: "Send offer", overdue: "1 day" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back! Here's what's happening with your deals.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                {kpi.trend === "up" && (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                {kpi.trend === "down" && (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{kpi.label}</p>
              <p className={cn(
                "text-xs mt-2",
                kpi.trend === "up" ? "text-green-500" : 
                kpi.trend === "down" ? "text-red-500" : "text-gray-500"
              )}>
                {kpi.change} from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hot Leads */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Hot Leads</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Leads with score ≥ 85
              </CardDescription>
            </div>
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hotLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.property}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {lead.source}
                      </Badge>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Score: {lead.score}</span>
                    </div>
                  </div>
                  <Link href={`/app/leads/${lead.id}`}>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <Link href="/app/leads?filter=hot">
              <Button className="w-full mt-4" variant="outline">
                View All Hot Leads
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Needs Underwriting */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Needs Underwriting</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Properties pending analysis
              </CardDescription>
            </div>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsUnderwriting.map((property) => (
                <div key={property.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{property.address}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">ARV: {property.arv} | Repairs: {property.repairs}</p>
                  </div>
                  <Link href={`/app/underwriting/${property.id}`}>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <Link href="/app/underwriting">
              <Button className="w-full mt-4" variant="outline">
                Go to Underwriting
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* SLA Breaches */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">SLA Breaches</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Overdue tasks requiring attention
              </CardDescription>
            </div>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {slaBreaches.map((breach, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{breach.task}</p>
                    <p className="text-xs text-red-400 mt-1">Lead {breach.lead} • Overdue {breach.overdue}</p>
                  </div>
                  <Link href={`/app/tasks?lead=${breach.lead}`}>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <Link href="/app/tasks?filter=overdue">
              <Button className="w-full mt-4" variant="outline">
                View All Overdue Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Automation Health */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Automation Health</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            System status and recent job performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Data Scrapers</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Last run: 5 min ago</p>
              <p className="text-xs text-green-500">All systems operational</p>
            </div>
            
            <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">SMS Gateway</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Sent today: 47</p>
              <p className="text-xs text-green-500">99.8% delivery rate</p>
            </div>
            
            <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Email Service</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Queue: 12 pending</p>
              <p className="text-xs text-yellow-500">Minor delays (&lt; 5 min)</p>
            </div>
            
            <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">AI Scoring</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Processed: 84 leads</p>
              <p className="text-xs text-green-500">Avg response: 1.2s</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}