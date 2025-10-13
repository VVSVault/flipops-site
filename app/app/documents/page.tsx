"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileSignature,
  FolderOpen,
  Tag,
  Calendar,
  Users,
  GitBranch,
  Package,
  Shield,
  ChevronRight,
  ChevronDown,
  Upload,
  Copy,
  RefreshCw,
  Archive,
  FileCheck,
  FilePlus,
  FileX,
  History,
  Layers,
  Paperclip,
  MessageSquare,
  AlertTriangle,
  Info,
  ArrowUpDown,
  Grid3X3,
  List,
  LayoutGrid,
  Folder,
  Home,
  Star,
  ChevronLeft,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Briefcase,
  Building,
  User,
  FileCode,
  Lock,
  Unlock,
  Zap,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  Settings,
  HelpCircle,
  X,
  Check,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipForward,
  Repeat,
  Hash,
  Link,
  Bookmark,
  Flag,
  Printer,
  Share2,
  Code,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronsRight,
  Square,
  Circle,
  Triangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  documentsSeedData, 
  type Document, 
  type DocumentTemplate,
  type Folder as FolderType,
  type Packet,
  type DocumentVersion,
  type Envelope,
  type Clause,
  type RetentionPolicy,
  calculateDocumentMetrics,
  getDocumentsByStatus,
  getDocumentsByFolder,
  getTemplatesByCategory,
  getDocumentVersions,
} from "./seed-data";

type ViewMode = 'table' | 'kanban' | 'packets';
type DocumentStatus = Document['status'];

