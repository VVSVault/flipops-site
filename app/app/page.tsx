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
  ArrowRight,
  Phone,
  Mail,
  Home
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

interface DashboardStats {
  newLeads24h: number;
  newLeads7d: number;
  newLeadsPrevious24h: number;
  newLeadsPrevious7d: number;
  propertiesContacted: number;
  propertiesContactedPrevious: number;
  propertiesSkipTraced: number;
  propertiesSkipTracedPrevious: number;
  tasksOverdue: number;
  tasksCompleted: number;
}

interface HotLead {
  id: string;
  address: string;
  city: string;
  state: string;
  score: number;
  dataSource: string;
  skipTraced: boolean;
  contacted: boolean;
}

interface ActionItem {
  id: string;
  type: 'first_contact' | 'follow_up' | 'overdue_task';
  title: string;
  description: string;
  propertyAddress?: string;
  dueDate?: string;
  priority?: string;
}

interface OverdueTask {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  propertyAddress?: string;
  overdueDays: number;
}

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, hotLeadsRes, actionItemsRes, overdueTasksRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/hot-leads'),
        fetch('/api/dashboard/action-items'),
        fetch('/api/dashboard/overdue-tasks'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (hotLeadsRes.ok) {
        const data = await hotLeadsRes.json();
        setHotLeads(data.hotLeads || []);
      }

      if (actionItemsRes.ok) {
        const data = await actionItemsRes.json();
        setActionItems(data.actionItems || []);
      }

      if (overdueTasksRes.ok) {
        const data = await overdueTasksRes.json();
        setOverdueTasks(data.overdueTasks || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPI trends
  const calculateTrend = (current: number, previous: number): { change: string; trend: 'up' | 'down' | 'neutral' } => {
    const diff = current - previous;
    if (diff === 0) return { change: '0', trend: 'neutral' };
    const percentChange = previous > 0 ? ((diff / previous) * 100).toFixed(0) : '100';
    return {
      change: diff > 0 ? `+${percentChange}%` : `${percentChange}%`,
      trend: diff > 0 ? 'up' : 'down',
    };
  };

  const kpis = stats ? [
    {
      label: "New Leads (24h)",
      value: stats.newLeads24h.toString(),
      ...calculateTrend(stats.newLeads24h, stats.newLeadsPrevious24h),
      icon: Users,
    },
    {
      label: "New Leads (7d)",
      value: stats.newLeads7d.toString(),
      ...calculateTrend(stats.newLeads7d, stats.newLeadsPrevious7d),
      icon: Users,
    },
    {
      label: "Contacted",
      value: stats.propertiesContacted.toString(),
      ...calculateTrend(stats.propertiesContacted, stats.propertiesContactedPrevious),
      icon: MessageSquare,
    },
    {
      label: "Skip Traced",
      value: stats.propertiesSkipTraced.toString(),
      ...calculateTrend(stats.propertiesSkipTraced, stats.propertiesSkipTracedPrevious),
      icon: FileText,
    },
    {
      label: "Overdue Tasks",
      value: stats.tasksOverdue.toString(),
      change: stats.tasksOverdue > 0 ? `${stats.tasksOverdue} need attention` : 'All clear',
      trend: stats.tasksOverdue > 0 ? 'down' : 'neutral',
      icon: AlertCircle,
    },
    {
      label: "Completed Tasks",
      value: stats.tasksCompleted.toString(),
      change: `${stats.tasksCompleted} today`,
      trend: stats.tasksCompleted > 0 ? 'up' : 'neutral',
      icon: CheckCircle,
    },
  ] : [];

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

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
                {kpi.change}
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
            {hotLeads.length > 0 ? (
              <>
                <div className="space-y-3">
                  {hotLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {lead.address}, {lead.city}, {lead.state}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {lead.dataSource}
                          </Badge>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Score: {lead.score}</span>
                          {lead.skipTraced && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Skip Traced
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Link href={`/app/leads`}>
                        <Button size="sm" variant="ghost">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                <Link href="/app/leads">
                  <Button className="w-full mt-4" variant="outline">
                    View All Hot Leads
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">No hot leads at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Action Items */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Today's Action Items</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Tasks and follow-ups due today
              </CardDescription>
            </div>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {actionItems.length > 0 ? (
              <>
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                        {item.propertyAddress && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{item.propertyAddress}</p>
                        )}
                      </div>
                      <Link href="/app/tasks">
                        <Button size="sm" variant="ghost">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                <Link href="/app/tasks">
                  <Button className="w-full mt-4" variant="outline">
                    View All Tasks
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">No action items for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Overdue Tasks</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Tasks requiring immediate attention
              </CardDescription>
            </div>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            {overdueTasks.length > 0 ? (
              <>
                <div className="space-y-3">
                  {overdueTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                        <p className="text-xs text-red-400 mt-1">
                          Overdue {task.overdueDays} {task.overdueDays === 1 ? 'day' : 'days'}
                          {task.priority === 'high' && ' • High Priority'}
                        </p>
                        {task.propertyAddress && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{task.propertyAddress}</p>
                        )}
                      </div>
                      <Link href="/app/tasks?filter=overdue">
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
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-green-600 dark:text-green-400">All tasks are up to date!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}