
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Search,
  Phone,
  Mail,
  ChevronRight,
  Plus,
  Calendar,
  AlertCircle,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ownerName?: string;
  score?: number;
  dataSource: string;
  outreachStatus?: string;
  lastContactDate?: string;
  lastContactMethod?: string;
  sentiment?: string;
  nextFollowUpDate?: string;
  phoneNumbers?: string;
  emails?: string;
  contactNotes?: string;
  foreclosure: boolean;
  preForeclosure: boolean;
  taxDelinquent: boolean;
  vacant: boolean;
  createdAt: string;
}

interface ContactNote {
  date: string;
  note: string;
  method: string;
  sentiment?: string;
}

export default function LeadsPage() {
  const { user } = useUser();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Contact note form state
  const [newNote, setNewNote] = useState("");
  const [noteMethod, setNoteMethod] = useState("phone");
  const [noteSentiment, setNoteSentiment] = useState<string | undefined>();
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch properties
  useEffect(() => {
    fetchProperties();
  }, [user]);

  // Filter properties
  useEffect(() => {
    let filtered = properties;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.outreachStatus === statusFilter);
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter(p => p.dataSource === sourceFilter);
    }

    setFilteredProperties(filtered);
  }, [properties, searchTerm, statusFilter, sourceFilter]);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch('/api/properties');

      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`);
      }

      const data = await response.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      setFetchError(
        error instanceof Error
          ? error.message
          : 'Failed to load properties. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openPropertyDrawer = (property: Property) => {
    setSelectedProperty(property);
    setDrawerOpen(true);
  };

  const updatePropertyStatus = async (propertyId: string, status: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outreachStatus: status }),
      });

      if (response.ok) {
        // Update local state
        setProperties(prev => prev.map(p =>
          p.id === propertyId ? { ...p, outreachStatus: status } : p
        ));
        if (selectedProperty?.id === propertyId) {
          setSelectedProperty({ ...selectedProperty, outreachStatus: status });
        }
      }
    } catch (error) {
      console.error('Failed to update property status:', error);
    }
  };

  const addContactNote = async () => {
    if (!selectedProperty || !newNote.trim()) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/properties/${selectedProperty.id}/contact-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNote,
          method: noteMethod,
          sentiment: noteSentiment,
          nextFollowUpDate: nextFollowUp || undefined,
          outreachStatus: 'contacted', // Auto-update status when adding note
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setSelectedProperty(data.property);
        setProperties(prev => prev.map(p =>
          p.id === selectedProperty.id ? data.property : p
        ));

        // Reset form
        setNewNote("");
        setNoteSentiment(undefined);
        setNextFollowUp("");
        setContactDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to add contact note:', error);
    } finally {
      setSaving(false);
    }
  };

  const getDistressSignals = (property: Property): string[] => {
    const signals: string[] = [];
    if (property.foreclosure) signals.push('Foreclosure');
    if (property.preForeclosure) signals.push('Pre-Foreclosure');
    if (property.taxDelinquent) signals.push('Tax Delinquent');
    if (property.vacant) signals.push('Vacant');
    return signals;
  };

  const getContactNotes = (property: Property): ContactNote[] => {
    if (!property.contactNotes) return [];
    try {
      return JSON.parse(property.contactNotes);
    } catch {
      return [];
    }
  };

  const formatPhoneNumbers = (phoneNumbers?: string): string[] => {
    if (!phoneNumbers) return [];
    try {
      return JSON.parse(phoneNumbers);
    } catch {
      return [];
    }
  };

  const formatEmails = (emails?: string): string[] => {
    if (!emails) return [];
    try {
      return JSON.parse(emails);
    } catch {
      return [];
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'contacted':
      case 'negotiating':
        return 'default';
      case 'offer_made':
      case 'under_contract':
        return 'default';
      case 'closed':
        return 'default';
      case 'dead':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500/20 text-green-500';
      case 'negative':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading properties...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md w-full bg-white dark:bg-gray-800 border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Properties
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {fetchError}
            </p>
            <Button onClick={fetchProperties} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {filteredProperties.length} properties • {properties.filter(p => p.outreachStatus === 'not_contacted').length} not contacted
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by property, owner, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[200px] bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_contacted">Not Contacted</SelectItem>
                <SelectItem value="attempted">Attempted</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="offer_made">Offer Made</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="under_contract">Under Contract</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="dead">Dead</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full lg:w-[180px] bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="attom">ATTOM API</SelectItem>
                <SelectItem value="manual">Manual Entry</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchProperties}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-700">
                <TableHead className="text-gray-600 dark:text-gray-400">Property</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Owner</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Source</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Signals</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Score</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Status</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Last Contact</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Sentiment</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Plus className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium mb-1">
                          No leads yet
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {properties.length === 0
                            ? "Click 'Quick Add Lead' to get started, or connect a data source to import properties automatically."
                            : "No properties match your current filters. Try adjusting your search criteria."}
                        </p>
                      </div>
                      {properties.length === 0 && (
                        <Button onClick={() => window.location.href = '/app/data-sources'} variant="outline" className="mt-2">
                          Connect Data Source
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProperties.map((property) => {
                  const signals = getDistressSignals(property);
                  return (
                    <TableRow
                      key={property.id}
                      className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                      onClick={() => openPropertyDrawer(property)}
                    >
                      <TableCell className="text-gray-900 dark:text-white font-medium">
                        {property.address}<br />
                        <span className="text-sm text-gray-500">{property.city}, {property.state} {property.zip}</span>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{property.ownerName || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{property.dataSource}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {signals.length > 0 ? signals.map((signal) => (
                            <Badge key={signal} variant="secondary" className="text-xs">
                              {signal}
                            </Badge>
                          )) : (
                            <span className="text-sm text-gray-400">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {property.score ? (
                          <span className={`font-bold ${
                            property.score >= 90 ? 'text-green-500' :
                            property.score >= 70 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {property.score}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(property.outreachStatus)}>
                          {property.outreachStatus?.replace('_', ' ') || 'not contacted'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                        {formatDate(property.lastContactDate)}
                      </TableCell>
                      <TableCell>
                        {property.sentiment ? (
                          <Badge variant="outline" className={getSentimentColor(property.sentiment)}>
                            {property.sentiment}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Property Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 overflow-y-auto">
          {selectedProperty && (
            <>
              <SheetHeader>
                <SheetTitle className="text-gray-900 dark:text-white">
                  {selectedProperty.address}
                </SheetTitle>
                <SheetDescription className="text-gray-600 dark:text-gray-400">
                  {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status and Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={selectedProperty.outreachStatus || 'not_contacted'}
                      onValueChange={(value) => updatePropertyStatus(selectedProperty.id, value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_contacted">Not Contacted</SelectItem>
                        <SelectItem value="attempted">Attempted</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="offer_made">Offer Made</SelectItem>
                        <SelectItem value="negotiating">Negotiating</SelectItem>
                        <SelectItem value="under_contract">Under Contract</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="dead">Dead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Match Score</Label>
                    <div className={`text-2xl font-bold mt-1 ${
                      (selectedProperty.score || 0) >= 90 ? 'text-green-500' :
                      (selectedProperty.score || 0) >= 70 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {selectedProperty.score || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <Label>Contact Information</Label>
                  <div className="mt-2 space-y-2">
                    {formatPhoneNumbers(selectedProperty.phoneNumbers).map((phone, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${phone}`} className="text-blue-500 hover:underline">{phone}</a>
                        <a
                          href={`sms:${phone}`}
                          className="text-green-500 hover:text-green-600 flex items-center gap-1"
                          title="Send SMS"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Text
                        </a>
                      </div>
                    ))}
                    {formatEmails(selectedProperty.emails).map((email, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${email}`} className="text-blue-500 hover:underline">{email}</a>
                      </div>
                    ))}
                    {formatPhoneNumbers(selectedProperty.phoneNumbers).length === 0 &&
                     formatEmails(selectedProperty.emails).length === 0 && (
                      <p className="text-sm text-gray-400">No contact info available (needs skip tracing)</p>
                    )}
                  </div>
                </div>

                {/* Contact Notes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Contact Notes</Label>
                    <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Note
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Contact Note</DialogTitle>
                          <DialogDescription>
                            Record your interaction with the property owner
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Note</Label>
                            <Textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="What happened during this contact?"
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Contact Method</Label>
                              <Select value={noteMethod} onValueChange={setNoteMethod}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="phone">Phone</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="sms">SMS</SelectItem>
                                  <SelectItem value="in_person">In Person</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Sentiment (Optional)</Label>
                              <Select value={noteSentiment} onValueChange={setNoteSentiment}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="positive">Positive</SelectItem>
                                  <SelectItem value="neutral">Neutral</SelectItem>
                                  <SelectItem value="negative">Negative</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label>Next Follow-up (Optional)</Label>
                            <Input
                              type="datetime-local"
                              value={nextFollowUp}
                              onChange={(e) => setNextFollowUp(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addContactNote} disabled={saving || !newNote.trim()}>
                            {saving ? 'Saving...' : 'Save Note'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-3">
                    {getContactNotes(selectedProperty).length > 0 ? (
                      getContactNotes(selectedProperty).reverse().map((note, idx) => (
                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{note.method}</Badge>
                              {note.sentiment && (
                                <Badge variant="outline" className={`text-xs ${getSentimentColor(note.sentiment)}`}>
                                  {note.sentiment}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(note.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{note.note}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No contact notes yet. Add your first note to track this lead.
                      </p>
                    )}
                  </div>
                </div>

                {/* Property Details */}
                <div>
                  <Label>Distress Signals</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {getDistressSignals(selectedProperty).map(signal => (
                      <Badge key={signal} variant="secondary">{signal}</Badge>
                    ))}
                    {getDistressSignals(selectedProperty).length === 0 && (
                      <span className="text-sm text-gray-400">No distress signals</span>
                    )}
                  </div>
                </div>

                {selectedProperty.nextFollowUpDate && (
                  <div>
                    <Label>Next Follow-up</Label>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{new Date(selectedProperty.nextFollowUpDate).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