export default function DocumentsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showPacketBuilder, setShowPacketBuilder] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'all'>('all');
  const [filterDocType, setFilterDocType] = useState<Document['docType'] | 'all'>('all');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['fld-1', 'fld-7']);
  const [activeTab, setActiveTab] = useState('documents');
  const [compareVersions, setCompareVersions] = useState<{ v1?: string; v2?: string }>({});
  const [newPacket, setNewPacket] = useState<Partial<Packet>>({
    packetType: 'Acquisition',
    status: 'draft',
    packetItems: [],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter documents
  const filterDocuments = () => {
    return documentsSeedData.documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.relatedName && doc.relatedName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
      const matchesType = filterDocType === 'all' || doc.docType === filterDocType;
      const matchesFolder = filterFolder === 'all' || doc.folderId === filterFolder;
      
      return matchesSearch && matchesStatus && matchesType && matchesFolder;
    });
  };

  // Get status color
  const getStatusColor = (status: DocumentStatus) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      signed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      void: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return colors[status];
  };

  // Get status icon
  const getStatusIcon = (status: DocumentStatus) => {
    const icons = {
      draft: FileText,
      sent: Send,
      signed: CheckCircle,
      void: XCircle,
      expired: AlertCircle,
    };
    return icons[status];
  };

  // Get document type icon
  const getDocTypeIcon = (docType: Document['docType']) => {
    const icons = {
      LOI: FileSignature,
      PSA: FileCheck,
      JV: Users,
      Assignment: GitBranch,
      NDA: Lock,
      Addendum: FilePlus,
      Other: FileText,
    };
    return icons[docType];
  };

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  // Render folder tree
  const renderFolderTree = (parentId?: string, level = 0) => {
    const folders = documentsSeedData.folders.filter(f => f.parentFolderId === parentId);
    
    return folders.map(folder => {
      const hasChildren = documentsSeedData.folders.some(f => f.parentFolderId === folder.id);
      const isExpanded = expandedFolders.includes(folder.id);
      const isSelected = selectedFolder?.id === folder.id;
      const docCount = getDocumentsByFolder(folder.id).length;
      
      return (
        <div key={folder.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
              isSelected && "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              setSelectedFolder(folder);
              setFilterFolder(folder.id);
              if (hasChildren) toggleFolder(folder.id);
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )
            ) : (
              <div className="w-4" />
            )}
            <FolderOpen className={cn("h-4 w-4",
              folder.color === '#3B82F6' ? 'text-blue-500' :
              folder.color === '#6B7280' ? 'text-gray-500' :
              ''
            )} />
            <span className="flex-1 text-sm">{folder.name}</span>
            {docCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {docCount}
              </Badge>
            )}
          </div>
          {hasChildren && isExpanded && renderFolderTree(folder.id, level + 1)}
        </div>
      );
    });
  };

  // Handle document actions
  const handleSendDocument = (doc: Document) => {
    toast.success(`Document sent for signature: ${doc.title}`);
  };

  const handleDownloadDocument = (doc: Document) => {
    toast.success(`Downloading: ${doc.title}`);
  };

  const handleVoidDocument = (doc: Document) => {
    toast.warning(`Document voided: ${doc.title}`);
  };

  const handleNewVersion = (doc: Document) => {
    setSelectedDocument(doc);
    toast.info(`Creating new version of: ${doc.title}`);
  };

  // Handle template actions
  const handleUseTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateEditor(true);
    toast.info(`Using template: ${template.name}`);
  };

  // Handle packet actions
  const handleGeneratePacket = () => {
    toast.success("Packet generated successfully!");
    setShowPacketBuilder(false);
  };

  // Calculate metrics
  const metrics = calculateDocumentMetrics();

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-gray-500">Loading documents...</div>
      </div>
    );
  }

  const filteredDocuments = filterDocuments();

  return (
    <div className="flex h-[calc(100vh-6.5rem)] bg-gray-50 dark:bg-gray-950 p-2 gap-3 overflow-hidden">
      {/* Left Sidebar - Folders */}
      <div className="w-64 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Button className="w-full h-8" size="sm" onClick={() => setShowTemplateLibrary(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Quick Access</div>
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
                  filterStatus === 'sent' && "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                )}
                onClick={() => {
                  setFilterStatus('sent');
                  setFilterFolder('all');
                  setSelectedFolder(null);
                }}
              >
                <Send className="h-4 w-4" />
                <span className="flex-1 text-sm">Awaiting Signature</span>
                <Badge variant="secondary">{metrics.byStatus.sent}</Badge>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
                  filterStatus === 'draft' && "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                )}
                onClick={() => {
                  setFilterStatus('draft');
                  setFilterFolder('all');
                  setSelectedFolder(null);
                }}
              >
                <FileText className="h-4 w-4" />
                <span className="flex-1 text-sm">Drafts</span>
                <Badge variant="secondary">{metrics.byStatus.draft}</Badge>
              </div>
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => setShowPacketBuilder(true)}
              >
                <Package className="h-4 w-4" />
                <span className="flex-1 text-sm">Create Packet</span>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Folders</div>
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
                  filterFolder === 'all' && !selectedFolder && "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                )}
                onClick={() => {
                  setFilterFolder('all');
                  setSelectedFolder(null);
                }}
              >
                <Home className="h-4 w-4" />
                <span className="flex-1 text-sm">All Documents</span>
                <Badge variant="secondary">{documentsSeedData.documents.length}</Badge>
              </div>
              {renderFolderTree()}
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-2 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="text-xs text-gray-500">Storage: 6.5/10 GB</div>
          <Progress value={65} className="h-1 mt-1" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-3 py-1 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-xl font-bold">Documents</h1>
              <p className="text-xs text-gray-500">
                Manage contracts, agreements, and legal documents
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setShowTemplateLibrary(true)}>
                      <Layers className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Template Library</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setShowPacketBuilder(true)}>
                      <Package className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Packet Builder</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-none border-x"
                  onClick={() => setViewMode('kanban')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'packets' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode('packets')}
                >
                  <Package className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Metrics Cards */}
          <div className="grid grid-cols-5 gap-2">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Docs</p>
                    <p className="text-xl font-bold">{metrics.total}</p>
                  </div>
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Awaiting</p>
                    <p className="text-xl font-bold">{metrics.byStatus.sent}</p>
                  </div>
                  <Send className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Signed</p>
                    <p className="text-xl font-bold">{metrics.byStatus.signed}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Avg Time</p>
                    <p className="text-xl font-bold">{metrics.avgSigningTimeHours}h</p>
                  </div>
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Templates</p>
                    <p className="text-xl font-bold">{metrics.templatesActive}</p>
                  </div>
                  <Layers className="h-5 w-5 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Filters */}
        <div className="px-3 py-1 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDocType} onValueChange={(value: any) => setFilterDocType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="LOI">LOI</SelectItem>
                <SelectItem value="PSA">PSA</SelectItem>
                <SelectItem value="JV">JV Agreement</SelectItem>
                <SelectItem value="Assignment">Assignment</SelectItem>
                <SelectItem value="NDA">NDA</SelectItem>
                <SelectItem value="Addendum">Addendum</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedDocuments.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedDocuments.length} selected
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setSelectedDocuments([])}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Content Area */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-3">
            {viewMode === 'table' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDocuments.length === filteredDocuments.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDocuments(filteredDocuments.map(d => d.id));
                          } else {
                            setSelectedDocuments([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Related To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Signers</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map(doc => {
                    const StatusIcon = getStatusIcon(doc.status);
                    const TypeIcon = getDocTypeIcon(doc.docType);
                    
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedDocuments.includes(doc.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDocuments([...selectedDocuments, doc.id]);
                              } else {
                                setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <TypeIcon className="h-5 w-5 text-gray-500" />
                            <div>
                              <div
                                className="font-medium hover:text-blue-600 cursor-pointer"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setShowDocumentViewer(true);
                                }}
                              >
                                {doc.title}
                              </div>
                              {doc.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {doc.tags.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {doc.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{doc.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.docType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(doc.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {doc.relatedName && (
                            <div className="text-sm">
                              <div className="font-medium">{doc.relatedName}</div>
                              <div className="text-gray-500 capitalize">{doc.relatedEntity}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(doc.createdAt).toLocaleDateString()}</div>
                            <div className="text-gray-500">v{doc.version}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.signerRoles.length > 0 && (
                            <div className="flex -space-x-2">
                              {doc.signerRoles.slice(0, 3).map((signer, idx) => (
                                <TooltipProvider key={idx}>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Avatar className="h-8 w-8 border-2 border-white">
                                        <AvatarFallback
                                          className={cn(
                                            signer.status === 'signed' && "bg-green-100 text-green-700",
                                            signer.status === 'sent' && "bg-blue-100 text-blue-700",
                                            signer.status === 'viewed' && "bg-yellow-100 text-yellow-700"
                                          )}
                                        >
                                          {signer.role[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div>{signer.role}</div>
                                      {signer.name && <div className="text-xs">{signer.name}</div>}
                                      <div className="text-xs capitalize">{signer.status}</div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                              {doc.signerRoles.length > 3 && (
                                <Avatar className="h-8 w-8 border-2 border-white">
                                  <AvatarFallback>+{doc.signerRoles.length - 3}</AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedDocument(doc);
                                setShowDocumentViewer(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              {doc.status === 'draft' && (
                                <>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSendDocument(doc)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send
                                  </DropdownMenuItem>
                                </>
                              )}
                              {doc.status === 'sent' && (
                                <DropdownMenuItem>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Resend
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleNewVersion(doc)}>
                                <GitBranch className="h-4 w-4 mr-2" />
                                New Version
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              {doc.status !== 'void' && (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleVoidDocument(doc)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Void
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
            )}
            
            {viewMode === 'kanban' && (
              <div className="grid grid-cols-5 gap-4">
                {(['draft', 'sent', 'signed', 'expired', 'void'] as DocumentStatus[]).map(status => {
                  const StatusIcon = getStatusIcon(status);
                  const docsInStatus = filteredDocuments.filter(d => d.status === status);
                  
                  return (
                    <div key={status} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <StatusIcon className="h-4 w-4" />
                        <h3 className="font-semibold capitalize">{status}</h3>
                        <Badge variant="secondary">{docsInStatus.length}</Badge>
                      </div>
                      <ScrollArea className="flex-1 h-[400px]">
                        <div className="space-y-2">
                          {docsInStatus.map(doc => {
                            const TypeIcon = getDocTypeIcon(doc.docType);
                            
                            return (
                              <Card 
                                key={doc.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setShowDocumentViewer(true);
                                }}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <TypeIcon className="h-4 w-4 text-gray-500" />
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem>View</DropdownMenuItem>
                                        <DropdownMenuItem>Download</DropdownMenuItem>
                                        {status === 'draft' && (
                                          <DropdownMenuItem>Send</DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <h4 className="font-medium text-sm mb-1 line-clamp-2">
                                    {doc.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Badge variant="outline" className="text-xs">
                                      {doc.docType}
                                    </Badge>
                                    <span>v{doc.version}</span>
                                  </div>
                                  {doc.relatedName && (
                                    <div className="mt-2 text-xs text-gray-500">
                                      {doc.relatedName}
                                    </div>
                                  )}
                                  {doc.signerRoles.length > 0 && (
                                    <div className="mt-2 flex -space-x-1">
                                      {doc.signerRoles.slice(0, 3).map((signer, idx) => (
                                        <div
                                          key={idx}
                                          className={cn(
                                            "h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium",
                                            signer.status === 'signed' && "bg-green-100 text-green-700",
                                            signer.status === 'sent' && "bg-blue-100 text-blue-700",
                                            signer.status === 'viewed' && "bg-yellow-100 text-yellow-700",
                                            signer.status === 'pending' && "bg-gray-100 text-gray-700"
                                          )}
                                        >
                                          {signer.role[0]}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  );
                })}
              </div>
            )}
            
            {viewMode === 'packets' && (
              <div className="space-y-4">
                {documentsSeedData.packets.map(packet => (
                  <Card key={packet.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Package className="h-8 w-8 text-gray-500 mt-1" />
                          <div>
                            <h3 className="font-semibold">{packet.name}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <Badge variant="outline">{packet.packetType}</Badge>
                              <span>{packet.relatedDealName}</span>
                              <span>{new Date(packet.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-3 space-y-2">
                              {packet.packetItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <div className="text-sm font-medium text-gray-500 w-6">
                                    {item.order}.
                                  </div>
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{item.title}</span>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      item.status === 'signed' && "bg-green-50 text-green-700",
                                      item.status === 'sent' && "bg-blue-50 text-blue-700",
                                      item.status === 'pending' && "bg-gray-50 text-gray-700"
                                    )}
                                  >
                                    {item.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(packet.status as DocumentStatus)}>
                            {packet.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Actions
                                <ChevronDown className="h-4 w-4 ml-2" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Packet
                              </DropdownMenuItem>
                              {packet.status === 'draft' && (
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send All
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download All
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate Packet
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Template Library Dialog */}
      <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Library</DialogTitle>
            <DialogDescription>
              Choose from ready-to-use templates or create your own
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="acquisition">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
              <TabsTrigger value="partnership">Partnership</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
              <TabsTrigger value="modification">Modification</TabsTrigger>
            </TabsList>
            
            <TabsContent value="acquisition" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {getTemplatesByCategory('Acquisition').map(template => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const Icon = getDocTypeIcon(template.docType);
                            return <Icon className="h-8 w-8 text-blue-500" />;
                          })()}
                          <div>
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-sm text-gray-500">{template.docType}</p>
                          </div>
                        </div>
                        <Badge variant="outline">v{template.version}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{template.estimatedPages} pages</span>
                          <span>{template.rolesSchema.length} signers</span>
                        </div>
                        <Button size="sm" onClick={() => handleUseTemplate(template)}>
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="assignment" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {getTemplatesByCategory('Assignment').map(template => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const Icon = getDocTypeIcon(template.docType);
                            return <Icon className="h-8 w-8 text-green-500" />;
                          })()}
                          <div>
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-sm text-gray-500">{template.docType}</p>
                          </div>
                        </div>
                        <Badge variant="outline">v{template.version}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{template.estimatedPages} pages</span>
                          <span>{template.rolesSchema.length} signers</span>
                        </div>
                        <Button size="sm" onClick={() => handleUseTemplate(template)}>
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Sheet */}
      <Sheet open={showDocumentViewer} onOpenChange={setShowDocumentViewer}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          {selectedDocument && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedDocument.title}</SheetTitle>
                <SheetDescription>
                  Version {selectedDocument.version} • {selectedDocument.docType}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(selectedDocument.status)}>
                    {(() => {
                      const Icon = getStatusIcon(selectedDocument.status);
                      return <Icon className="h-3 w-3 mr-1" />;
                    })()}
                    {selectedDocument.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {selectedDocument.status === 'draft' && (
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    )}
                  </div>
                </div>
                
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="signers">Signers</TabsTrigger>
                    <TabsTrigger value="versions">Versions</TabsTrigger>
                    <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="mt-4 space-y-4">
                    <div>
                      <Label className="text-xs text-gray-500">Related To</Label>
                      <div className="mt-1">
                        {selectedDocument.relatedName || 'Not linked'}
                        {selectedDocument.relatedEntity && (
                          <Badge variant="outline" className="ml-2 capitalize">
                            {selectedDocument.relatedEntity}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Created By</Label>
                      <div className="mt-1">{selectedDocument.createdByUserName}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Created On</Label>
                      <div className="mt-1">
                        {new Date(selectedDocument.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {selectedDocument.signedAt && (
                      <div>
                        <Label className="text-xs text-gray-500">Signed On</Label>
                        <div className="mt-1">
                          {new Date(selectedDocument.signedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {selectedDocument.expiresAt && (
                      <div>
                        <Label className="text-xs text-gray-500">Expires On</Label>
                        <div className="mt-1">
                          {new Date(selectedDocument.expiresAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-gray-500">Tags</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedDocument.tags.map(tag => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="signers" className="mt-4 space-y-3">
                    {selectedDocument.signerRoles.map((signer, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{signer.role[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{signer.role}</div>
                            <div className="text-sm text-gray-500">
                              {signer.name || signer.email || 'Not assigned'}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            signer.status === 'signed' && "bg-green-50 text-green-700",
                            signer.status === 'sent' && "bg-blue-50 text-blue-700",
                            signer.status === 'viewed' && "bg-yellow-50 text-yellow-700"
                          )}
                        >
                          {signer.status}
                        </Badge>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="versions" className="mt-4 space-y-3">
                    {getDocumentVersions(selectedDocument.id).map(version => (
                      <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Version {version.version}</div>
                          <div className="text-sm text-gray-500">{version.changeLog}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(version.createdAt).toLocaleString()} by {version.createdByUserName}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="audit" className="mt-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {selectedDocument.auditLog.map((event, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                {event.action === 'created' && <FilePlus className="h-4 w-4" />}
                                {event.action === 'sent' && <Send className="h-4 w-4" />}
                                {event.action === 'viewed' && <Eye className="h-4 w-4" />}
                                {event.action === 'signed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {event.action === 'updated' && <Edit className="h-4 w-4" />}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{event.userName}</div>
                              <div className="text-sm text-gray-500">{event.details || event.action}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(event.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Packet Builder Dialog */}
      <Dialog open={showPacketBuilder} onOpenChange={setShowPacketBuilder}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Packet Builder</DialogTitle>
            <DialogDescription>
              Create a bundle of documents for your deal
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Packet Type</Label>
              <Select
                value={newPacket.packetType}
                onValueChange={(value: Packet['packetType']) => 
                  setNewPacket({ ...newPacket, packetType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acquisition">Acquisition Packet</SelectItem>
                  <SelectItem value="Assignment">Assignment Packet</SelectItem>
                  <SelectItem value="Disposition">Disposition Packet</SelectItem>
                  <SelectItem value="JV">JV Packet</SelectItem>
                  <SelectItem value="Custom">Custom Packet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Packet Name</Label>
              <Input
                placeholder="Enter packet name"
                value={newPacket.name || ''}
                onChange={(e) => setNewPacket({ ...newPacket, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Related Deal</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a deal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEAL-001">123 Main St, Phoenix</SelectItem>
                  <SelectItem value="DEAL-002">456 Desert View, Scottsdale</SelectItem>
                  <SelectItem value="DEAL-003">789 University Dr, Tempe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Documents</Label>
              <div className="mt-2 space-y-2 border rounded-lg p-3">
                {newPacket.packetType === 'Acquisition' && (
                  <>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4" />
                        <span className="text-sm">LOI - Letter of Intent</span>
                      </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        <span className="text-sm">PSA - Purchase Agreement</span>
                      </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm">NDA - Non-Disclosure</span>
                      </div>
                      <Checkbox />
                    </div>
                  </>
                )}
                {newPacket.packetType === 'Assignment' && (
                  <>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        <span className="text-sm">Assignment Agreement</span>
                      </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">Notice to Seller</span>
                      </div>
                      <Checkbox defaultChecked />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPacketBuilder(false)}>
              Cancel
            </Button>
            <Button onClick={handleGeneratePacket}>
              Generate Packet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}