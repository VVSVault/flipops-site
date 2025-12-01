
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import {
  FileSignature,
  Clock,
  CheckCircle2,
  XCircle,
  Home,
  Calendar,
  DollarSign,
  Filter,
  Search,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  AlertCircle,
  UserCheck,
  Hammer,
  Building2,
  Download,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { exportToCSV, generateFilename, formatCurrencyForCSV, formatDateForCSV } from "@/lib/csv-export";

interface Contract {
  id: string;
  propertyId: string;
  offerId: string;
  purchasePrice: number;
  status: string;
  closingDate: string | null;
  signedAt: string | null;
  escrowOpenedAt: string | null;
  closedAt: string | null;
  notes: string | null;
  documentUrls: string[];
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  offer: {
    id: string;
    amount: number;
    status: string;
  };
  assignment?: {
    id: string;
    buyerId: string;
    assignmentFee: number;
    status: string;
    buyer: {
      id: string;
      name: string;
      email: string | null;
    };
  };
  renovation?: {
    id: string;
    status: string;
    maxExposureUsd: number;
    targetRoiPct: number;
    arv: number | null;
    _count?: {
      scopeNodes: number;
      bids: number;
      changeOrders: number;
      tasks: number;
    };
  };
  rental?: {
    id: string;
    status: string;
    monthlyRent: number;
    totalIncome: number;
    totalExpenses: number;
    _count?: {
      tenants: number;
      income: number;
      expenses: number;
    };
  };
}

interface Buyer {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  cashBuyer: boolean;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-500" },
  signed: { label: "Signed", icon: FileSignature, color: "bg-blue-500" },
  escrow: { label: "In Escrow", icon: AlertCircle, color: "bg-purple-500" },
  closed: { label: "Closed", icon: CheckCircle2, color: "bg-green-500" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-500" },
};

export default function ContractsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [notes, setNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assignment state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [assignmentFee, setAssignmentFee] = useState("");
  const [assignmentDate, setAssignmentDate] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [assigningContract, setAssigningContract] = useState(false);

  // Renovation state
  const [renovationDialogOpen, setRenovationDialogOpen] = useState(false);
  const [renovationBudget, setRenovationBudget] = useState("");
  const [renovationTargetRoi, setRenovationTargetRoi] = useState("20");
  const [renovationArv, setRenovationArv] = useState("");
  const [renovationStartDate, setRenovationStartDate] = useState("");
  const [startingRenovation, setStartingRenovation] = useState(false);

  // Rental state
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);
  const [rentalMonthlyRent, setRentalMonthlyRent] = useState("");
  const [rentalDeposit, setRentalDeposit] = useState("");
  const [rentalMortgagePayment, setRentalMortgagePayment] = useState("");
  const [rentalPropertyTax, setRentalPropertyTax] = useState("");
  const [rentalInsurance, setRentalInsurance] = useState("");
  const [startingRental, setStartingRental] = useState(false);

  // Fetch contracts and buyers
  useEffect(() => {
    if (isLoaded && user) {
      fetchContracts();
      fetchBuyers();
    }
  }, [isLoaded, user]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/contracts");
      if (!response.ok) throw new Error("Failed to fetch contracts");
      const data = await response.json();
      setContracts(data.contracts || []);
      setFilteredContracts(data.contracts || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast({
        title: "Error",
        description: "Failed to load contracts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      const response = await fetch("/api/buyers");
      if (!response.ok) throw new Error("Failed to fetch buyers");
      const data = await response.json();
      setBuyers(data.buyers || []);
    } catch (error) {
      console.error("Error fetching buyers:", error);
    }
  };

  // Filter contracts
  useEffect(() => {
    let filtered = contracts;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.property.address.toLowerCase().includes(query) ||
          c.property.city.toLowerCase().includes(query) ||
          c.property.state.toLowerCase().includes(query)
      );
    }

    setFilteredContracts(filtered);
  }, [contracts, statusFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      label: status,
      icon: Clock,
      color: "bg-gray-500",
    };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
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

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setDetailsDialogOpen(true);
  };

  const handleUpdateStatus = (contract: Contract) => {
    setSelectedContract(contract);
    setNewStatus(contract.status);
    setClosingDate(contract.closingDate || "");
    setNotes(contract.notes || "");
    setUpdateStatusDialogOpen(true);
  };

  const submitStatusUpdate = async () => {
    if (!selectedContract) return;

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/contracts/${selectedContract.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          closingDate: closingDate || null,
          notes: notes || null,
          // Auto-set timestamps based on status
          ...(newStatus === "signed" && !selectedContract.signedAt && { signedAt: new Date().toISOString() }),
          ...(newStatus === "escrow" && !selectedContract.escrowOpenedAt && { escrowOpenedAt: new Date().toISOString() }),
          ...(newStatus === "closed" && !selectedContract.closedAt && { closedAt: new Date().toISOString() }),
        }),
      });

      if (!response.ok) throw new Error("Failed to update contract");

      const data = await response.json();

      toast({
        title: "Contract Updated",
        description: `Contract status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`,
      });

      // Refresh contracts
      fetchContracts();
      setUpdateStatusDialogOpen(false);
      setSelectedContract(null);
    } catch (error) {
      console.error("Error updating contract:", error);
      toast({
        title: "Error",
        description: "Failed to update contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignContract = (contract: Contract) => {
    setSelectedContract(contract);
    setSelectedBuyerId("");
    setAssignmentFee("");
    setAssignmentDate(contract.closingDate || "");
    setAssignmentNotes("");
    setAssignDialogOpen(true);
  };

  const submitAssignment = async () => {
    if (!selectedContract || !selectedBuyerId || !assignmentFee) {
      toast({
        title: "Missing Information",
        description: "Please select a buyer and enter an assignment fee.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigningContract(true);
      const response = await fetch(`/api/contracts/${selectedContract.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: selectedBuyerId,
          assignmentFee: parseFloat(assignmentFee),
          assignmentDate: assignmentDate || null,
          notes: assignmentNotes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign contract");
      }

      toast({
        title: "Contract Assigned",
        description: "Contract successfully assigned to buyer.",
      });

      fetchContracts();
      setAssignDialogOpen(false);
      setSelectedContract(null);
    } catch (error) {
      console.error("Error assigning contract:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigningContract(false);
    }
  };

  const handleStartRenovation = (contract: Contract) => {
    setSelectedContract(contract);
    setRenovationBudget("");
    setRenovationTargetRoi("20");
    setRenovationArv("");
    setRenovationStartDate("");
    setRenovationDialogOpen(true);
  };

  const submitRenovation = async () => {
    if (!selectedContract || !renovationBudget || !renovationTargetRoi) {
      toast({
        title: "Missing Information",
        description: "Please enter budget and target ROI.",
        variant: "destructive",
      });
      return;
    }

    try {
      setStartingRenovation(true);
      const response = await fetch("/api/renovations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: selectedContract.id,
          propertyId: selectedContract.propertyId,
          maxExposureUsd: parseFloat(renovationBudget),
          targetRoiPct: parseFloat(renovationTargetRoi),
          arv: renovationArv ? parseFloat(renovationArv) : null,
          startAt: renovationStartDate || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start renovation");
      }

      toast({
        title: "Renovation Started",
        description: "Renovation project successfully created.",
      });

      fetchContracts();
      setRenovationDialogOpen(false);
      setSelectedContract(null);
    } catch (error) {
      console.error("Error starting renovation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start renovation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStartingRenovation(false);
    }
  };

  const handleStartRental = (contract: Contract) => {
    setSelectedContract(contract);
    setRentalMonthlyRent("");
    setRentalDeposit("");
    setRentalMortgagePayment("");
    setRentalPropertyTax("");
    setRentalInsurance("");
    setRentalDialogOpen(true);
  };

  const submitRental = async () => {
    if (!selectedContract || !rentalMonthlyRent) {
      toast({
        title: "Missing Information",
        description: "Please enter monthly rent.",
        variant: "destructive",
      });
      return;
    }

    try {
      setStartingRental(true);
      const response = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: selectedContract.id,
          propertyId: selectedContract.propertyId,
          monthlyRent: parseFloat(rentalMonthlyRent),
          deposit: rentalDeposit ? parseFloat(rentalDeposit) : null,
          purchasePrice: selectedContract.purchasePrice,
          mortgagePayment: rentalMortgagePayment ? parseFloat(rentalMortgagePayment) : null,
          propertyTax: rentalPropertyTax ? parseFloat(rentalPropertyTax) : null,
          insurance: rentalInsurance ? parseFloat(rentalInsurance) : null,
          status: "vacant",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start rental");
      }

      toast({
        title: "Rental Started",
        description: "Rental property successfully created.",
      });

      fetchContracts();
      setRentalDialogOpen(false);
      setSelectedContract(null);
    } catch (error) {
      console.error("Error starting rental:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start rental. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStartingRental(false);
    }
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const exportData = filteredContracts.map((contract) => ({
      "Property Address": `${contract.property.address}, ${contract.property.city}, ${contract.property.state} ${contract.property.zip}`,
      "Purchase Price": formatCurrencyForCSV(contract.purchasePrice),
      "Status": contract.status.charAt(0).toUpperCase() + contract.status.slice(1),
      "Closing Date": formatDateForCSV(contract.closingDate),
      "Signed Date": formatDateForCSV(contract.signedAt),
      "Escrow Opened": formatDateForCSV(contract.escrowOpenedAt),
      "Closed Date": formatDateForCSV(contract.closedAt),
      "Created Date": formatDateForCSV(contract.createdAt),
      "Notes": contract.notes || "",
    }));

    exportToCSV(exportData, generateFilename("flipops-contracts"));

    toast({
      title: "Export Successful",
      description: `Exported ${exportData.length} contract${exportData.length !== 1 ? "s" : ""} to CSV`,
    });
  };

  // Calculate stats
  const stats = {
    total: contracts.length,
    pending: contracts.filter((c) => c.status === "pending").length,
    escrow: contracts.filter((c) => c.status === "escrow").length,
    closed: contracts.filter((c) => c.status === "closed").length,
    totalValue: contracts.reduce((sum, c) => sum + c.purchasePrice, 0),
  };

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contracts</h1>
          <p className="text-muted-foreground mt-1">Manage your property contracts and track closing progress</p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="gap-2"
          disabled={filteredContracts.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Escrow</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.escrow}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="escrow">In Escrow</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileSignature className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No contracts found</h3>
              <p className="text-muted-foreground">
                {contracts.length === 0
                  ? "Create contracts from accepted offers to get started."
                  : "Try adjusting your filters."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closing Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{contract.property.address}</div>
                          <div className="text-sm text-muted-foreground">
                            {contract.property.city}, {contract.property.state}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(contract.purchasePrice)}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(contract.closingDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(contract.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(contract)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(contract)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                          {!contract.assignment && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleAssignContract(contract)}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Assign Contract
                              </DropdownMenuItem>
                            </>
                          )}
                          {!contract.renovation && contract.status === "closed" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStartRenovation(contract)}>
                                <Hammer className="mr-2 h-4 w-4" />
                                Start Renovation
                              </DropdownMenuItem>
                            </>
                          )}
                          {!contract.rental && contract.status === "closed" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStartRental(contract)}>
                                <Building2 className="mr-2 h-4 w-4" />
                                Start Rental
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/app/properties/${contract.propertyId}`}>
                              <Home className="mr-2 h-4 w-4" />
                              View Property
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
            <DialogDescription>View contract information and timeline</DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Property</h3>
                <p className="text-sm">
                  {selectedContract.property.address}
                  <br />
                  {selectedContract.property.city}, {selectedContract.property.state}{" "}
                  {selectedContract.property.zip}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Purchase Price</h3>
                  <p className="text-2xl font-bold">{formatCurrency(selectedContract.purchasePrice)}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  {getStatusBadge(selectedContract.status)}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract Created:</span>
                    <span>{formatDate(selectedContract.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Signed:</span>
                    <span>{formatDate(selectedContract.signedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escrow Opened:</span>
                    <span>{formatDate(selectedContract.escrowOpenedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closing Date:</span>
                    <span className="font-medium">{formatDate(selectedContract.closingDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closed:</span>
                    <span>{formatDate(selectedContract.closedAt)}</span>
                  </div>
                </div>
              </div>

              {selectedContract.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedContract.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusDialogOpen} onOpenChange={setUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Contract Status</DialogTitle>
            <DialogDescription>Update the status and details of this contract</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="escrow">In Escrow</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="closingDate">Closing Date</Label>
              <Input
                id="closingDate"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this contract..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitStatusUpdate} disabled={updatingStatus}>
              {updatingStatus ? "Updating..." : "Update Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Contract Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Contract to Buyer</DialogTitle>
            <DialogDescription>
              Select a buyer and set the assignment fee for this wholesale deal
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Contract Details</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedContract.property.address}, {selectedContract.property.city}, {selectedContract.property.state}
                </p>
                <p className="text-lg font-bold mt-1">{formatCurrency(selectedContract.purchasePrice)}</p>
              </div>

              <div>
                <Label htmlFor="buyer">Select Buyer *</Label>
                <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId}>
                  <SelectTrigger id="buyer">
                    <SelectValue placeholder="Choose a buyer" />
                  </SelectTrigger>
                  <SelectContent>
                    {buyers.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No buyers found. <Link href="/app/buyers" className="text-blue-600 hover:underline">Add buyers</Link> first.
                      </div>
                    ) : (
                      buyers.map((buyer) => (
                        <SelectItem key={buyer.id} value={buyer.id}>
                          {buyer.name} {buyer.cashBuyer && "(Cash)"} {buyer.company && `- ${buyer.company}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignmentFee">Assignment Fee *</Label>
                <Input
                  id="assignmentFee"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="10000"
                  value={assignmentFee}
                  onChange={(e) => setAssignmentFee(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="assignmentDate">Assignment Date</Label>
                <Input
                  id="assignmentDate"
                  type="date"
                  value={assignmentDate}
                  onChange={(e) => setAssignmentDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="assignmentNotes">Notes</Label>
                <Textarea
                  id="assignmentNotes"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Add notes about this assignment..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assigningContract}>
              Cancel
            </Button>
            <Button onClick={submitAssignment} disabled={assigningContract || !selectedBuyerId || !assignmentFee}>
              {assigningContract ? "Assigning..." : "Assign Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Renovation Dialog */}
      <Dialog open={renovationDialogOpen} onOpenChange={setRenovationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Renovation Project</DialogTitle>
            <DialogDescription>
              Create a renovation project for this closed contract
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Property</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedContract.property.address}, {selectedContract.property.city}, {selectedContract.property.state}
                </p>
                <p className="text-lg font-bold mt-1">{formatCurrency(selectedContract.purchasePrice)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="renovationBudget">Renovation Budget *</Label>
                  <Input
                    id="renovationBudget"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="50000"
                    value={renovationBudget}
                    onChange={(e) => setRenovationBudget(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="renovationTargetRoi">Target ROI (%) *</Label>
                  <Input
                    id="renovationTargetRoi"
                    type="number"
                    min="0"
                    step="5"
                    placeholder="20"
                    value={renovationTargetRoi}
                    onChange={(e) => setRenovationTargetRoi(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="renovationArv">After Repair Value (ARV)</Label>
                  <Input
                    id="renovationArv"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="300000"
                    value={renovationArv}
                    onChange={(e) => setRenovationArv(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="renovationStartDate">Start Date</Label>
                  <Input
                    id="renovationStartDate"
                    type="date"
                    value={renovationStartDate}
                    onChange={(e) => setRenovationStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Tip:</strong> After creating the renovation, you can add scope items, request bids from contractors, and track progress.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenovationDialogOpen(false)} disabled={startingRenovation}>
              Cancel
            </Button>
            <Button onClick={submitRenovation} disabled={startingRenovation || !renovationBudget || !renovationTargetRoi}>
              {startingRenovation ? "Creating..." : "Start Renovation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Rental Dialog */}
      <Dialog open={rentalDialogOpen} onOpenChange={setRentalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Rental Property</DialogTitle>
            <DialogDescription>
              Add this property to your rental portfolio
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Property</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedContract.property.address}, {selectedContract.property.city}, {selectedContract.property.state}
                </p>
                <p className="text-lg font-bold mt-1">
                  Purchase Price: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(selectedContract.purchasePrice)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rentalMonthlyRent">Monthly Rent *</Label>
                  <Input
                    id="rentalMonthlyRent"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="2000"
                    value={rentalMonthlyRent}
                    onChange={(e) => setRentalMonthlyRent(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="rentalDeposit">Security Deposit</Label>
                  <Input
                    id="rentalDeposit"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="2000"
                    value={rentalDeposit}
                    onChange={(e) => setRentalDeposit(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rentalMortgagePayment">Monthly Mortgage</Label>
                  <Input
                    id="rentalMortgagePayment"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="1200"
                    value={rentalMortgagePayment}
                    onChange={(e) => setRentalMortgagePayment(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="rentalPropertyTax">Monthly Tax</Label>
                  <Input
                    id="rentalPropertyTax"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="200"
                    value={rentalPropertyTax}
                    onChange={(e) => setRentalPropertyTax(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rentalInsurance">Monthly Insurance</Label>
                <Input
                  id="rentalInsurance"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="150"
                  value={rentalInsurance}
                  onChange={(e) => setRentalInsurance(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Tip:</strong> After creating the rental, you can add tenants, record rent payments, and track cash flow.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRentalDialogOpen(false)} disabled={startingRental}>
              Cancel
            </Button>
            <Button onClick={submitRental} disabled={startingRental || !rentalMonthlyRent}>
              {startingRental ? "Creating..." : "Start Rental"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
