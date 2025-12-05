
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import {
  FileText,
  Send,
  Check,
  X,
  Clock,
  DollarSign,
  Home,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  AlertCircle,
  FileSignature,
  Plus,
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
import { toast } from "sonner";
import Link from "next/link";

interface Offer {
  id: string;
  amount: number;
  terms: string | null;
  contingencies: string[] | null;
  closingDate: string | null;
  expiresAt: string | null;
  earnestMoney: number | null;
  status: string;
  sentAt: string | null;
  responseAt: string | null;
  responseNotes: string | null;
  counterAmount: number | null;
  notes: string | null;
  createdAt: string;
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip: string | null;
    ownerName: string | null;
  };
  contract?: {
    id: string;
    status: string;
  };
}

export default function OffersPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [responseNotes, setResponseNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Contract creation state
  const [createContractDialogOpen, setCreateContractDialogOpen] = useState(false);
  const [selectedOfferForContract, setSelectedOfferForContract] = useState<Offer | null>(null);
  const [contractClosingDate, setContractClosingDate] = useState("");
  const [contractNotes, setContractNotes] = useState("");
  const [creatingContract, setCreatingContract] = useState(false);

  // Fetch offers
  useEffect(() => {
    if (true) {
      fetchOffers();
    }
  }, []);

  // Filter offers
  useEffect(() => {
    let filtered = offers;

    if (statusFilter !== "all") {
      filtered = filtered.filter((offer) => offer.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (offer) =>
          offer.property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          offer.property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (offer.property.ownerName &&
            offer.property.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredOffers(filtered);
  }, [offers, statusFilter, searchQuery]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/offers');
      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const openDetailsDialog = (offer: Offer) => {
    setSelectedOffer(offer);
    setDetailsDialogOpen(true);
  };

  const openUpdateStatusDialog = (offer: Offer) => {
    setSelectedOffer(offer);
    setNewStatus(offer.status);
    setResponseNotes(offer.responseNotes || "");
    setUpdateStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOffer) return;

    try {
      setUpdatingStatus(true);

      const response = await fetch(`/api/offers/${selectedOffer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          responseNotes: responseNotes || null,
        }),
      });

      if (response.ok) {
        toast.success('Offer status updated successfully');
        setUpdateStatusDialogOpen(false);
        await fetchOffers();
      } else {
        throw new Error('Failed to update offer');
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      toast.error('Failed to update offer status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Offer deleted successfully');
        await fetchOffers();
      } else {
        throw new Error('Failed to delete offer');
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    }
  };

  const openCreateContractDialog = (offer: Offer) => {
    setSelectedOfferForContract(offer);
    setContractClosingDate(offer.closingDate || "");
    setContractNotes("");
    setCreateContractDialogOpen(true);
  };

  const handleCreateContract = async () => {
    if (!selectedOfferForContract) return;

    try {
      setCreatingContract(true);

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: selectedOfferForContract.id,
          closingDate: contractClosingDate || null,
          notes: contractNotes || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Contract created successfully');
        setCreateContractDialogOpen(false);
        await fetchOffers();
        // Optionally redirect to contract details
        // window.location.href = `/app/contracts`;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contract');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create contract');
    } finally {
      setCreatingContract(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", text: string }> = {
      draft: { variant: "secondary", text: "Draft" },
      sent: { variant: "default", text: "Sent" },
      countered: { variant: "outline", text: "Countered" },
      accepted: { variant: "default", text: "Accepted" },
      rejected: { variant: "destructive", text: "Rejected" },
      expired: { variant: "secondary", text: "Expired" },
    };

    const config = variants[status] || { variant: "secondary" as const, text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const stats = {
    total: offers.length,
    draft: offers.filter((o) => o.status === "draft").length,
    sent: offers.filter((o) => o.status === "sent").length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    totalValue: offers.reduce((sum, o) => sum + o.amount, 0),
  };

  const exportToCSV = () => {
    const offersToExport = filteredOffers.length > 0 ? filteredOffers : offers;
    if (offersToExport.length === 0) {
      toast.error("No offers to export");
      return;
    }

    let csvContent = "Property,City,State,Owner,Amount,Status,Earnest Money,Closing Date,Sent At,Created\n";

    offersToExport.forEach(o => {
      csvContent += `"${o.property.address}",${o.property.city},${o.property.state},"${o.property.ownerName || ""}",${o.amount},${o.status},${o.earnestMoney || ""},${o.closingDate || ""},${o.sentAt || ""},${o.createdAt}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `offers-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${offersToExport.length} offers to CSV`);
  };

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600 dark:text-gray-400">Loading offers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Offers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track and manage all your property offers
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV} disabled={offers.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Offers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Draft</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draft}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Sent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sent}</p>
              </div>
              <Send className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Accepted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accepted}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(stats.totalValue / 1000).toFixed(0)}k
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by address, city, or owner..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="countered">Countered</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">All Offers</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOffers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {offers.length === 0
                  ? 'No offers yet. Create your first offer from the underwriting page.'
                  : 'No offers match your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {offer.property.address}
                          </p>
                          <p className="text-sm text-gray-500">
                            {offer.property.city}, {offer.property.state}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {offer.property.ownerName || '-'}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        ${offer.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize text-gray-900 dark:text-white">
                        {offer.terms || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(offer.status)}</TableCell>
                      <TableCell>
                        {offer.contract ? (
                          <Badge variant="outline" className="capitalize">
                            <FileSignature className="h-3 w-3 mr-1" />
                            {offer.contract.status}
                          </Badge>
                        ) : offer.status === "accepted" ? (
                          <Badge variant="secondary" className="text-yellow-700 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            No Contract
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {offer.expiresAt
                          ? new Date(offer.expiresAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailsDialog(offer)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openUpdateStatusDialog(offer)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            {offer.status === "accepted" && !offer.contract && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openCreateContractDialog(offer)}>
                                  <FileSignature className="h-4 w-4 mr-2" />
                                  Create Contract
                                </DropdownMenuItem>
                              </>
                            )}
                            {offer.contract && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/app/contracts`}>
                                    <FileSignature className="h-4 w-4 mr-2" />
                                    View Contract
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offer Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Offer Details</DialogTitle>
            <DialogDescription>
              Full details of this offer
            </DialogDescription>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Property</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedOffer.property.address}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedOffer.property.city}, {selectedOffer.property.state}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Owner</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedOffer.property.ownerName || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Offer Amount</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${selectedOffer.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Earnest Money</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedOffer.earnestMoney
                      ? `$${selectedOffer.earnestMoney.toLocaleString()}`
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Terms</Label>
                  <p className="font-medium capitalize text-gray-900 dark:text-white">
                    {selectedOffer.terms || 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedOffer.status)}</div>
                </div>
              </div>

              {selectedOffer.contingencies && selectedOffer.contingencies.length > 0 && (
                <div>
                  <Label className="text-gray-600">Contingencies</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedOffer.contingencies.map((cont) => (
                      <Badge key={cont} variant="outline" className="capitalize">
                        {cont.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Closing Date</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedOffer.closingDate
                      ? new Date(selectedOffer.closingDate).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Expires</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedOffer.expiresAt
                      ? new Date(selectedOffer.expiresAt).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
              </div>

              {selectedOffer.counterAmount && (
                <div>
                  <Label className="text-gray-600">Counter Offer Amount</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${selectedOffer.counterAmount.toLocaleString()}
                  </p>
                </div>
              )}

              {selectedOffer.responseNotes && (
                <div>
                  <Label className="text-gray-600">Response Notes</Label>
                  <p className="text-gray-900 dark:text-white">{selectedOffer.responseNotes}</p>
                </div>
              )}

              {selectedOffer.notes && (
                <div>
                  <Label className="text-gray-600">Internal Notes</Label>
                  <p className="text-gray-900 dark:text-white">{selectedOffer.notes}</p>
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
            <DialogTitle>Update Offer Status</DialogTitle>
            <DialogDescription>
              Change the status of this offer and add response notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="countered">Countered</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="response-notes">Response Notes</Label>
              <Input
                id="response-notes"
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="Add notes about seller's response..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateStatusDialogOpen(false)}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updatingStatus}>
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Contract Dialog */}
      <Dialog open={createContractDialogOpen} onOpenChange={setCreateContractDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Contract</DialogTitle>
            <DialogDescription>
              Convert this accepted offer into a contract
            </DialogDescription>
          </DialogHeader>
          {selectedOfferForContract && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-600">Property</Label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedOfferForContract.property.address}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedOfferForContract.property.city}, {selectedOfferForContract.property.state}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600">Purchase Price</Label>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${selectedOfferForContract.amount.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing-date">Expected Closing Date</Label>
                <Input
                  id="closing-date"
                  type="date"
                  value={contractClosingDate}
                  onChange={(e) => setContractClosingDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-notes">Contract Notes (Optional)</Label>
                <Textarea
                  id="contract-notes"
                  value={contractNotes}
                  onChange={(e) => setContractNotes(e.target.value)}
                  placeholder="Add any notes about this contract..."
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> This will create a new contract with status "pending" and automatically
                  generate closing tasks to help you track the process.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateContractDialogOpen(false)}
              disabled={creatingContract}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateContract} disabled={creatingContract}>
              {creatingContract ? 'Creating Contract...' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
