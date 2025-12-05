
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Download,
  Send,
  Edit,
  Trash2,
  MoreVertical,
  Building,
  HardHat,
  Droplet,
  Zap,
  Wind,
  Trees,
  Paintbrush,
  Square,
  Home,
  X,
  Check,
  AlertCircle,
  TrendingUp,
  Users,
  Briefcase,
  Shield,
  Award,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  Paperclip,
  RefreshCw,
  FileCheck,
  Activity,
  MessageCircle,
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
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  vendorsSeedData, 
  type Vendor, 
  type VendorDocument, 
  type VendorReview,
  type Project,
  type ProjectVendorMap,
  type VendorContract,
  type VendorInvoice,
  type VendorMessage,
} from "./seed-data";

// Category icons mapping
const categoryIcons: Record<string, any> = {
  roofing: Home,
  plumbing: Droplet,
  electrical: Zap,
  hvac: Wind,
  landscaping: Trees,
  'general-contractor': HardHat,
  painting: Paintbrush,
  flooring: Square,
};

// API vendor type
interface ApiVendor {
  id: string;
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  trade: string[];
  region: string | null;
  onTimePct: number;
  onBudgetPct: number;
  reliability: number;
  createdAt: string;
  updatedAt: string;
  _count: { bids: number; invoices: number };
}

