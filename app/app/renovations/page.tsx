
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import {
  Home,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  TrendingUp,
  Hammer,
  Users,
  FileText,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Play,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Renovation {
  id: string;
  contractId: string | null;
  propertyId: string | null;
  address: string;
  type: string;
  status: string;
  maxExposureUsd: number;
  targetRoiPct: number;
  arv: number | null;
  region: string | null;
  grade: string | null;
  startAt: string | null;
  completedAt: string | null;
  dailyBurnUsd: number | null;
  createdAt: string;
  property?: {
    id: string;
    address: string;
    city: string;
    state: string;
  };
  _count?: {
    scopeNodes: number;
    bids: number;
    changeOrders: number;
    tasks: number;
  };
}

const STATUS_CONFIG = {
  planning: { label: "Planning", icon: FileText, color: "bg-gray-500" },
  active: { label: "Active", icon: Hammer, color: "bg-blue-500" },
  on_hold: { label: "On Hold", icon: Pause, color: "bg-yellow-500" },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-green-500" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-500" },
};

export default function RenovationsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { isLoaded, user } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [renovations, setRenovations] = useState<Renovation[]>([]);
  const [filteredRenovations, setFilteredRenovations] = useState<Renovation[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Update status dialog
  const [selectedRenovation, setSelectedRenovation] = useState<Renovation | null>(null);
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch renovations
  useEffect(() => {
    if (isLoaded && user) {
      fetchRenovations();
    }
  }, [isLoaded, user]);

  const fetchRenovations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/renovations");
      if (!response.ok) throw new Error("Failed to fetch renovations");
      const data = await response.json();
      setRenovations(data.renovations || []);
    } catch (error) {
      console.error("Error fetching renovations:", error);
      toast({
        title: "Error",
        description: "Failed to load renovations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter renovations
  useEffect(() => {
    let filtered = renovations;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Filter by search query (address)
    if (searchQuery) {
      filtered = filtered.filter((r) =>
        r.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRenovations(filtered);
  }, [renovations, statusFilter, searchQuery]);

  const handleUpdateStatus = (renovation: Renovation) => {
    setSelectedRenovation(renovation);
    setNewStatus(renovation.status);
    setUpdateStatusDialogOpen(true);
  };

  const submitStatusUpdate = async () => {
    if (!selectedRenovation || !newStatus) {
      toast({
        title: "Missing Information",
        description: "Please select a status.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/renovations/${selectedRenovation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update renovation");

      toast({
        title: "Status Updated",
        description: `Renovation status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG].label}`,
      });

      fetchRenovations();
      setUpdateStatusDialogOpen(false);
      setSelectedRenovation(null);
    } catch (error) {
      console.error("Error updating renovation:", error);
      toast({
        title: "Error",
        description: "Failed to update renovation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Calculate stats
  const stats = {
    total: renovations.length,
    planning: renovations.filter((r) => r.status === "planning").length,
    active: renovations.filter((r) => r.status === "active").length,
    completed: renovations.filter((r) => r.status === "completed").length,
    totalBudget: renovations.reduce((sum, r) => sum + r.maxExposureUsd, 0),
    avgTargetRoi: renovations.length > 0
      ? renovations.reduce((sum, r) => sum + r.targetRoiPct, 0) / renovations.length
      : 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Renovations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your fix and flip renovation projects
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Hammer className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.planning}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Play className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.active}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.completed}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalBudget)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Avg Target ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.avgTargetRoi.toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Renovations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search by Address</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Renovations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Renovation Projects ({filteredRenovations.length})</CardTitle>
          <CardDescription>View and manage your renovation projects</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRenovations.length === 0 ? (
            <div className="text-center py-12">
              <Hammer className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                No renovations found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {statusFilter !== "all" || searchQuery
                  ? "Try adjusting your filters"
                  : "Start a renovation from a closed contract"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>ARV</TableHead>
                    <TableHead>Target ROI</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Scope Items</TableHead>
                    <TableHead>Bids</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRenovations.map((renovation) => {
                    const StatusIcon = STATUS_CONFIG[renovation.status as keyof typeof STATUS_CONFIG].icon;
                    const statusColor = STATUS_CONFIG[renovation.status as keyof typeof STATUS_CONFIG].color;

                    return (
                      <TableRow key={renovation.id}>
                        <TableCell>
                          <div className="font-medium">{renovation.address}</div>
                          <div className="text-sm text-gray-500">
                            {renovation.type.replace(/_/g, " ")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColor} text-white`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {STATUS_CONFIG[renovation.status as keyof typeof STATUS_CONFIG].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(renovation.maxExposureUsd)}</TableCell>
                        <TableCell>
                          {renovation.arv ? formatCurrency(renovation.arv) : "Not set"}
                        </TableCell>
                        <TableCell>{renovation.targetRoiPct}%</TableCell>
                        <TableCell>
                          <Badge variant="outline">{renovation.grade || "Standard"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                            {formatDate(renovation.startAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <FileText className="mr-1 h-3 w-3 text-gray-400" />
                            {renovation._count?.scopeNodes || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Users className="mr-1 h-3 w-3 text-gray-400" />
                            {renovation._count?.bids || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/app/renovations/${renovation.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(renovation)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {renovation.propertyId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/app/properties/${renovation.propertyId}`}>
                                    <Home className="mr-2 h-4 w-4" />
                                    View Property
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusDialogOpen} onOpenChange={setUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Renovation Status</DialogTitle>
            <DialogDescription>
              Change the status of this renovation project
            </DialogDescription>
          </DialogHeader>
          {selectedRenovation && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Property</h3>
                <p className="text-sm text-muted-foreground">{selectedRenovation.address}</p>
              </div>

              <div>
                <Label htmlFor="newStatus">New Status *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="newStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusDialogOpen(false)} disabled={updatingStatus}>
              Cancel
            </Button>
            <Button onClick={submitStatusUpdate} disabled={updatingStatus || !newStatus}>
              {updatingStatus ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
