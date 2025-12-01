
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import {
  Home,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  PiggyBank,
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

interface Rental {
  id: string;
  propertyId: string;
  contractId: string | null;
  address: string;
  monthlyRent: number;
  deposit: number | null;
  leaseStart: string | null;
  leaseEnd: string | null;
  status: string;
  purchasePrice: number | null;
  mortgagePayment: number | null;
  propertyTax: number | null;
  insurance: number | null;
  hoa: number | null;
  utilities: number | null;
  maintenance: number | null;
  totalIncome: number;
  totalExpenses: number;
  occupancyRate: number;
  createdAt: string;
  property?: {
    id: string;
    address: string;
    city: string;
    state: string;
  };
  tenants?: any[];
  _count?: {
    tenants: number;
    income: number;
    expenses: number;
  };
}

interface Analytics {
  totalProperties: number;
  totalMonthlyRent: number;
  totalMonthlyExpenses: number;
  totalIncome: number;
  totalExpenses: number;
  totalCashFlow: number;
  avgCapRate: number;
  avgOccupancyRate: number;
  vacantProperties: number;
  leasedProperties: number;
  totalPortfolioValue: number;
  avgCashOnCashReturn: number;
}

const STATUS_CONFIG = {
  vacant: { label: "Vacant", icon: Home, color: "bg-gray-500" },
  leased: { label: "Leased", icon: CheckCircle2, color: "bg-green-500" },
  maintenance: { label: "Maintenance", icon: AlertCircle, color: "bg-yellow-500" },
  listed: { label: "Listed", icon: Building2, color: "bg-blue-500" },
};

export default function RentalsPage() {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Update status dialog
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch rentals and analytics
  useEffect(() => {
    if (isLoaded && user) {
      fetchRentals();
      fetchAnalytics();
    }
  }, [isLoaded, user]);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rentals");
      if (!response.ok) throw new Error("Failed to fetch rentals");
      const data = await response.json();
      setRentals(data.rentals || []);
    } catch (error) {
      console.error("Error fetching rentals:", error);
      toast({
        title: "Error",
        description: "Failed to load rentals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/rentals/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  // Filter rentals
  useEffect(() => {
    let filtered = rentals;

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

    setFilteredRentals(filtered);
  }, [rentals, statusFilter, searchQuery]);

  const handleUpdateStatus = (rental: Rental) => {
    setSelectedRental(rental);
    setNewStatus(rental.status);
    setUpdateStatusDialogOpen(true);
  };

  const submitStatusUpdate = async () => {
    if (!selectedRental || !newStatus) {
      toast({
        title: "Missing Information",
        description: "Please select a status.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/rentals/${selectedRental.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update rental");

      toast({
        title: "Status Updated",
        description: `Rental status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG].label}`,
      });

      fetchRentals();
      fetchAnalytics();
      setUpdateStatusDialogOpen(false);
      setSelectedRental(null);
    } catch (error) {
      console.error("Error updating rental:", error);
      toast({
        title: "Error",
        description: "Failed to update rental. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/A";
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

  const calculateMonthlyCashFlow = (rental: Rental) => {
    const expenses =
      (rental.mortgagePayment || 0) +
      (rental.propertyTax || 0) +
      (rental.insurance || 0) +
      (rental.hoa || 0) +
      (rental.utilities || 0) +
      (rental.maintenance || 0);
    return rental.monthlyRent - expenses;
  };

  if (!isLoaded || loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rental Properties</h1>
          <p className="text-muted-foreground">
            Manage your rental portfolio and track cash flow
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leased</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.leasedProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacant</CardTitle>
              <Home className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.vacantProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalMonthlyRent)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analytics.totalCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(analytics.totalCashFlow)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cap Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgCapRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="vacant">Vacant</SelectItem>
            <SelectItem value="leased">Leased</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="listed">Listed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rentals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rental Properties ({filteredRentals.length})</CardTitle>
          <CardDescription>
            View and manage all rental properties in your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRentals.length === 0 ? (
            <div className="text-center py-12">
              <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rentals found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "No rentals match your filters. Try adjusting your search."
                  : "Start adding rental properties from closed contracts."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Cash Flow</TableHead>
                    <TableHead>Tenants</TableHead>
                    <TableHead>Lease End</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRentals.map((rental) => {
                    const StatusIcon = STATUS_CONFIG[rental.status as keyof typeof STATUS_CONFIG]?.icon || Clock;
                    const statusConfig = STATUS_CONFIG[rental.status as keyof typeof STATUS_CONFIG];
                    const cashFlow = calculateMonthlyCashFlow(rental);

                    return (
                      <TableRow key={rental.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rental.address}</div>
                            <div className="text-sm text-muted-foreground">
                              {rental.property?.city}, {rental.property?.state}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig?.color} text-white`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig?.label || rental.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(rental.monthlyRent)}
                        </TableCell>
                        <TableCell className={cashFlow >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {formatCurrency(cashFlow)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                            {rental._count?.tenants || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                            {formatDate(rental.leaseEnd)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {rental.occupancyRate.toFixed(0)}%
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(rental)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/app/properties/${rental.propertyId}`}>
                                  <Home className="mr-2 h-4 w-4" />
                                  View Property
                                </Link>
                              </DropdownMenuItem>
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
            <DialogTitle>Update Rental Status</DialogTitle>
            <DialogDescription>
              Change the status of this rental property
            </DialogDescription>
          </DialogHeader>
          {selectedRental && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Property</h3>
                <p className="text-sm text-muted-foreground">{selectedRental.address}</p>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="leased">Leased</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="listed">Listed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusDialogOpen(false)} disabled={updatingStatus}>
              Cancel
            </Button>
            <Button onClick={submitStatusUpdate} disabled={updatingStatus}>
              {updatingStatus ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
