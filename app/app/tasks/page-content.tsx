
"use client";
export const dynamic = 'force-dynamic';

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
  MoreVertical,
  Edit,
  Trash2,
  User,
  Home,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Target,
  Circle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

interface Task {
  id: string;
  userId: string;
  propertyId: string | null;
  dealId: string | null;
  type: string;
  title: string;
  description: string | null;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
  priority: string;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    address: string;
    city: string;
    state: string;
    ownerName: string | null;
  } | null;
  deal?: {
    id: string;
    address: string;
    type: string;
  } | null;
}

export default function TasksPage() {
  const { isLoaded, user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [completedFilter, setCompletedFilter] = useState("false");
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // New task form
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    type: "call",
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
  });
  const [creating, setCreating] = useState(false);

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        completed: completedFilter,
        dueDate: dueDateFilter,
        priority: priorityFilter,
      });

      const response = await fetch(`/api/tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        console.error("Failed to fetch tasks");
        toast.error("Failed to load tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchTasks();
    }
  }, [isLoaded, user, completedFilter, dueDateFilter, priorityFilter]);

  // Create new task
  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.dueDate) {
      toast.error("Please fill in title and due date");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks([data.task, ...tasks]);
        setCreateDialogOpen(false);
        setNewTask({
          type: "call",
          title: "",
          description: "",
          dueDate: "",
          priority: "medium",
        });
        toast.success("Task created successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  // Toggle task completion
  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(tasks.map((t) => (t.id === taskId ? data.task : t)));
        toast.success(data.task.completed ? "Task completed" : "Task reopened");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks(tasks.filter((t) => t.id !== taskId));
        toast.success("Task deleted");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  // Filter tasks by search
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.property?.address.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Calculate metrics
  const now = new Date();
  const overdueTasks = filteredTasks.filter(
    (t) => !t.completed && new Date(t.dueDate) < now
  ).length;
  const urgentTasks = filteredTasks.filter(
    (t) => !t.completed && t.priority === "high"
  ).length;
  const dueToday = filteredTasks.filter((t) => {
    const due = new Date(t.dueDate);
    return due.toDateString() === now.toDateString();
  }).length;
  const completedToday = filteredTasks.filter((t) => {
    if (!t.completedAt) return false;
    const completed = new Date(t.completedAt);
    return completed.toDateString() === now.toDateString();
  }).length;

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    if (priority === "high") {
      return (
        <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <ArrowUp className="h-3 w-3" />
          High
        </Badge>
      );
    }
    if (priority === "medium") {
      return (
        <Badge className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <ArrowRight className="h-3 w-3" />
          Medium
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <ArrowDown className="h-3 w-3" />
        Low
      </Badge>
    );
  };

  // Get task type icon
  const getTaskTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      call: Phone,
      email: Mail,
      text: MessageSquare,
      showing: Home,
      offer: Target,
      follow_up: MessageSquare,
      custom: Circle,
    };
    return icons[type] || Circle;
  };

  // Get time until due
  const getTimeUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();

    if (diff < 0) return "Overdue";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const exportToCSV = () => {
    const tasksToExport = filteredTasks.length > 0 ? filteredTasks : tasks;
    if (tasksToExport.length === 0) {
      toast.error("No tasks to export");
      return;
    }

    let csvContent = "Title,Type,Priority,Due Date,Status,Property,Description,Created\n";

    tasksToExport.forEach(t => {
      const status = t.completed ? "Completed" : "Pending";
      const property = t.property ? `${t.property.address}, ${t.property.city}` : "";
      csvContent += `"${t.title}",${t.type},${t.priority},${t.dueDate},${status},"${property}","${t.description || ""}",${t.createdAt}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tasks-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${tasksToExport.length} tasks to CSV`);
  };

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  if (!mounted || !isLoaded) {
    return (
      <div className="flex h-[calc(100vh-6.5rem)] bg-gray-50 dark:bg-gray-950 p-2 gap-3 overflow-hidden items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] bg-gray-50 dark:bg-gray-950 p-2 gap-3 overflow-hidden">
      <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tasks
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your to-dos and follow-ups
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={tasks.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your to-do list
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newTask.type}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="text">Text/SMS</SelectItem>
                        <SelectItem value="showing">Showing</SelectItem>
                        <SelectItem value="offer">Make Offer</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      placeholder="E.g., Call owner about 123 Main St"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Add any additional details..."
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="datetime-local"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask} disabled={creating}>
                    {creating ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Overdue
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {overdueTasks}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      High Priority
                    </p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {urgentTasks}
                    </p>
                  </div>
                  <ArrowUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Due Today
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {dueToday}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Completed Today
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {completedToday}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
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
            <Select value={completedFilter} onValueChange={setCompletedFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="false">Active</SelectItem>
                <SelectItem value="true">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="today">Due Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task List */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                Loading tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No tasks found</p>
                <p className="text-sm mt-1">
                  Create your first task to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const TypeIcon = getTaskTypeIcon(task.type);
                  const isOverdue =
                    !task.completed && new Date(task.dueDate) < now;

                  return (
                    <div
                      key={task.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() =>
                              handleToggleComplete(task.id, task.completed)
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <TypeIcon className="h-4 w-4 text-gray-500" />
                              <h4
                                className={cn(
                                  "font-medium",
                                  task.completed &&
                                    "line-through text-gray-500"
                                )}
                              >
                                {task.title}
                              </h4>
                              {getPriorityBadge(task.priority)}
                              {isOverdue && (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 mb-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {task.property && (
                                <div className="flex items-center gap-1">
                                  <Home className="h-3 w-3" />
                                  <span>
                                    {task.property.address}, {task.property.city}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span
                                  className={cn(
                                    isOverdue && "text-red-600 font-medium"
                                  )}
                                >
                                  {getTimeUntilDue(task.dueDate)}
                                </span>
                              </div>
                              <span>
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleComplete(task.id, task.completed)
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {task.completed
                                ? "Mark Incomplete"
                                : "Mark Complete"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteTask(task.id)}
                            >
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
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
