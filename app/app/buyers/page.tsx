"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Plus,
  MoreVertical,
  Users,
  Target,
  Zap,
  Send,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Building,
  Star,
  Download,
  Upload,
  Eye,
  Edit,
  Archive,
  UserCheck,
  Shield,
  Award,
  BarChart3,
  Home,
  BrainCircuit,
  Sparkles,
  HandshakeIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buyersSeedData } from "./seed-data";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function BuyersPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState<string | null>(null);
  const [showMatchingDemo, setShowMatchingDemo] = useState(false);
  const [selectedListing, setSelectedListing] = useState(buyersSeedData.listings[0]);
  const [showFilters, setShowFilters] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importMethod, setImportMethod] = useState("csv");
  const [importData, setImportData] = useState("");
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState([0, 100]);
  const [marketFilter, setMarketFilter] = useState<string[]>([]);
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");
  
  // Prevent hydration mismatch by ensuring client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get buyer data with performance metrics
  const getBuyerWithMetrics = (buyerId: string) => {
    const buyer = buyersSeedData.buyers.find(b => b.id === buyerId);
    const performance = buyersSeedData.performance.find(p => p.buyerId === buyerId);
    const buyBox = buyersSeedData.buyBoxes.find(bb => bb.buyerId === buyerId);
    const documents = buyersSeedData.documents.filter(d => d.buyerId === buyerId);
    return { buyer, performance, buyBox, documents };
  };

  // Get all unique markets for filter options
  const allMarkets = [...new Set(buyersSeedData.buyers.flatMap(b => b.markets))];

  // Apply filters
  const filteredBuyers = buyersSeedData.buyers.filter(buyer => {
    // Search filter
    const matchesSearch = buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.markets.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === "all" || buyer.status === statusFilter;
    
    // Score filter
    const matchesScore = buyer.score >= scoreFilter[0] && buyer.score <= scoreFilter[1];
    
    // Market filter
    const matchesMarket = marketFilter.length === 0 || 
      buyer.markets.some(m => marketFilter.includes(m));
    
    // Performance filter
    const performance = buyersSeedData.performance.find(p => p.buyerId === buyer.id);
    let matchesPerformance = true;
    if (performanceFilter === "high") {
      matchesPerformance = performance ? performance.dealsClosedCount >= 20 : false;
    } else if (performanceFilter === "medium") {
      matchesPerformance = performance ? performance.dealsClosedCount >= 10 && performance.dealsClosedCount < 20 : false;
    } else if (performanceFilter === "low") {
      matchesPerformance = performance ? performance.dealsClosedCount < 10 : false;
    } else if (performanceFilter === "none") {
      matchesPerformance = !performance || performance.dealsClosedCount === 0;
    }
    
    // Document filter
    const documents = buyersSeedData.documents.filter(d => d.buyerId === buyer.id);
    let matchesDocument = true;
    if (documentFilter === "verified") {
      matchesDocument = documents.some(d => d.type === 'pof' && d.verified);
    } else if (documentFilter === "unverified") {
      matchesDocument = !documents.some(d => d.type === 'pof' && d.verified);
    }
    
    return matchesSearch && matchesStatus && matchesScore && matchesMarket && 
           matchesPerformance && matchesDocument;
  });

  // Get matches for selected listing
  const getMatchesForListing = (listingId: string) => {
    return buyersSeedData.matches
      .filter(m => m.listingId === listingId)
      .map(match => {
        const buyer = buyersSeedData.buyers.find(b => b.id === match.buyerId);
        return { ...match, buyer };
      })
      .sort((a, b) => b.score - a.score);
  };

  // Get offers for listing
  const getOffersForListing = (listingId: string) => {
    return buyersSeedData.offers
      .filter(o => o.listingId === listingId)
      .map(offer => {
        const buyer = buyersSeedData.buyers.find(b => b.id === offer.buyerId);
        return { ...offer, buyer };
      })
      .sort((a, b) => b.offerPrice - a.offerPrice);
  };

  // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-6.5rem)] bg-gray-50 dark:bg-gray-950 p-2 gap-3 overflow-hidden items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] bg-gray-50 dark:bg-gray-950 p-2 gap-3 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        {/* Header with Stats */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buyers & Disposition</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your buyer network and match deals</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import Buyers
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Buyer
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Active Buyers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {buyersSeedData.buyers.filter(b => b.status !== 'inactive' && b.status !== 'blacklisted').length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">+3 this week</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Active Listings</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {buyersSeedData.listings.filter(l => l.status === 'active').length}
                    </p>
                  </div>
                  <Home className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">2 pending, 1 closed</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg Assignment</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">$16.8K</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12% vs last month</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg Days to Assign</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3.4</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">-2 days faster</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 h-10">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="buyers" className="gap-2">
              <Users className="h-4 w-4" />
              Buyers
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2">
              <Home className="h-4 w-4" />
              Active Listings
            </TabsTrigger>
            <TabsTrigger value="matching" className="gap-2">
              <BrainCircuit className="h-4 w-4" />
              Smart Matching
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Send className="h-4 w-4" />
              Blast Campaigns
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-2">
              <HandshakeIcon className="h-4 w-4" />
              Offers
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Performers */}
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle>Top Performing Buyers</CardTitle>
                      <CardDescription>Based on volume, speed, and reliability</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2 p-6 pt-0">
                          {buyersSeedData.buyers
                            .filter(b => b.status === 'vip' || b.score >= 85)
                            .map(buyer => {
                              const perf = buyersSeedData.performance.find(p => p.buyerId === buyer.id);
                              return (
                                <div key={buyer.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors cursor-pointer">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                      <AvatarFallback className="text-xs">{buyer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm truncate">{buyer.name}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-500 truncate">{buyer.entity}</p>
                                        {buyer.status === 'vip' && (
                                          <Badge variant="default" className="text-xs h-4 px-1">VIP</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className="text-right">
                                      <p className="text-sm font-semibold">{perf?.dealsClosedCount || 0}</p>
                                      <p className="text-xs text-gray-500">deals</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">${((perf?.avgAssignmentFee || 0) / 1000).toFixed(0)}k</p>
                                      <p className="text-xs text-gray-500">avg fee</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                      <span className="text-sm font-medium">{buyer.score}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Recent Offers */}
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle>Recent Offers</CardTitle>
                      <CardDescription>Latest buyer activity on your listings</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2 p-6 pt-0">
                          {buyersSeedData.offers.map(offer => {
                            const buyer = buyersSeedData.buyers.find(b => b.id === offer.buyerId);
                            const listing = buyersSeedData.listings.find(l => l.id === offer.listingId);
                            return (
                              <div key={offer.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium truncate">{buyer?.name}</p>
                                      <Badge 
                                        variant={
                                          offer.status === 'accepted' ? 'default' : 
                                          offer.status === 'submitted' ? 'secondary' :
                                          'outline'
                                        }
                                        className="text-xs h-5"
                                      >
                                        {offer.status}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mb-2">{listing?.address}</p>
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className="font-semibold text-green-600 dark:text-green-400">${(offer.offerPrice / 1000).toFixed(0)}k</span>
                                      <span className="text-gray-500">{offer.closingDays}d close</span>
                                      <span className="text-gray-500">EMD: ${(offer.earnestMoney / 1000).toFixed(1)}k</span>
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Accept
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Counter
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Phone className="h-4 w-4 mr-2" />
                                        Call
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-600">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Decline
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Buyers Tab */}
              <TabsContent value="buyers" className="mt-0">
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search buyers by name, entity, or market..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="blacklisted">Blacklisted</SelectItem>
                      </SelectContent>
                    </Select>
                    <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Filter className="h-4 w-4 mr-2" />
                          Filters
                          {(scoreFilter[0] > 0 || scoreFilter[1] < 100 || marketFilter.length > 0 || 
                            performanceFilter !== "all" || documentFilter !== "all") && (
                            <Badge variant="secondary" className="ml-2 h-5 px-1">
                              {marketFilter.length + (performanceFilter !== "all" ? 1 : 0) + 
                               (documentFilter !== "all" ? 1 : 0) + 
                               (scoreFilter[0] > 0 || scoreFilter[1] < 100 ? 1 : 0)}
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80 p-4">
                        <div className="space-y-4">
                          {/* Score Range */}
                          <div>
                            <Label className="text-sm font-medium">Reputation Score</Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Input 
                                type="number" 
                                value={scoreFilter[0]} 
                                onChange={(e) => setScoreFilter([parseInt(e.target.value) || 0, scoreFilter[1]])}
                                className="w-20 h-8" 
                                min="0" 
                                max="100"
                              />
                              <span className="text-sm text-gray-500">to</span>
                              <Input 
                                type="number" 
                                value={scoreFilter[1]} 
                                onChange={(e) => setScoreFilter([scoreFilter[0], parseInt(e.target.value) || 100])}
                                className="w-20 h-8" 
                                min="0" 
                                max="100"
                              />
                            </div>
                          </div>

                          {/* Performance Level */}
                          <div>
                            <Label className="text-sm font-medium">Performance Level</Label>
                            <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                              <SelectTrigger className="w-full mt-2 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Performance</SelectItem>
                                <SelectItem value="high">High (20+ deals)</SelectItem>
                                <SelectItem value="medium">Medium (10-19 deals)</SelectItem>
                                <SelectItem value="low">Low (1-9 deals)</SelectItem>
                                <SelectItem value="none">No History</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Documents */}
                          <div>
                            <Label className="text-sm font-medium">Proof of Funds</Label>
                            <Select value={documentFilter} onValueChange={setDocumentFilter}>
                              <SelectTrigger className="w-full mt-2 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Buyers</SelectItem>
                                <SelectItem value="verified">POF Verified</SelectItem>
                                <SelectItem value="unverified">No POF</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Markets */}
                          <div>
                            <Label className="text-sm font-medium">Markets</Label>
                            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                              {allMarkets.map(market => (
                                <div key={market} className="flex items-center gap-2">
                                  <Checkbox 
                                    id={market}
                                    checked={marketFilter.includes(market)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setMarketFilter([...marketFilter, market]);
                                      } else {
                                        setMarketFilter(marketFilter.filter(m => m !== market));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={market} className="text-sm font-normal cursor-pointer">
                                    {market}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Reset Filters */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setScoreFilter([0, 100]);
                                setMarketFilter([]);
                                setPerformanceFilter("all");
                                setDocumentFilter("all");
                                setStatusFilter("all");
                              }}
                            >
                              Reset All
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => setShowFilters(false)}
                            >
                              Apply Filters
                            </Button>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Results count */}
                  {(searchQuery || statusFilter !== "all" || scoreFilter[0] > 0 || scoreFilter[1] < 100 || 
                    marketFilter.length > 0 || performanceFilter !== "all" || documentFilter !== "all") && (
                    <div className="flex items-center justify-between px-2">
                      <p className="text-sm text-gray-500">
                        Showing {filteredBuyers.length} of {buyersSeedData.buyers.length} buyers
                      </p>
                      {filteredBuyers.length === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                            setScoreFilter([0, 100]);
                            setMarketFilter([]);
                            setPerformanceFilter("all");
                            setDocumentFilter("all");
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Buyers Table with Fixed Header and Scrollable Body */}
                  <Card className="overflow-hidden">
                    <ScrollArea className="h-[550px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
                          <TableRow>
                            <TableHead className="w-[250px]">Buyer</TableHead>
                            <TableHead className="w-[180px]">Markets</TableHead>
                            <TableHead className="w-[180px]">Buy Box</TableHead>
                            <TableHead className="w-[150px]">Performance</TableHead>
                            <TableHead className="w-[120px]">Documents</TableHead>
                            <TableHead className="w-[120px]">Score</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBuyers.map(buyer => {
                            const { performance, buyBox, documents } = getBuyerWithMetrics(buyer.id);
                            return (
                              <TableRow key={buyer.id}>
                                <TableCell className="w-[250px]">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback>{buyer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{buyer.name}</p>
                                      <p className="text-sm text-gray-500">{buyer.entity}</p>
                                      <div className="flex gap-1 mt-1">
                                        {buyer.status === 'vip' && (
                                          <Badge variant="default" className="text-xs">VIP</Badge>
                                        )}
                                        {buyer.status === 'blacklisted' && (
                                          <Badge variant="destructive" className="text-xs">Blacklisted</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="w-[180px]">
                                  <div className="text-sm">
                                    {buyer.markets.slice(0, 2).join(', ')}
                                    {buyer.markets.length > 2 && (
                                      <span className="text-gray-500"> +{buyer.markets.length - 2}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[180px]">
                                  {buyBox ? (
                                    <div className="text-sm space-y-1">
                                      <p>${(buyBox.priceMin / 1000).toFixed(0)}k-${(buyBox.priceMax / 1000).toFixed(0)}k</p>
                                      <p className="text-gray-500">{buyBox.bedsMin}+ beds, {buyBox.rehabLevel} rehab</p>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-sm">Not set</span>
                                  )}
                                </TableCell>
                                <TableCell className="w-[150px]">
                                  {performance ? (
                                    <div className="text-sm space-y-1">
                                      <p>{performance.dealsClosedCount} deals</p>
                                      <p className="text-gray-500">${(performance.avgAssignmentFee / 1000).toFixed(1)}k avg</p>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-sm">No history</span>
                                  )}
                                </TableCell>
                                <TableCell className="w-[120px]">
                                  <div className="flex items-center gap-2">
                                    {documents.find(d => d.type === 'pof' && d.verified) ? (
                                      <Badge variant="outline" className="text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        POF
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs text-gray-500">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        No POF
                                      </Badge>
                                    )}
                                    {documents.length > 1 && (
                                      <span className="text-xs text-gray-500">+{documents.length - 1}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[120px]">
                                  <div className="flex items-center gap-2">
                                    <Progress value={buyer.score} className="w-16 h-2" />
                                    <span className="text-sm font-medium">{buyer.score}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="w-[50px]">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Buyer
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Email
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Send SMS
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
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </Card>
                </div>
              </TabsContent>

              {/* Listings Tab */}
              <TabsContent value="listings" className="mt-0">
                <div className="space-y-4">
                  {buyersSeedData.listings.map(listing => {
                    const offers = getOffersForListing(listing.id);
                    return (
                      <Card key={listing.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold">{listing.address}</h3>
                                <Badge variant={listing.status === 'active' ? 'default' : listing.status === 'pending' ? 'secondary' : 'outline'}>
                                  {listing.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-5 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Ask Price</p>
                                  <p className="font-medium">${listing.askPrice.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">ARV</p>
                                  <p className="font-medium">${listing.arvEstimate.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Repairs</p>
                                  <p className="font-medium">${listing.repairEstimate.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Views / Offers</p>
                                  <p className="font-medium">{listing.viewCount} / {listing.offerCount}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Days on Market</p>
                                  <p className="font-medium">{listing.daysOnMarket}</p>
                                </div>
                              </div>
                              {offers.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-sm text-gray-500 mb-2">Recent Offers:</p>
                                  <div className="flex gap-2">
                                    {offers.slice(0, 3).map(offer => (
                                      <Badge key={offer.id} variant="outline">
                                        {offer.buyer?.name}: ${(offer.offerPrice / 1000).toFixed(0)}k
                                      </Badge>
                                    ))}
                                    {offers.length > 3 && (
                                      <Badge variant="outline">+{offers.length - 3} more</Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedListing(listing);
                                  setActiveTab('matching');
                                }}
                              >
                                <BrainCircuit className="h-4 w-4 mr-2" />
                                Find Buyers
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => toast.success('Blast sent to matched buyers!')}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Blast
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Matching Tab */}
              <TabsContent value="matching" className="mt-0">
                <div className="space-y-6">
                  {/* Property to Match */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Details</CardTitle>
                      <CardDescription>AI will match this property with the best buyers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label>Address</Label>
                          <p className="text-sm font-medium">{selectedListing.address}</p>
                        </div>
                        <div>
                          <Label>Ask Price</Label>
                          <p className="text-sm font-medium">${selectedListing.askPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label>ARV</Label>
                          <p className="text-sm font-medium">${selectedListing.arvEstimate.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label>Repairs</Label>
                          <p className="text-sm font-medium">${selectedListing.repairEstimate.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setShowMatchingDemo(true)}
                        className="w-full"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Run AI Matching
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Matching Results */}
                  {showMatchingDemo && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>AI Match Results</CardTitle>
                            <CardDescription>Buyers ranked by compatibility score</CardDescription>
                          </div>
                          <Badge variant="secondary">Analyzed {buyersSeedData.buyers.length} buyers in 0.3s</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {getMatchesForListing(selectedListing.id).map(match => (
                            <div key={match.buyerId} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "text-2xl font-bold",
                                    match.score >= 90 ? "text-green-600 dark:text-green-400" :
                                    match.score >= 80 ? "text-yellow-600 dark:text-yellow-400" :
                                    "text-orange-600 dark:text-orange-400"
                                  )}>
                                    {match.score}%
                                  </div>
                                  <div>
                                    <p className="font-medium">{match.buyer?.name}</p>
                                    <p className="text-sm text-gray-500">{match.buyer?.entity}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm">
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email
                                  </Button>
                                  <Button size="sm">
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Deal
                                  </Button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {match.reasons.map((reason, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Campaign Builder */}
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle>Create Blast Campaign</CardTitle>
                      <CardDescription>Send your listing to multiple buyers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Select Listing</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a listing" />
                              </SelectTrigger>
                              <SelectContent>
                                {buyersSeedData.listings.map(listing => (
                                  <SelectItem key={listing.id} value={listing.id}>
                                    {listing.address}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Audience</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select audience" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="matched">AI Matched Buyers (15)</SelectItem>
                                <SelectItem value="vip">VIP Buyers (3)</SelectItem>
                                <SelectItem value="all">All Active Buyers (8)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Input placeholder="e.g., HOT DEAL: 3/2 in Riverside - 65% ARV" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Message</Label>
                          <textarea 
                            className="w-full h-32 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm resize-none"
                            placeholder="Property details and call to action..."
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                              <Checkbox id="email-campaign" defaultChecked />
                              <Label htmlFor="email-campaign" className="cursor-pointer">Email</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox id="sms-campaign" defaultChecked />
                              <Label htmlFor="sms-campaign" className="cursor-pointer">SMS</Label>
                            </div>
                          </div>
                          
                          <Button className="w-full">
                            <Send className="h-4 w-4 mr-2" />
                            Send Campaign
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Campaigns */}
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle>Recent Campaigns</CardTitle>
                      <CardDescription>Track performance of your blast campaigns</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-3 p-6 pt-0">
                          {buyersSeedData.campaigns.map(campaign => {
                            const listing = buyersSeedData.listings.find(l => l.id === campaign.listingId);
                            return (
                              <div key={campaign.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{campaign.subject}</p>
                                    <p className="text-xs text-gray-500 truncate">{listing?.address}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {new Date(campaign.sentDate).toLocaleDateString()}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-5 gap-2 text-xs">
                                  <div>
                                    <p className="text-gray-500">Sent</p>
                                    <p className="font-semibold">{campaign.recipientCount}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Opened</p>
                                    <p className="font-semibold text-green-600 dark:text-green-400">
                                      {Math.round(campaign.openCount / campaign.recipientCount * 100)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Clicked</p>
                                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                                      {Math.round(campaign.clickCount / campaign.recipientCount * 100)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Replied</p>
                                    <p className="font-semibold text-purple-600 dark:text-purple-400">
                                      {campaign.replyCount}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Offers</p>
                                    <p className="font-semibold text-orange-600 dark:text-orange-400">
                                      {campaign.offerCount}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <Badge variant="secondary" className="text-xs">
                                    {campaign.method === 'both' ? 'Email + SMS' : campaign.method.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {campaign.buyerIds.length} recipients
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Add more sample campaigns for scrolling demo */}
                          {[...Array(3)].map((_, i) => (
                            <div key={`demo-${i}`} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors opacity-60">
                              <div className="flex items-start justify-between mb-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate">Previous Campaign {i + 3}</p>
                                  <p className="text-xs text-gray-500 truncate">Historical listing</p>
                                </div>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {new Date(Date.now() - (i + 3) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-5 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-500">Sent</p>
                                  <p className="font-semibold">45</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Opened</p>
                                  <p className="font-semibold text-green-600 dark:text-green-400">68%</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Clicked</p>
                                  <p className="font-semibold text-blue-600 dark:text-blue-400">42%</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Replied</p>
                                  <p className="font-semibold text-purple-600 dark:text-purple-400">5</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Offers</p>
                                  <p className="font-semibold text-orange-600 dark:text-orange-400">2</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Offers Tab */}
              <TabsContent value="offers" className="mt-0">
                <div className="space-y-4">
                  {/* Active Offers */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Offers</CardTitle>
                      <CardDescription>Manage and respond to buyer offers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Property</TableHead>
                            <TableHead>Buyer</TableHead>
                            <TableHead>Offer</TableHead>
                            <TableHead>Terms</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {buyersSeedData.offers.map(offer => {
                            const buyer = buyersSeedData.buyers.find(b => b.id === offer.buyerId);
                            const listing = buyersSeedData.listings.find(l => l.id === offer.listingId);
                            return (
                              <TableRow key={offer.id}>
                                <TableCell>
                                  <p className="font-medium text-sm">{listing?.address.split(',')[0]}</p>
                                  <p className="text-xs text-gray-500">Ask: ${listing?.askPrice.toLocaleString()}</p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="text-xs">
                                        {buyer?.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">{buyer?.name}</p>
                                      <p className="text-xs text-gray-500">{buyer?.entity}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="font-semibold">${offer.offerPrice.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500">
                                    {((1 - (listing?.askPrice || 0) / offer.offerPrice) * 100).toFixed(1)}% of ask
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <p>{offer.closingDays} day close</p>
                                    <p className="text-xs text-gray-500">EMD: ${offer.earnestMoney.toLocaleString()}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={offer.status === 'accepted' ? 'default' : 'secondary'}>
                                    {offer.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="outline" size="sm">
                                      Accept
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      Counter
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      Decline
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Import Buyers Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Buyers</DialogTitle>
            <DialogDescription>
              Import buyer information from a CSV file or paste data directly
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Import Method Selection */}
            <div className="space-y-2">
              <Label>Import Method</Label>
              <RadioGroup value={importMethod} onValueChange={setImportMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv">Upload CSV File</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paste" id="paste" />
                  <Label htmlFor="paste">Paste Data</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crm" id="crm" />
                  <Label htmlFor="crm">Connect CRM</Label>
                </div>
              </RadioGroup>
            </div>

            {/* CSV Upload */}
            {importMethod === "csv" && (
              <div className="space-y-2">
                <Label htmlFor="csv-upload">Upload CSV File</Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        toast.success(`File "${file.name}" selected`);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => document.getElementById('csv-upload')?.click()}
                  >
                    Select File
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  <p className="font-medium mb-1">Required columns:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Name (First and Last)</li>
                    <li>Email</li>
                    <li>Phone</li>
                    <li>Preferred Markets</li>
                    <li>Property Types</li>
                    <li>Budget Range</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Paste Data */}
            {importMethod === "paste" && (
              <div className="space-y-2">
                <Label htmlFor="paste-data">Paste Buyer Data</Label>
                <Textarea
                  id="paste-data"
                  placeholder="Paste your buyer data here (CSV format or tab-separated)..."
                  className="min-h-[200px] font-mono text-xs"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                />
                <div className="text-xs text-gray-500">
                  <p className="font-medium">Format example:</p>
                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    Name,Email,Phone,Markets,Types,Budget<br/>
                    John Doe,john@email.com,555-0123,"Phoenix, Tucson",SFH,200k-400k
                  </code>
                </div>
              </div>
            )}

            {/* CRM Connection */}
            {importMethod === "crm" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20">
                    <div className="text-center">
                      <Building className="h-8 w-8 mx-auto mb-1" />
                      <span className="text-xs">Salesforce</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-20">
                    <div className="text-center">
                      <Building className="h-8 w-8 mx-auto mb-1" />
                      <span className="text-xs">HubSpot</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-20">
                    <div className="text-center">
                      <Building className="h-8 w-8 mx-auto mb-1" />
                      <span className="text-xs">Pipedrive</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-20">
                    <div className="text-center">
                      <Building className="h-8 w-8 mx-auto mb-1" />
                      <span className="text-xs">Zoho CRM</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Import Settings */}
            <div className="space-y-2">
              <Label>Import Settings</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-score" defaultChecked />
                  <Label htmlFor="auto-score" className="text-sm">
                    Automatically calculate buyer scores based on history
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="send-welcome" />
                  <Label htmlFor="send-welcome" className="text-sm">
                    Send welcome email to new buyers
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="duplicate-check" defaultChecked />
                  <Label htmlFor="duplicate-check" className="text-sm">
                    Check for duplicate entries
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Buyers imported successfully!");
              setShowImportDialog(false);
              setImportData("");
            }}>
              Import Buyers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