export default function VendorsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showMatchingDrawer, setShowMatchingDrawer] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [detailTab, setDetailTab] = useState("overview");
  const [matchedVendors, setMatchedVendors] = useState<Array<{
    vendor: Vendor;
    score: number;
    factors: any;
  }>>([]);

  // API state
  const [apiVendors, setApiVendors] = useState<ApiVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch vendors from API
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vendors');
        if (response.ok) {
          const data = await response.json();
          setApiVendors(data.vendors || []);
          // If we have API vendors, use them; otherwise fall back to seed data
          setUseApi(data.vendors && data.vendors.length > 0);
        } else {
          console.warn('Failed to fetch vendors, using seed data');
          setUseApi(false);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setUseApi(false);
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchVendors();
    }
  }, [mounted]);

  // Convert API vendor to seed data format for compatibility
  const convertApiVendor = (apiVendor: ApiVendor): Vendor => ({
    id: apiVendor.id,
    name: apiVendor.name,
    categories: apiVendor.trade || [],
    phone: apiVendor.phone || "",
    email: apiVendor.email || "",
    website: undefined,
    locationCity: apiVendor.region?.split(',')[0]?.trim() || "Phoenix",
    locationState: apiVendor.region?.split(',')[1]?.trim() || "AZ",
    zip: "85001",
    description: `Vendor specializing in ${(apiVendor.trade || []).join(', ')}`,
    ratingAvg: apiVendor.reliability / 20, // Convert 0-100 to 0-5 scale
    ratingCount: apiVendor._count?.bids || 0,
    isVerified: apiVendor.reliability >= 80,
    availabilityStatus: 'available' as const,
    currency: "USD",
    tags: [],
    createdAt: new Date(apiVendor.createdAt),
    updatedAt: new Date(apiVendor.updatedAt),
  });

  // Get the effective vendors list (API or seed data)
  const effectiveVendors = useApi
    ? apiVendors.map(convertApiVendor)
    : vendorsSeedData.vendors;

  // Select first vendor when effective vendors change
  useEffect(() => {
    if (effectiveVendors.length > 0 && !selectedVendor) {
      setSelectedVendor(effectiveVendors[0]);
    }
  }, [effectiveVendors, selectedVendor]);

  // Filter vendors
  const filterVendors = () => {
    return effectiveVendors.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategories = selectedCategories.length === 0 ||
        vendor.categories.some(cat => selectedCategories.includes(cat));

      const matchesRating = vendor.ratingAvg >= minRating;

      const matchesCity = selectedCity === "all" || vendor.locationCity === selectedCity;

      const matchesAvailability = selectedAvailability === "all" ||
        vendor.availabilityStatus === selectedAvailability;

      const matchesPrice = priceRange === "all" ||
        (priceRange === "low" && (vendor.hourlyRateMin || 0) < 75) ||
        (priceRange === "medium" && (vendor.hourlyRateMin || 0) >= 75 && (vendor.hourlyRateMax || 0) <= 125) ||
        (priceRange === "high" && (vendor.hourlyRateMax || 0) > 125);

      return matchesSearch && matchesCategories && matchesRating &&
        matchesCity && matchesAvailability && matchesPrice;
    });
  };

  // Get vendor documents
  const getVendorDocuments = (vendorId: string) => {
    return vendorsSeedData.documents.filter(doc => doc.vendorId === vendorId);
  };

  // Get vendor reviews
  const getVendorReviews = (vendorId: string) => {
    return vendorsSeedData.reviews.filter(review => review.vendorId === vendorId);
  };

  // Get vendor projects
  const getVendorProjects = (vendorId: string) => {
    const vendorMaps = vendorsSeedData.projectVendorMaps.filter(map => map.vendorId === vendorId);
    return vendorMaps.map(map => {
      const project = vendorsSeedData.projects.find(p => p.id === map.projectId);
      return { ...project, role: map.role, status: map.selectionStatus, quotedAmount: map.quotedAmount };
    });
  };

  // Get vendor messages
  const getVendorMessages = (vendorId: string) => {
    return vendorsSeedData.messages.filter(msg => msg.vendorId === vendorId);
  };

  // Get vendor contracts
  const getVendorContracts = (vendorId: string) => {
    return vendorsSeedData.contracts.filter(contract => contract.vendorId === vendorId);
  };

  // Get vendor invoices
  const getVendorInvoices = (vendorId: string) => {
    return vendorsSeedData.invoices.filter(invoice => invoice.vendorId === vendorId);
  };

  // Calculate vendor recommendations for a project
  const calculateRecommendations = (project: Project) => {
    const recommendations = vendorsSeedData.vendors.map(vendor => {
      const match = vendorsSeedData.calculateVendorMatch(
        vendor,
        project,
        vendorsSeedData.availability
      );
      return { vendor, score: match.totalScore, factors: match };
    });
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  // Get unique cities
  const uniqueCities = Array.from(new Set(vendorsSeedData.vendors.map(v => v.locationCity)));

  // Get availability badge color
  const getAvailabilityBadge = (status: Vendor['availabilityStatus']) => {
    const configs = {
      available: { label: 'Available', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      limited: { label: 'Limited', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      booked: { label: 'Booked', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      unknown: { label: 'Check Availability', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    };
    return configs[status];
  };

  // Get document status badge
  const getDocumentStatusBadge = (status: VendorDocument['status']) => {
    const configs = {
      valid: { icon: CheckCircle, className: 'text-green-600', label: 'Valid' },
      expiring_soon: { icon: AlertTriangle, className: 'text-yellow-600', label: 'Expiring Soon' },
      expired: { icon: AlertCircle, className: 'text-red-600', label: 'Expired' },
      missing: { icon: X, className: 'text-gray-600', label: 'Missing' },
    };
    return configs[status];
  };

  // Render star rating
  const renderStars = (rating: number, count?: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={cn(
              starSize,
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
        {count !== undefined && (
          <span className={cn("text-gray-500 ml-1", size === 'sm' ? 'text-xs' : 'text-sm')}>
            ({count})
          </span>
        )}
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-6.5rem)] bg-gray-50 dark:bg-gray-950 p-2 gap-3 overflow-hidden items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const filteredVendors = filterVendors();

  return (
    <div className="flex h-[calc(100vh-6.5rem)] bg-gray-50 dark:bg-gray-950 p-2 gap-3">
      {/* Left Panel - Vendor List */}
      <div className="w-[400px] flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg overflow-hidden h-full">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(selectedCategories.length > 0 || minRating > 0 || selectedCity !== "all" || selectedAvailability !== "all") && (
                    <Badge variant="secondary" className="ml-2">
                      {[selectedCategories.length, minRating > 0 ? 1 : 0, selectedCity !== "all" ? 1 : 0, selectedAvailability !== "all" ? 1 : 0].filter(Boolean).reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="p-2">
                  <Label className="text-xs font-medium">Categories</Label>
                  {vendorsSeedData.categories.slice(0, 4).map(category => (
                    <DropdownMenuCheckboxItem
                      key={category.id}
                      checked={selectedCategories.includes(category.slug)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category.slug]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category.slug));
                        }
                      }}
                    >
                      {category.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Label className="text-xs font-medium">Min Rating</Label>
                  <Select value={minRating.toString()} onValueChange={(value) => setMinRating(Number(value))}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Ratings</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Label className="text-xs font-medium">Availability</Label>
                  <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Vendor List */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredVendors.length === 0 ? (
              <div className="p-8 text-center">
                <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">No vendors found</p>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              filteredVendors.map(vendor => {
                const CategoryIcon = vendor.categories[0] ? categoryIcons[vendor.categories[0]] : Building;
                const docs = getVendorDocuments(vendor.id);
                const hasExpiredDocs = docs.some(d => d.status === 'expired');
                const hasExpiringSoon = docs.some(d => d.status === 'expiring_soon');
                const isSelected = selectedVendor?.id === vendor.id;
                
                return (
                  <div
                    key={vendor.id}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                      isSelected && "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500"
                    )}
                    onClick={() => {
                      setSelectedVendor(vendor);
                      setDetailTab("overview");
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CategoryIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm truncate">{vendor.name}</h3>
                              {vendor.isVerified && (
                                <Shield className="h-3 w-3 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">
                                {vendor.locationCity}, {vendor.locationState}
                              </span>
                              {vendor.hourlyRateMin && vendor.hourlyRateMax && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">
                                    ${vendor.hourlyRateMin}-${vendor.hourlyRateMax}/hr
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {(hasExpiredDocs || hasExpiringSoon) && (
                            <div className="flex-shrink-0">
                              {hasExpiredDocs ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {vendor.ratingCount > 0 ? (
                              renderStars(vendor.ratingAvg, vendor.ratingCount, 'sm')
                            ) : (
                              <span className="text-xs text-gray-500">No reviews</span>
                            )}
                          </div>
                          <Badge className={cn("text-xs", getAvailabilityBadge(vendor.availabilityStatus).className)}>
                            {getAvailabilityBadge(vendor.availabilityStatus).label}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {vendor.categories.map(cat => (
                            <Badge key={cat} variant="outline" className="text-xs">
                              {vendorsSeedData.categories.find(c => c.slug === cat)?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Vendor Details */}
      <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg overflow-hidden h-full">
        {selectedVendor ? (
          <>
            {/* Detail Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {(() => {
                      const Icon = selectedVendor.categories[0] ? categoryIcons[selectedVendor.categories[0]] : Building;
                      return <Icon className="h-8 w-8 text-gray-600 dark:text-gray-400" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{selectedVendor.name}</h2>
                      {selectedVendor.isVerified && (
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{selectedVendor.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {selectedVendor.ratingCount > 0 && renderStars(selectedVendor.ratingAvg, selectedVendor.ratingCount)}
                      <Badge className={getAvailabilityBadge(selectedVendor.availabilityStatus).className}>
                        {getAvailabilityBadge(selectedVendor.availabilityStatus).label}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowContractModal(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Contract
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowInvoiceModal(true)}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Create Invoice
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => {
                  setSelectedProject(vendorsSeedData.projects[3]);
                  setShowMatchingDrawer(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite to Project
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowContractModal(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Contract
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowInvoiceModal(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Invoice
                </Button>
              </div>
            </div>

            {/* Detail Content - Tabs */}
            <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-6 h-10 flex-shrink-0">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reviews">
                  Reviews {getVendorReviews(selectedVendor.id).length > 0 && `(${getVendorReviews(selectedVendor.id).length})`}
                </TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="documents">
                  Documents
                  {(() => {
                    const docs = getVendorDocuments(selectedVendor.id);
                    const hasIssues = docs.some(d => d.status === 'expired' || d.status === 'expiring_soon');
                    return hasIssues && <AlertTriangle className="h-3 w-3 ml-1 text-yellow-600" />;
                  })()}
                </TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>

              {/* Tab Contents */}
              {detailTab === 'overview' ? (
                <TabsContent value="overview" className="flex-1 p-4 overflow-hidden mt-0">
                  <div className="h-full flex flex-col space-y-3">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-4 gap-3 flex-shrink-0">
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Avg Rating</p>
                              <p className="text-xl font-bold">
                                {selectedVendor.ratingAvg > 0 ? selectedVendor.ratingAvg.toFixed(1) : 'N/A'}
                              </p>
                            </div>
                            <Star className="h-6 w-6 text-yellow-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Jobs Done</p>
                              <p className="text-xl font-bold">
                                {getVendorProjects(selectedVendor.id).filter(p => p.status === 'hired').length}
                              </p>
                            </div>
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Response</p>
                              <p className="text-xl font-bold">2h</p>
                            </div>
                            <Clock className="h-6 w-6 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Active</p>
                              <p className="text-xl font-bold">
                                {getVendorProjects(selectedVendor.id).filter(p => p.status === 'invited' || p.status === 'shortlisted').length}
                              </p>
                            </div>
                            <Activity className="h-6 w-6 text-purple-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                      {/* Contact Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{selectedVendor.phone}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{selectedVendor.email}</span>
                          </div>
                          {selectedVendor.website && (
                            <div className="flex items-center gap-3">
                              <Globe className="h-4 w-4 text-gray-500" />
                              <a href={selectedVendor.website} className="text-blue-600 hover:underline">
                                {selectedVendor.website}
                              </a>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{selectedVendor.locationCity}, {selectedVendor.locationState} {selectedVendor.zip}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Services & Rates */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Services & Rates</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm text-gray-500">Categories</Label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {selectedVendor.categories.map(cat => (
                                  <Badge key={cat} variant="secondary">
                                    {vendorsSeedData.categories.find(c => c.slug === cat)?.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {selectedVendor.hourlyRateMin && selectedVendor.hourlyRateMax && (
                              <div>
                                <Label className="text-sm text-gray-500">Hourly Rate</Label>
                                <p className="text-lg font-semibold">
                                  ${selectedVendor.hourlyRateMin} - ${selectedVendor.hourlyRateMax}/hr
                                </p>
                              </div>
                            )}
                            {selectedVendor.tags.length > 0 && (
                              <div>
                                <Label className="text-sm text-gray-500">Specialties</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {selectedVendor.tags.map(tag => (
                                    <Badge key={tag} variant="outline">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Availability Calendar */}
                    <Card className="flex-1 flex flex-col min-h-0">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Availability</CardTitle>
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-2" />
                            Sync Calendar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-auto">
                        <div className="grid grid-cols-7 gap-1">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                              {day}
                            </div>
                          ))}
                          {vendorsSeedData.availability
                            .filter(a => a.vendorId === selectedVendor.id)
                            .slice(0, 28)
                            .map(availability => {
                              const statusColors = {
                                free: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                                busy: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                tentative: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                                unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                              };
                              return (
                                <div
                                  key={availability.id}
                                  className={cn(
                                    "p-1.5 rounded text-xs text-center",
                                    statusColors[availability.status]
                                  )}
                                >
                                  {availability.date.getDate()}
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="p-4">

                  {/* Reviews Tab */}
                  <TabsContent value="reviews" className="mt-0 space-y-4">
                    {getVendorReviews(selectedVendor.id).length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium">No reviews yet</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Request reviews from completed projects
                          </p>
                          <Button className="mt-4" variant="outline">
                            Request Review
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      getVendorReviews(selectedVendor.id).map(review => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  {renderStars(review.rating)}
                                  <span className="font-semibold">{review.title}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  by {review.authorName} • {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                            {review.projectName && (
                              <Badge variant="outline" className="mt-2">
                                {review.projectName}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Projects Tab */}
                  <TabsContent value="projects" className="mt-0 space-y-4">
                    {getVendorProjects(selectedVendor.id).length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium">No projects yet</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Invite this vendor to your first project
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      getVendorProjects(selectedVendor.id).map(project => (
                        <Card key={project.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{project.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge variant={project.status === 'hired' ? 'default' : 'outline'}>
                                    {project.status}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {project.locationCity}, {project.locationState}
                                  </span>
                                  {project.quotedAmount && (
                                    <span className="text-sm font-medium">
                                      ${project.quotedAmount.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="mt-0 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Compliance Documents</h3>
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                    
                    {getVendorDocuments(selectedVendor.id).length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium">No documents uploaded</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Upload insurance certificates and licenses
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {getVendorDocuments(selectedVendor.id).map(doc => {
                          const statusBadge = getDocumentStatusBadge(doc.status);
                          const StatusIcon = statusBadge.icon;
                          
                          return (
                            <Card key={doc.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <StatusIcon className={cn("h-5 w-5", statusBadge.className)} />
                                    <div>
                                      <p className="font-medium">{doc.fileName}</p>
                                      <p className="text-sm text-gray-500">
                                        {doc.docType.replace('_', ' ').toUpperCase()}
                                        {doc.expiryDate && ` • Expires ${new Date(doc.expiryDate).toLocaleDateString()}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={
                                      doc.status === 'valid' ? 'default' :
                                      doc.status === 'expiring_soon' ? 'outline' :
                                      'destructive'
                                    }>
                                      {statusBadge.label}
                                    </Badge>
                                    {(doc.status === 'expired' || doc.status === 'expiring_soon') && (
                                      <Button size="sm" variant="outline">
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Reminder
                                      </Button>
                                    )}
                                    <Button size="sm" variant="ghost">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Messages Tab */}
                  <TabsContent value="messages" className="mt-0 space-y-4">
                    {getVendorMessages(selectedVendor.id).length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium">No messages yet</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Start a conversation with this vendor
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        <ScrollArea className="h-[400px] border rounded-lg p-4">
                          <div className="space-y-4">
                            {getVendorMessages(selectedVendor.id).map(message => (
                              <div key={message.id} className={cn(
                                "flex gap-3",
                                message.senderType === 'user' && "flex-row-reverse"
                              )}>
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {message.senderName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                  "flex-1 space-y-1",
                                  message.senderType === 'user' && "text-right"
                                )}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{message.senderName}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(message.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className={cn(
                                    "inline-block p-3 rounded-lg",
                                    message.senderType === 'user' 
                                      ? "bg-blue-600 text-white" 
                                      : message.senderType === 'system'
                                      ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                      : "bg-gray-100 dark:bg-gray-800"
                                  )}>
                                    <p className="text-sm">{message.message}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        
                        <div className="flex gap-2">
                          <Textarea 
                            placeholder="Type a message..." 
                            className="flex-1"
                            rows={3}
                          />
                          <div className="flex flex-col gap-2">
                            <Button size="sm">
                              <Send className="h-4 w-4 mr-2" />
                              Send
                            </Button>
                            <Button size="sm" variant="outline">
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  </div>
                </ScrollArea>
              )}
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">Select a vendor</p>
              <p className="text-sm text-gray-500 mt-1">Choose a vendor from the list to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Vendor Matching Drawer */}
      {showMatchingDrawer && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowMatchingDrawer(false)}>
          <div className="w-[600px] bg-white dark:bg-gray-900 h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Recommend Vendors</h2>
                  <p className="text-sm text-gray-500 mt-1">For: {selectedProject.title}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowMatchingDrawer(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Budget</Label>
                        <p className="font-medium">${selectedProject.budgetMin.toLocaleString()} - ${selectedProject.budgetMax.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Timeline</Label>
                        <p className="font-medium">
                          {new Date(selectedProject.startDate).toLocaleDateString()} - {new Date(selectedProject.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Location</Label>
                        <p className="font-medium">{selectedProject.locationCity}, {selectedProject.locationState}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Category</Label>
                        <p className="font-medium">HVAC</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <h3 className="font-semibold">Top Matches</h3>
                  {calculateRecommendations(selectedProject).map((match, idx) => {
                    const CategoryIcon = match.vendor.categories[0] ? categoryIcons[match.vendor.categories[0]] : Building;
                    
                    return (
                      <Card key={match.vendor.id} className={cn(
                        "relative",
                        idx === 0 && "ring-2 ring-blue-500"
                      )}>
                        {idx === 0 && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Best Match
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <CategoryIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{match.vendor.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {match.vendor.ratingCount > 0 && renderStars(match.vendor.ratingAvg)}
                                  <Badge className={getAvailabilityBadge(match.vendor.availabilityStatus).className}>
                                    {getAvailabilityBadge(match.vendor.availabilityStatus).label}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {match.factors.categoryMatch > 0.8 && (
                                    <Badge variant="outline" className="text-xs">
                                      Perfect category match
                                    </Badge>
                                  )}
                                  {match.factors.rating > 0.8 && (
                                    <Badge variant="outline" className="text-xs">
                                      High rating
                                    </Badge>
                                  )}
                                  {match.factors.availability > 0.8 && (
                                    <Badge variant="outline" className="text-xs">
                                      Available
                                    </Badge>
                                  )}
                                  {match.factors.proximity === 1 && (
                                    <Badge variant="outline" className="text-xs">
                                      Same city
                                    </Badge>
                                  )}
                                  {match.factors.priceFit > 0.8 && (
                                    <Badge variant="outline" className="text-xs">
                                      Price fits budget
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {(match.score * 100).toFixed(0)}%
                              </div>
                              <p className="text-xs text-gray-500">Match Score</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" className="flex-1">
                              Send Invite
                            </Button>
                            <Button size="sm" variant="outline">
                              View Profile
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Contract</DialogTitle>
            <DialogDescription>
              Generate a contract for {selectedVendor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {vendorsSeedData.projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contract Amount</Label>
              <Input type="number" placeholder="Enter amount" />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContractModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Contract created and sent for signature");
              setShowContractModal(false);
            }}>
              Create & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Generate an invoice for {selectedVendor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {vendorsSeedData.projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Invoice Amount</Label>
              <Input type="number" placeholder="Enter amount" />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Enter invoice description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Invoice created and sent");
              setShowInvoiceModal(false);
            }}>
              Create & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}