"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  User,
  Target,
  FileText,
  Phone,
  Home,
  DollarSign,
  Zap,
  PlayCircle,
  PauseCircle,
  RotateCw,
  Tag,
  MessageSquare,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  Square,
  Circle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { tasksSeedData, type Task, type TaskSubtask, type TaskTemplate } from "./seed-data";

export default function TasksPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    status: "all",
    priority: "all",
    type: "all",
    assignee: "all"
  });
  
  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get all tasks with subtasks
  const getTaskWithDetails = (taskId: string) => {
    const task = tasksSeedData.tasks.find(t => t.id === taskId);
    const subtasks = tasksSeedData.subtasks.filter(s => s.taskId === taskId);
    const activities = tasksSeedData.activities.filter(a => a.taskId === taskId);
    const comments = tasksSeedData.comments.filter(c => c.taskId === taskId);
    return { task, subtasks, activities, comments };
  };

  // Filter tasks based on criteria
  const filterTasks = (tasks: Task[]) => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedFilters.status === "all" || task.status === selectedFilters.status;
      const matchesPriority = selectedFilters.priority === "all" || task.priority === selectedFilters.priority;
      const matchesType = selectedFilters.type === "all" || task.type === selectedFilters.type;
      const matchesAssignee = selectedFilters.assignee === "all" || 
        (selectedFilters.assignee === "me" && task.assigneeId === "USER-001") ||
        task.assigneeId === selectedFilters.assignee;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesAssignee;
    });
  };

  // Get filtered tasks for current tab
  const getTasksForTab = () => {
    let tasks = [...tasksSeedData.tasks];
    
    if (activeTab === "my-tasks") {
      tasks = tasks.filter(t => t.assigneeId === "USER-001"); // Simulated current user
    } else if (activeTab === "team-tasks") {
      // All tasks for team view
    }
    
    return filterTasks(tasks);
  };

  // Calculate time until due
  const getTimeUntilDue = (dueAt: string) => {
    const now = new Date();
    const due = new Date(dueAt);
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return "Overdue";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  // Get priority icon and color
  const getPriorityBadge = (priority: Task['priority']) => {
    const configs = {
      urgent: { icon: ArrowUp, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
      high: { icon: ArrowUp, className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
      normal: { icon: ArrowRight, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      low: { icon: ArrowDown, className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" }
    };
    
    const config = configs[priority];
    const Icon = config.icon;
    
    return (
      <Badge className={cn("gap-1", config.className)}>
        <Icon className="h-3 w-3" />
        {priority}
      </Badge>
    );
  };

  // Get task type icon
  const getTaskTypeIcon = (type: Task['type']) => {
    const icons = {
      call: Phone,
      'follow-up': MessageSquare,
      inspection: Home,
      underwriting: DollarSign,
      dispo: Target,
      document: FileText,
      generic: Circle
    };
    return icons[type] || Circle;
  };

  // Get SLA status badge
  const getSLABadge = (task: Task) => {
    if (!task.slaStatus) return null;
    
    const configs = {
      'on-track': { className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "On Track" },
      'at-risk': { className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", label: "At Risk" },
      'violated': { className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "SLA Violated" }
    };
    
    const config = configs[task.slaStatus];
    
    return (
      <Badge className={cn("gap-1", config.className)}>
        <AlertTriangle className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-6.5rem)] bg-gray-50 dark:bg-gray-950 p-2 gap-3 overflow-hidden items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const filteredTasks = getTasksForTab();
  const overdueTasks = filteredTasks.filter(t => t.status === 'overdue').length;
  const urgentTasks = filteredTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const completedToday = filteredTasks.filter(t => 
    t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="flex h-[calc(100vh-6.5rem)] bg-gray-50 dark:bg-gray-950 p-2 gap-3 overflow-hidden">
      <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your to-dos and follow-ups</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RotateCw className="h-4 w-4 mr-2" />
                Sync Tasks
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueTasks}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Urgent</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{urgentTasks}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Due Today</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {filteredTasks.filter(t => {
                        const due = new Date(t.dueAt);
                        return due.toDateString() === new Date().toDateString();
                      }).length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Completed Today</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedToday}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 h-10">
            <TabsTrigger value="my-tasks" className="gap-2">
              <User className="h-4 w-4" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="team-tasks" className="gap-2">
              <Users className="h-4 w-4" />
              Team Tasks
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Copy className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {/* My Tasks / Team Tasks */}
              {(activeTab === "my-tasks" || activeTab === "team-tasks") && (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedFilters.status} onValueChange={(value) => 
                      setSelectedFilters({...selectedFilters, status: value})
                    }>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedFilters.priority} onValueChange={(value) => 
                      setSelectedFilters({...selectedFilters, priority: value})
                    }>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                    </Button>
                  </div>

                  {/* Task List */}
                  <Card className="overflow-hidden">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2 p-4">
                        {filteredTasks.map(task => {
                          const { subtasks } = getTaskWithDetails(task.id);
                          const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;
                          const TypeIcon = getTaskTypeIcon(task.type);
                          
                          return (
                            <div
                              key={task.id}
                              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowTaskDrawer(true);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <Checkbox 
                                    checked={task.status === 'completed'}
                                    onClick={(e) => e.stopPropagation()}
                                    onCheckedChange={() => toast.success("Task status updated")}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <TypeIcon className="h-4 w-4 text-gray-500" />
                                      <h4 className={cn(
                                        "font-medium",
                                        task.status === 'completed' && "line-through text-gray-500"
                                      )}>
                                        {task.title}
                                      </h4>
                                      {getPriorityBadge(task.priority)}
                                      {getSLABadge(task)}
                                    </div>
                                    {task.description && (
                                      <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      {task.linkedEntity && (
                                        <div className="flex items-center gap-1">
                                          {task.linkedEntity.type === 'lead' ? (
                                            <User className="h-3 w-3" />
                                          ) : (
                                            <Home className="h-3 w-3" />
                                          )}
                                          <span>{task.linkedEntity.name}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span className={cn(
                                          task.status === 'overdue' && "text-red-600 font-medium"
                                        )}>
                                          {getTimeUntilDue(task.dueAt)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span>{task.assigneeName}</span>
                                      </div>
                                      {subtasks.length > 0 && (
                                        <div className="flex items-center gap-1">
                                          <CheckSquare className="h-3 w-3" />
                                          <span>{completedSubtasks}/{subtasks.length}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <User className="h-4 w-4 mr-2" />
                                      Reassign
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Clock className="h-4 w-4 mr-2" />
                                      Snooze
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              )}

              {/* Calendar View */}
              {activeTab === "calendar" && (
                <div className="space-y-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Today
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="text-lg font-semibold">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="week">
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <Card className="overflow-hidden">
                    <ScrollArea className="w-full">
                      <div className="min-w-full md:min-w-[700px]">
                        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                              {day}
                            </div>
                          ))}
                        </div>
                        <ScrollArea className="h-[520px]">
                          <div className="grid grid-cols-7">
                            {Array.from({ length: 35 }, (_, i) => {
                              const date = new Date();
                              date.setDate(date.getDate() - date.getDay() + i - 7); // Start from previous week
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isCurrentMonth = date.getMonth() === new Date().getMonth();
                              const dayTasks = filteredTasks.filter(task => 
                                new Date(task.dueAt).toDateString() === date.toDateString()
                              );
                              
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    "min-h-[100px] p-1.5 border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0",
                                    !isCurrentMonth && "bg-gray-50 dark:bg-gray-900/50",
                                    isToday && "bg-blue-50 dark:bg-blue-900/20"
                                  )}
                                >
                                  <div className={cn(
                                    "text-xs font-medium mb-1 px-1",
                                    isToday ? "text-blue-600" : isCurrentMonth ? "text-gray-900 dark:text-gray-100" : "text-gray-400"
                                  )}>
                                    {date.getDate()}
                                  </div>
                                  <div className="space-y-0.5 px-0.5">
                                    {dayTasks.slice(0, 2).map(task => {
                                      const TypeIcon = getTaskTypeIcon(task.type);
                                      return (
                                        <div
                                          key={task.id}
                                          className={cn(
                                            "text-[10px] p-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity",
                                            task.priority === 'urgent' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                            task.priority === 'high' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                                            task.priority === 'normal' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                            task.priority === 'low' && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                          )}
                                          onClick={() => {
                                            setSelectedTask(task);
                                            setShowTaskDrawer(true);
                                          }}
                                        >
                                          <div className="flex items-center gap-0.5">
                                            <TypeIcon className="h-2.5 w-2.5 flex-shrink-0" />
                                            <span className="truncate">{task.title}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {dayTasks.length > 2 && (
                                      <div className="text-[10px] text-gray-500 pl-0.5">
                                        +{dayTasks.length - 2} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              )}

              {/* Templates */}
              {activeTab === "templates" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Task Templates</h3>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasksSeedData.templates.map(template => {
                      const TypeIcon = getTaskTypeIcon(template.type);
                      return (
                        <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-5 w-5 text-gray-500" />
                                <h4 className="font-medium">{template.name}</h4>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline">{template.defaultPriority}</Badge>
                                <Badge variant="outline">{template.defaultAssigneeRole}</Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                SLA: {template.slaMinutes} minutes
                              </div>
                              {template.recurrenceRule && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                  <RotateCw className="h-3 w-3" />
                                  Recurring
                                </div>
                              )}
                              {template.subtasks && template.subtasks.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  {template.subtasks.length} subtasks
                                </div>
                              )}
                            </div>
                            <Button className="w-full mt-4" size="sm">
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Use Template
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Analytics */}
              {activeTab === "analytics" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* SLA Compliance */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">SLA Compliance</CardTitle>
                        <CardDescription className="text-xs">Performance by role</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">Overall</span>
                              <span className="text-xs font-bold">{tasksSeedData.analytics.slaCompliance.overall}%</span>
                            </div>
                            <Progress value={tasksSeedData.analytics.slaCompliance.overall} className="h-1.5" />
                          </div>
                          {Object.entries(tasksSeedData.analytics.slaCompliance.byRole).map(([role, value]) => (
                            <div key={role}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs capitalize">{role}</span>
                                <span className="text-xs font-medium">{value}%</span>
                              </div>
                              <Progress value={value} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Avg Completion Time */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Avg Completion Time</CardTitle>
                        <CardDescription className="text-xs">By task type (hours)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(tasksSeedData.analytics.avgCompletionTime.byType).map(([type, hours]) => {
                            const Icon = getTaskTypeIcon(type as Task['type']);
                            return (
                              <div key={type} className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Icon className="h-3.5 w-3.5 text-gray-500" />
                                  <span className="text-xs capitalize">{type.replace('-', ' ')}</span>
                                </div>
                                <span className="text-xs font-medium">{hours}h</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Trigger Sources */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Trigger Sources</CardTitle>
                        <CardDescription className="text-xs">How tasks are created</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2.5">
                          {Object.entries(tasksSeedData.analytics.triggerBreakdown).map(([source, percentage]) => (
                            <div key={source}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs capitalize">{source}</span>
                                <span className="text-xs font-medium">{percentage}%</span>
                              </div>
                              <Progress value={percentage} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Task Performance Summary - Full Width Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Task Performance Summary</CardTitle>
                      <CardDescription className="text-xs">Team productivity metrics for the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-gray-500">Completed</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">247</p>
                          <p className="text-xs text-gray-500">+12% from last month</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-gray-500">Overdue</span>
                          </div>
                          <p className="text-2xl font-bold text-red-600">18</p>
                          <p className="text-xs text-gray-500">-5% from last month</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-gray-500">Avg Response Time</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">2.4h</p>
                          <p className="text-xs text-gray-500">-18 min from last month</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-500" />
                            <span className="text-xs text-gray-500">Team Efficiency</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">94%</p>
                          <p className="text-xs text-gray-500">+3% from last month</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </div>

      {/* Task Drawer/Modal - Enhanced */}
      {showTaskDrawer && selectedTask && (() => {
        const { subtasks, activities, comments } = getTaskWithDetails(selectedTask.id);
        const TypeIcon = getTaskTypeIcon(selectedTask.type);
        
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowTaskDrawer(false)}>
            <div className="w-[600px] bg-white dark:bg-gray-900 h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TypeIcon className="h-5 w-5 text-gray-500" />
                      <h2 className="text-xl font-semibold">{selectedTask.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(selectedTask.priority)}
                      {getSLABadge(selectedTask)}
                      <Badge variant={selectedTask.status === 'completed' ? 'default' : 'outline'}>
                        {selectedTask.status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowTaskDrawer(false)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                    <Button size="sm" variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Snooze
                    </Button>
                    <Button size="sm" variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      Reassign
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-medium mb-2">Description</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTask.description || "No description provided"}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Due Date</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(selectedTask.dueAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Assignee</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {selectedTask.assigneeName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{selectedTask.assigneeName}</span>
                      </div>
                    </div>
                    {selectedTask.linkedEntity && (
                      <>
                        <div>
                          <Label className="text-xs text-gray-500">Linked {selectedTask.linkedEntity.type}</Label>
                          <div className="text-sm font-medium mt-1">
                            {selectedTask.linkedEntity.name}
                          </div>
                        </div>
                        {selectedTask.linkedEntity.address && (
                          <div>
                            <Label className="text-xs text-gray-500">Address</Label>
                            <div className="text-sm mt-1">
                              {selectedTask.linkedEntity.address}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Subtasks */}
                  {subtasks.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium">Subtasks</Label>
                        <span className="text-xs text-gray-500">
                          {subtasks.filter(s => s.status === 'completed').length}/{subtasks.length} completed
                        </span>
                      </div>
                      <div className="space-y-2">
                        {subtasks.map(subtask => (
                          <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <Checkbox 
                              checked={subtask.status === 'completed'}
                              onCheckedChange={() => toast.success("Subtask updated")}
                            />
                            <span className={cn(
                              "text-sm flex-1",
                              subtask.status === 'completed' && "line-through text-gray-500"
                            )}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Log */}
                  <div>
                    <Label className="text-sm font-medium mb-3">Activity</Label>
                    <div className="space-y-3">
                      {activities.slice(0, 5).map(activity => (
                        <div key={activity.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            {activity.type === 'created' && <Plus className="h-4 w-4 text-gray-500" />}
                            {activity.type === 'updated' && <Activity className="h-4 w-4 text-gray-500" />}
                            {activity.type === 'assigned' && <User className="h-4 w-4 text-gray-500" />}
                            {activity.type === 'commented' && <MessageSquare className="h-4 w-4 text-gray-500" />}
                            {activity.type === 'sla-violation' && <AlertTriangle className="h-4 w-4 text-gray-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-gray-500">
                              {activity.userName} • {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  {comments.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-3">Comments</Label>
                      <div className="space-y-3">
                        {comments.map(comment => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {comment.userName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{comment.userName}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Input placeholder="Add a comment..." className="flex-1" />
                  <Button size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
