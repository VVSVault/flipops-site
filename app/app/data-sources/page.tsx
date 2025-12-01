
'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Globe,
  Home,
  UserCheck,
  MessageSquare,
  FileText,
  Plus,
  Settings,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Database,
  Link,
  Map,
  Filter,
  Download,
  Upload,
  Zap,
  Shield,
  Key,
  ChevronRight,
  Hash,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  User,
  Building,
  FileSearch,
  Loader2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';

interface Connector {
  id: string;
  name: string;
  type: 'public_records' | 'listings' | 'enrichment' | 'messaging' | 'documents';
  icon: React.ElementType;
  status: 'active' | 'inactive' | 'error' | 'syncing';
  lastSync?: string;
  recordsProcessed?: number;
  nextRun?: string;
  config?: any;
}

const connectors: Connector[] = [
  // Public Records
  {
    id: 'county-scraper',
    name: 'County Records',
    type: 'public_records',
    icon: Building,
    status: 'active',
    lastSync: '2024-01-10T10:30:00',
    recordsProcessed: 12847,
    nextRun: '2024-01-10T14:00:00',
    config: {
      counties: ['Miami-Dade', 'Broward', 'Palm Beach'],
      frequency: 'daily',
      documentTypes: ['Deed', 'Mortgage', 'Lis Pendens', 'Tax Lien']
    }
  },
  {
    id: 'tax-assessor',
    name: 'Tax Assessor',
    type: 'public_records',
    icon: DollarSign,
    status: 'active',
    lastSync: '2024-01-10T09:15:00',
    recordsProcessed: 8291,
    nextRun: '2024-01-10T21:15:00'
  },
  {
    id: 'foreclosure-data',
    name: 'Foreclosure Data',
    type: 'public_records',
    icon: Home,
    status: 'syncing',
    lastSync: '2024-01-10T08:00:00',
    recordsProcessed: 3456
  },
  // Listings
  {
    id: 'mls-feed',
    name: 'MLS Feed',
    type: 'listings',
    icon: Home,
    status: 'active',
    lastSync: '2024-01-10T11:00:00',
    recordsProcessed: 5832,
    nextRun: '2024-01-10T11:30:00',
    config: {
      mlsId: 'MIAMI',
      apiKey: '••••••••',
      includeOffMarket: true,
      priceRange: { min: 100000, max: 500000 }
    }
  },
  {
    id: 'zillow-api',
    name: 'Zillow API',
    type: 'listings',
    icon: Globe,
    status: 'inactive',
    lastSync: '2024-01-09T15:30:00',
    recordsProcessed: 2194
  },
  // Enrichment
  {
    id: 'skip-trace',
    name: 'Skip Trace Pro',
    type: 'enrichment',
    icon: UserCheck,
    status: 'active',
    lastSync: '2024-01-10T10:45:00',
    recordsProcessed: 892,
    config: {
      provider: 'SkipTracePro',
      apiKey: '••••••••',
      includePhones: true,
      includeEmails: true,
      includeRelatives: false
    }
  },
  {
    id: 'property-details',
    name: 'Property Details',
    type: 'enrichment',
    icon: FileSearch,
    status: 'error',
    lastSync: '2024-01-10T07:20:00',
    recordsProcessed: 445
  },
  // Messaging
  {
    id: 'twilio-sms',
    name: 'Twilio SMS',
    type: 'messaging',
    icon: MessageSquare,
    status: 'active',
    lastSync: '2024-01-10T11:15:00',
    recordsProcessed: 234
  },
  {
    id: 'sendgrid',
    name: 'SendGrid Email',
    type: 'messaging',
    icon: Mail,
    status: 'active',
    lastSync: '2024-01-10T10:00:00',
    recordsProcessed: 567
  },
  // Documents
  {
    id: 'docusign',
    name: 'DocuSign',
    type: 'documents',
    icon: FileText,
    status: 'active',
    lastSync: '2024-01-10T09:30:00',
    recordsProcessed: 89
  }
];

const fieldMappings = [
  { source: 'owner_name', target: 'contact.full_name', transform: 'titleCase' },
  { source: 'property_address', target: 'property.address', transform: 'standardize' },
  { source: 'mailing_address', target: 'contact.mailing_address', transform: 'standardize' },
  { source: 'assessed_value', target: 'property.value', transform: 'number' },
  { source: 'last_sale_date', target: 'property.last_sale', transform: 'date' },
  { source: 'phone_1', target: 'contact.phone', transform: 'phoneFormat' },
  { source: 'email', target: 'contact.email', transform: 'lowercase' }
];

const schedules = [
  { id: '1', name: 'Daily County Sync', frequency: 'Daily', time: '2:00 AM', status: 'active', lastRun: '2024-01-10 02:00 AM', nextRun: '2024-01-11 02:00 AM' },
  { id: '2', name: 'MLS Update', frequency: 'Every 30 min', time: 'N/A', status: 'active', lastRun: '2024-01-10 11:00 AM', nextRun: '2024-01-10 11:30 AM' },
  { id: '3', name: 'Weekly Enrichment', frequency: 'Weekly', time: 'Sunday 10:00 PM', status: 'active', lastRun: '2024-01-07 10:00 PM', nextRun: '2024-01-14 10:00 PM' },
  { id: '4', name: 'Tax Data Refresh', frequency: 'Monthly', time: '1st of month', status: 'paused', lastRun: '2024-01-01 03:00 AM', nextRun: 'Paused' }
];

const runs = [
  { id: '1', connector: 'County Records', startTime: '2024-01-10 10:30 AM', duration: '12m 34s', records: 847, status: 'success', errors: 0 },
  { id: '2', connector: 'MLS Feed', startTime: '2024-01-10 11:00 AM', duration: '3m 12s', records: 234, status: 'success', errors: 0 },
  { id: '3', connector: 'Skip Trace Pro', startTime: '2024-01-10 10:45 AM', duration: '5m 23s', records: 89, status: 'partial', errors: 3 },
  { id: '4', connector: 'Property Details', startTime: '2024-01-10 07:20 AM', duration: '8m 45s', records: 0, status: 'failed', errors: 1 },
  { id: '5', connector: 'County Records', startTime: '2024-01-10 02:00 AM', duration: '45m 12s', records: 3421, status: 'success', errors: 0 },
  { id: '6', connector: 'Twilio SMS', startTime: '2024-01-10 11:15 AM', duration: '1m 02s', records: 45, status: 'success', errors: 0 }
];

interface FieldMapping {
  source: string;
  target: string;
  transform: string;
}

interface Schedule {
  id: string;
  name: string;
  frequency: string;
  time: string;
  status: string;
  lastRun: string;
  nextRun: string;
}

export default function DataSourcesPage() {
  const toast = (props: { title: string; description: string }) => {
    console.log(`[Toast] ${props.title}: ${props.description}`);
    // Simple notification for now
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 z-50 p-4 bg-green-500 text-white rounded-lg shadow-lg transition-all';
      notification.innerHTML = `<div class="font-semibold">${props.title}</div><div class="text-sm">${props.description}</div>`;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
    }
  };
  const [selectedConnector, setSelectedConnector] = useState<Connector>(connectors[0]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mappings, setMappings] = useState<FieldMapping[]>(fieldMappings);
  const [schedulesList, setSchedulesList] = useState<Schedule[]>(schedules);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newMapping, setNewMapping] = useState<FieldMapping>({
    source: '',
    target: '',
    transform: 'none'
  });
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    connector: '',
    frequency: 'daily',
    time: '02:00',
    retryOnFailure: true,
    sendNotifications: true,
    skipWeekends: false
  });

  const filteredConnectors = connectors.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'inactive': return 'text-gray-400';
      case 'error': return 'text-red-500';
      case 'syncing': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <XCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'syncing': return <Loader2 className="h-4 w-4 animate-spin" />;
      default: return null;
    }
  };

  const getRunStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Success</Badge>;
      case 'partial': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Partial</Badge>;
      case 'failed': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getNextRunTime = (frequency: string, time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    if (frequency === 'daily') {
      if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
      return `Tomorrow ${time}`;
    } else if (frequency === 'weekly') {
      nextRun.setDate(nextRun.getDate() + 7);
      return `Next ${nextRun.toLocaleDateString('en-US', { weekday: 'long' })} ${time}`;
    } else if (frequency === 'monthly') {
      nextRun.setMonth(nextRun.getMonth() + 1);
      return `${nextRun.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} ${time}`;
    } else if (frequency.includes('min')) {
      const minutes = parseInt(frequency.match(/\d+/)?.[0] || '60');
      return `In ${minutes} minutes`;
    } else if (frequency === 'hourly') {
      return 'In 1 hour';
    } else {
      return 'In 6 hours';
    }
  };

  const connectorsByType = {
    public_records: filteredConnectors.filter(c => c.type === 'public_records'),
    listings: filteredConnectors.filter(c => c.type === 'listings'),
    enrichment: filteredConnectors.filter(c => c.type === 'enrichment'),
    messaging: filteredConnectors.filter(c => c.type === 'messaging'),
    documents: filteredConnectors.filter(c => c.type === 'documents')
  };

  return (
    <>
      <div className="h-[calc(100vh-6rem)] flex gap-4 p-6 overflow-hidden">
      {/* Left Rail - Connectors */}
      <Card className="w-80 h-full flex flex-col">
        <CardHeader className="flex-none pb-3">
          <CardTitle className="text-lg">Data Connectors</CardTitle>
          <CardDescription>Manage your data sources and integrations</CardDescription>
        </CardHeader>
        <CardContent className="flex-none pb-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search connectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        <div className="flex-1 overflow-hidden border-t">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
            {/* Public Records */}
            {connectorsByType.public_records.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>Public Records</span>
                </div>
                <div className="space-y-2">
                  {connectorsByType.public_records.map(connector => (
                    <Card
                      key={connector.id}
                      className={`cursor-pointer transition-colors ${
                        selectedConnector?.id === connector.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedConnector(connector)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <connector.icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{connector.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {connector.recordsProcessed?.toLocaleString()} records
                              </div>
                            </div>
                          </div>
                          <div className={getStatusColor(connector.status)}>
                            {getStatusIcon(connector.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Listings */}
            {connectorsByType.listings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <Home className="h-4 w-4" />
                  <span>Listings</span>
                </div>
                <div className="space-y-2">
                  {connectorsByType.listings.map(connector => (
                    <Card
                      key={connector.id}
                      className={`cursor-pointer transition-colors ${
                        selectedConnector?.id === connector.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedConnector(connector)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <connector.icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{connector.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {connector.recordsProcessed?.toLocaleString()} records
                              </div>
                            </div>
                          </div>
                          <div className={getStatusColor(connector.status)}>
                            {getStatusIcon(connector.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Enrichment */}
            {connectorsByType.enrichment.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <UserCheck className="h-4 w-4" />
                  <span>Enrichment</span>
                </div>
                <div className="space-y-2">
                  {connectorsByType.enrichment.map(connector => (
                    <Card
                      key={connector.id}
                      className={`cursor-pointer transition-colors ${
                        selectedConnector?.id === connector.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedConnector(connector)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <connector.icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{connector.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {connector.recordsProcessed?.toLocaleString()} records
                              </div>
                            </div>
                          </div>
                          <div className={getStatusColor(connector.status)}>
                            {getStatusIcon(connector.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Messaging */}
            {connectorsByType.messaging.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>Messaging</span>
                </div>
                <div className="space-y-2">
                  {connectorsByType.messaging.map(connector => (
                    <Card
                      key={connector.id}
                      className={`cursor-pointer transition-colors ${
                        selectedConnector?.id === connector.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedConnector(connector)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <connector.icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{connector.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {connector.recordsProcessed?.toLocaleString()} records
                              </div>
                            </div>
                          </div>
                          <div className={getStatusColor(connector.status)}>
                            {getStatusIcon(connector.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {connectorsByType.documents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </div>
                <div className="space-y-2">
                  {connectorsByType.documents.map(connector => (
                    <Card
                      key={connector.id}
                      className={`cursor-pointer transition-colors ${
                        selectedConnector?.id === connector.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedConnector(connector)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <connector.icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{connector.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {connector.recordsProcessed?.toLocaleString()} records
                              </div>
                            </div>
                          </div>
                          <div className={getStatusColor(connector.status)}>
                            {getStatusIcon(connector.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            </div>
          </ScrollArea>
        </div>
      </Card>

      {/* Right Panel - Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <selectedConnector.icon className="h-6 w-6 text-muted-foreground" />
                <div>
                  <CardTitle>{selectedConnector.name}</CardTitle>
                  <CardDescription>
                    {selectedConnector.type.replace('_', ' ').charAt(0).toUpperCase() + selectedConnector.type.replace('_', ' ').slice(1)} Integration
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(selectedConnector.status)} bg-opacity-10`}>
                  {selectedConnector.status}
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Sync Started",
                      description: `${selectedConnector.name} is now syncing. This may take a few minutes.`,
                    });
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
                <Button size="sm" onClick={() => setShowSettingsModal(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
                <TabsTrigger value="schedules">Schedules</TabsTrigger>
                <TabsTrigger value="runs">Runs</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden mt-4">
                <TabsContent value="overview" className="h-full overflow-auto">
                  <div className="grid gap-4">
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Records</p>
                              <p className="text-2xl font-semibold">{selectedConnector.recordsProcessed?.toLocaleString()}</p>
                            </div>
                            <Database className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Last Sync</p>
                              <p className="text-lg font-medium">
                                {selectedConnector.lastSync ? new Date(selectedConnector.lastSync).toLocaleTimeString() : 'Never'}
                              </p>
                            </div>
                            <Clock className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Next Run</p>
                              <p className="text-lg font-medium">
                                {selectedConnector.nextRun ? new Date(selectedConnector.nextRun).toLocaleTimeString() : 'Not scheduled'}
                              </p>
                            </div>
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Success Rate</p>
                              <p className="text-2xl font-semibold">98.5%</p>
                            </div>
                            <Zap className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div className="flex-1">
                              <p className="text-sm">Successfully synced 847 records</p>
                              <p className="text-xs text-muted-foreground">10 minutes ago</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <div className="flex-1">
                              <p className="text-sm">3 records failed validation</p>
                              <p className="text-xs text-muted-foreground">1 hour ago</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div className="flex-1">
                              <p className="text-sm">Field mapping updated</p>
                              <p className="text-xs text-muted-foreground">2 hours ago</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Error Log */}
                    {selectedConnector.status === 'error' && (
                      <Alert className="border-red-500/50 bg-red-500/5">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="ml-2">
                          <div className="font-medium mb-2">Connection Error</div>
                          <p className="text-sm mb-3">Failed to authenticate with API. Please check your credentials.</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Retry Started",
                                  description: "Attempting to reconnect to the API...",
                                });
                              }}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Opening Logs",
                                  description: "Detailed error logs are displayed in the console.",
                                });
                                console.log('Error logs for', selectedConnector.name);
                              }}
                            >
                              View Logs
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="h-full overflow-auto">
                  <div className="space-y-6">
                    {selectedConnector.id === 'county-scraper' && (
                      <>
                        <div>
                          <h3 className="text-lg font-medium mb-4">County Configuration</h3>
                          <div className="space-y-4">
                            <div>
                              <Label>Selected Counties</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {['Miami-Dade', 'Broward', 'Palm Beach', 'Orange', 'Hillsborough'].map(county => (
                                  <Badge
                                    key={county}
                                    variant={selectedConnector.config?.counties?.includes(county) ? 'default' : 'outline'}
                                    className="cursor-pointer"
                                  >
                                    {county}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label>Document Types</Label>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                {['Deed', 'Mortgage', 'Lis Pendens', 'Tax Lien', 'Probate', 'Divorce'].map(type => (
                                  <div key={type} className="flex items-center space-x-2">
                                    <Switch defaultChecked={selectedConnector.config?.documentTypes?.includes(type)} />
                                    <Label className="font-normal">{type}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label>Sync Frequency</Label>
                              <Select defaultValue={selectedConnector.config?.frequency || 'daily'}>
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hourly">Hourly</SelectItem>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedConnector.id === 'mls-feed' && (
                      <>
                        <div>
                          <h3 className="text-lg font-medium mb-4">MLS Configuration</h3>
                          <div className="space-y-4">
                            <div>
                              <Label>MLS ID</Label>
                              <Input className="mt-2" defaultValue={selectedConnector.config?.mlsId} />
                            </div>
                            <div>
                              <Label>API Key</Label>
                              <div className="flex gap-2 mt-2">
                                <Input type="password" defaultValue="••••••••••••••••" />
                                <Button variant="outline" size="icon">
                                  <Key className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label>Price Range</Label>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                <div>
                                  <Label className="text-xs">Min Price</Label>
                                  <Input 
                                    type="number" 
                                    defaultValue={selectedConnector.config?.priceRange?.min} 
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Max Price</Label>
                                  <Input 
                                    type="number" 
                                    defaultValue={selectedConnector.config?.priceRange?.max}
                                    placeholder="No limit"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch defaultChecked={selectedConnector.config?.includeOffMarket} />
                              <Label>Include off-market properties</Label>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedConnector.id === 'skip-trace' && (
                      <>
                        <div>
                          <h3 className="text-lg font-medium mb-4">Skip Trace Configuration</h3>
                          <div className="space-y-4">
                            <div>
                              <Label>Provider</Label>
                              <Select defaultValue={selectedConnector.config?.provider}>
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SkipTracePro">SkipTrace Pro</SelectItem>
                                  <SelectItem value="TLOxp">TLOxp</SelectItem>
                                  <SelectItem value="BeenVerified">BeenVerified</SelectItem>
                                  <SelectItem value="Spokeo">Spokeo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>API Key</Label>
                              <div className="flex gap-2 mt-2">
                                <Input type="password" defaultValue="••••••••••••••••" />
                                <Button variant="outline" size="icon">
                                  <Key className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label>Data Points</Label>
                              <div className="space-y-3 mt-2">
                                <div className="flex items-center space-x-2">
                                  <Switch defaultChecked={selectedConnector.config?.includePhones} />
                                  <Label>Phone Numbers</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch defaultChecked={selectedConnector.config?.includeEmails} />
                                  <Label>Email Addresses</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch defaultChecked={selectedConnector.config?.includeRelatives} />
                                  <Label>Relatives & Associates</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch />
                                  <Label>Social Media Profiles</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch />
                                  <Label>Employment History</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setHasUnsavedChanges(false);
                          toast({
                            title: "Changes Cancelled",
                            description: "Your changes have been discarded.",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setHasUnsavedChanges(false);
                          toast({
                            title: "Settings Saved",
                            description: `${selectedConnector.name} configuration has been updated successfully.`,
                          });
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mapping" className="h-full flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Field Mappings</h3>
                    <Button 
                      size="sm"
                      onClick={() => setShowMappingModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Mapping
                    </Button>
                  </div>

                  <div className="flex-1 flex gap-4 overflow-hidden">
                    <div className="flex-1 overflow-auto">
                      <div className="border rounded-lg">
                        <div className="grid grid-cols-12 gap-2 p-2 border-b bg-muted/50 text-xs font-medium">
                          <div className="col-span-4">Source Field</div>
                          <div className="col-span-1 text-center"></div>
                          <div className="col-span-4">Target Field</div>
                          <div className="col-span-2">Transform</div>
                          <div className="col-span-1"></div>
                        </div>
                        {mappings.slice(0, 7).map((mapping, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 p-2 border-b items-center hover:bg-muted/50 transition-colors">
                            <div className="col-span-4">
                              <Input 
                                value={mapping.source} 
                                onChange={(e) => {
                                  const updated = [...mappings];
                                  updated[index].source = e.target.value;
                                  setMappings(updated);
                                }}
                                className="h-7 text-xs" 
                                placeholder="Source field"
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              <ArrowRight className="h-3 w-3 text-muted-foreground mx-auto" />
                            </div>
                            <div className="col-span-4">
                              <Input 
                                value={mapping.target} 
                                onChange={(e) => {
                                  const updated = [...mappings];
                                  updated[index].target = e.target.value;
                                  setMappings(updated);
                                }}
                                className="h-7 text-xs" 
                                placeholder="Target field"
                              />
                            </div>
                            <div className="col-span-2">
                              <Select 
                                value={mapping.transform}
                                onValueChange={(value) => {
                                  const updated = [...mappings];
                                  updated[index].transform = value;
                                  setMappings(updated);
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="titleCase">Title Case</SelectItem>
                                  <SelectItem value="uppercase">Uppercase</SelectItem>
                                  <SelectItem value="lowercase">Lowercase</SelectItem>
                                  <SelectItem value="standardize">Standardize</SelectItem>
                                  <SelectItem value="phoneFormat">Phone Format</SelectItem>
                                  <SelectItem value="date">Date Format</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6"
                                onClick={() => {
                                  setMappings(mappings.filter((_, i) => i !== index));
                                  toast({
                                    title: "Mapping Removed",
                                    description: `Removed mapping: ${mapping.source} → ${mapping.target}`,
                                  });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Card className="w-96 flex-none">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Mapping Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-amber-50 dark:bg-amber-950/20 p-2 rounded text-xs">
                            <p className="font-medium mb-1">Live Preview</p>
                            <p className="text-muted-foreground">See how your data transforms in real-time</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium mb-2">Source Data (Raw)</h4>
                            <div className="space-y-1 text-xs font-mono bg-muted/50 p-2 rounded">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">owner_name:</span>
                                <span className="text-orange-600">JOHN DOE</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">property_address:</span>
                                <span className="text-orange-600">123 main st</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">phone_1:</span>
                                <span className="text-orange-600">5551234567</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">sale_price:</span>
                                <span className="text-orange-600">250000</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium mb-2">After Transformation</h4>
                            <div className="space-y-1 text-xs font-mono bg-green-50 dark:bg-green-950/20 p-2 rounded">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">contact.full_name:</span>
                                <span className="text-green-600 font-semibold">John Doe</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">property.address:</span>
                                <span className="text-green-600 font-semibold">123 Main Street</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">contact.phone:</span>
                                <span className="text-green-600 font-semibold">(555) 123-4567</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">deal.amount:</span>
                                <span className="text-green-600 font-semibold">$250,000</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="schedules" className="h-full overflow-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Scheduled Jobs</h3>
                      <Button 
                        size="sm"
                        onClick={() => setShowScheduleModal(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Schedule
                      </Button>
                    </div>

                    <div className="border rounded-lg">
                      <div className="grid grid-cols-12 gap-4 p-3 border-b bg-muted/50 text-sm font-medium">
                        <div className="col-span-3">Schedule Name</div>
                        <div className="col-span-2">Frequency</div>
                        <div className="col-span-2">Time</div>
                        <div className="col-span-2">Last Run</div>
                        <div className="col-span-2">Next Run</div>
                        <div className="col-span-1"></div>
                      </div>
                      {schedulesList.map((schedule) => (
                        <div key={schedule.id} className="grid grid-cols-12 gap-4 p-3 border-b items-center">
                          <div className="col-span-3 font-medium">{schedule.name}</div>
                          <div className="col-span-2">
                            <Badge variant="outline">{schedule.frequency}</Badge>
                          </div>
                          <div className="col-span-2 text-sm">{schedule.time}</div>
                          <div className="col-span-2 text-sm text-muted-foreground">{schedule.lastRun}</div>
                          <div className="col-span-2 text-sm">{schedule.nextRun}</div>
                          <div className="col-span-1 flex justify-end gap-1">
                            {schedule.status === 'active' ? (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8"
                                onClick={() => {
                                  const updatedSchedules = schedulesList.map(s => 
                                    s.id === schedule.id ? {...s, status: 'paused'} : s
                                  );
                                  setSchedulesList(updatedSchedules);
                                  toast({
                                    title: "Schedule Paused",
                                    description: `${schedule.name} has been paused.`,
                                  });
                                }}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8"
                                onClick={() => {
                                  const updatedSchedules = schedulesList.map(s => 
                                    s.id === schedule.id ? {...s, status: 'active'} : s
                                  );
                                  setSchedulesList(updatedSchedules);
                                  toast({
                                    title: "Schedule Activated",
                                    description: `${schedule.name} has been activated.`,
                                  });
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => {
                                setShowScheduleModal(true);
                                toast({
                                  title: "Edit Schedule",
                                  description: "Update schedule configuration.",
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="runs" className="h-full overflow-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Recent Runs</h3>
                      <div className="flex gap-2">
                        <Select defaultValue="all">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Create CSV content
                            const csvContent = [
                              ['Connector', 'Start Time', 'Duration', 'Records', 'Status', 'Errors'],
                              ...runs.map(run => [
                                run.connector,
                                run.startTime,
                                run.duration,
                                run.records.toString(),
                                run.status,
                                run.errors.toString()
                              ])
                            ].map(row => row.join(',')).join('\n');

                            // Create blob and download
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `connector-runs-${new Date().toISOString().split('T')[0]}.csv`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);

                            toast({
                              title: "Export Successful",
                              description: "Run history has been exported to CSV.",
                            });
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg">
                      <div className="grid grid-cols-12 gap-4 p-3 border-b bg-muted/50 text-sm font-medium">
                        <div className="col-span-3">Connector</div>
                        <div className="col-span-2">Start Time</div>
                        <div className="col-span-2">Duration</div>
                        <div className="col-span-2">Records</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1"></div>
                      </div>
                      {runs.map((run) => (
                        <div key={run.id} className="grid grid-cols-12 gap-4 p-3 border-b items-center">
                          <div className="col-span-3 font-medium">{run.connector}</div>
                          <div className="col-span-2 text-sm">{run.startTime}</div>
                          <div className="col-span-2 text-sm">{run.duration}</div>
                          <div className="col-span-2">
                            <div className="text-sm font-medium">{run.records.toLocaleString()}</div>
                            {run.errors > 0 && (
                              <div className="text-xs text-red-500">{run.errors} errors</div>
                            )}
                          </div>
                          <div className="col-span-2">{getRunStatusBadge(run.status)}</div>
                          <div className="col-span-1 flex justify-end">
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Error Details for Failed Run */}
                    <Alert className="border-red-500/50 bg-red-500/5">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="ml-2">
                        <div className="font-medium mb-2">Property Details - Failed Run</div>
                        <div className="text-sm space-y-1">
                          <p>Error: API rate limit exceeded</p>
                          <p className="text-xs text-muted-foreground">Timestamp: 2024-01-10 07:20:45 AM</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              toast({
                                title: "Retrying Failed Records",
                                description: "3 failed records are being reprocessed.",
                              });
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry Failed Records
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              toast({
                                title: "Log Details",
                                description: "Full error log has been opened in a new window.",
                              });
                            }}
                          >
                            View Full Log
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connector Settings</DialogTitle>
            <DialogDescription>
              Configure advanced settings for {selectedConnector.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sync Mode</Label>
              <Select defaultValue="incremental">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incremental">Incremental Sync</SelectItem>
                  <SelectItem value="full">Full Sync</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rate Limiting</Label>
              <Input type="number" placeholder="Requests per minute" defaultValue="60" />
            </div>
            <div className="space-y-2">
              <Label>Retry Policy</Label>
              <Select defaultValue="exponential">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exponential">Exponential Backoff</SelectItem>
                  <SelectItem value="linear">Linear Retry</SelectItem>
                  <SelectItem value="none">No Retry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch defaultChecked />
              <Label>Enable Error Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch defaultChecked />
              <Label>Auto-recover from failures</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowSettingsModal(false);
              toast({
                title: "Settings Updated",
                description: "Advanced settings have been saved successfully.",
              });
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Mapping Modal */}
      <Dialog open={showMappingModal} onOpenChange={setShowMappingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Field Mapping</DialogTitle>
            <DialogDescription>
              Map fields from your data source to your CRM fields
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-sm">
              <p className="font-medium mb-2">What is Field Mapping?</p>
              <p className="text-muted-foreground">Field mapping tells the system how to transform data from external sources (like county records) to match your CRM's format. For example:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• County has "OWNER_NAME" → Your CRM needs "contact.name"</li>
                <li>• County has "5551234567" → Your CRM needs "(555) 123-4567"</li>
                <li>• County has "123 main st" → Your CRM needs "123 Main Street"</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label>Source Field</Label>
              <Input 
                placeholder="e.g., owner_name, property_address, sale_price"
                value={newMapping.source}
                onChange={(e) => setNewMapping({...newMapping, source: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">The field name from the data source (county, MLS, etc.)</p>
            </div>
            <div className="space-y-2">
              <Label>Target Field</Label>
              <Input 
                placeholder="e.g., contact.full_name, property.address, deal.price"
                value={newMapping.target}
                onChange={(e) => setNewMapping({...newMapping, target: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Where this data should go in your CRM</p>
            </div>
            <div className="space-y-2">
              <Label>Transformation</Label>
              <Select 
                value={newMapping.transform}
                onValueChange={(value) => setNewMapping({...newMapping, transform: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Transformation</SelectItem>
                  <SelectItem value="titleCase">Title Case (john doe → John Doe)</SelectItem>
                  <SelectItem value="uppercase">Uppercase (john → JOHN)</SelectItem>
                  <SelectItem value="lowercase">Lowercase (JOHN → john)</SelectItem>
                  <SelectItem value="phoneFormat">Phone Format (5551234567 → (555) 123-4567)</SelectItem>
                  <SelectItem value="standardize">Address Standardize (123 main st → 123 Main Street)</SelectItem>
                  <SelectItem value="date">Date Format (01/15/2024 → 2024-01-15)</SelectItem>
                  <SelectItem value="number">Number Format ($1,234.56 → 1234.56)</SelectItem>
                  <SelectItem value="currency">Currency Format (1234.56 → $1,234.56)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">How to format the data during transfer</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowMappingModal(false);
              setNewMapping({ source: '', target: '', transform: 'none' });
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (newMapping.source && newMapping.target) {
                setMappings([...mappings, newMapping]);
                setShowMappingModal(false);
                setNewMapping({ source: '', target: '', transform: 'none' });
                toast({
                  title: "Mapping Added",
                  description: `Mapped ${newMapping.source} → ${newMapping.target} with ${newMapping.transform} transformation`,
                });
              } else {
                toast({
                  title: "Missing Fields",
                  description: "Please fill in both source and target fields",
                });
              }
            }}>
              Add Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Automated Sync Schedule</DialogTitle>
            <DialogDescription>
              Automate when your data sources sync with your CRM
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-sm">
              <p className="font-medium mb-2">🗓️ What are Sync Schedules?</p>
              <p className="text-muted-foreground mb-2">Schedules automatically pull new data from your sources at set times, keeping your CRM always up-to-date without manual work.</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• <strong>Daily schedules</strong> run every night to catch new listings & records</li>
                <li>• <strong>Hourly schedules</strong> keep hot markets constantly updated</li>
                <li>• <strong>Weekly schedules</strong> are perfect for less urgent data like tax records</li>
                <li>• All schedules run automatically - set it and forget it!</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label>Schedule Name*</Label>
              <Input 
                placeholder="e.g., Morning MLS Update, Nightly County Sync" 
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Give it a descriptive name so you know what it does</p>
            </div>

            <div className="space-y-2">
              <Label>Which Connector to Schedule*</Label>
              <Select 
                value={newSchedule.connector}
                onValueChange={(value) => setNewSchedule({...newSchedule, connector: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  {connectors.filter(c => c.status === 'active').map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span>{c.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {c.recordsProcessed?.toLocaleString()} records
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Only active connectors can be scheduled</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>How Often*</Label>
                <Select 
                  value={newSchedule.frequency}
                  onValueChange={(value) => setNewSchedule({...newSchedule, frequency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="every_15_min">Every 15 minutes</SelectItem>
                    <SelectItem value="every_30_min">Every 30 minutes</SelectItem>
                    <SelectItem value="hourly">Every hour</SelectItem>
                    <SelectItem value="every_6_hours">Every 6 hours</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">More frequent = fresher data</p>
              </div>

              <div className="space-y-2">
                <Label>At What Time*</Label>
                <Input 
                  type="time" 
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">Best to run during off-hours</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Advanced Options</Label>
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Retry on Failure</p>
                    <p className="text-xs text-muted-foreground">Automatically retry if sync fails</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Send Notifications</p>
                    <p className="text-xs text-muted-foreground">Get alerts when sync completes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Skip Weekends</p>
                    <p className="text-xs text-muted-foreground">Don't run on Saturdays/Sundays</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            <Alert className="border-amber-500/50 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <strong>Pro Tip:</strong> Start with daily syncs at 2-3 AM when servers are less busy. You can always increase frequency later if needed.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (newSchedule.name && newSchedule.connector) {
                const connectorName = connectors.find(c => c.id === newSchedule.connector)?.name || 'Unknown';
                const schedule = {
                  id: Date.now().toString(),
                  name: newSchedule.name,
                  frequency: newSchedule.frequency === 'daily' ? 'Daily' : 
                            newSchedule.frequency === 'weekly' ? 'Weekly' : 
                            newSchedule.frequency === 'monthly' ? 'Monthly' : 
                            newSchedule.frequency === 'hourly' ? 'Hourly' : 
                            'Every ' + newSchedule.frequency.replace('every_', '').replace('_', ' '),
                  time: newSchedule.time,
                  status: 'active',
                  lastRun: 'Never',
                  nextRun: getNextRunTime(newSchedule.frequency, newSchedule.time)
                };
                setSchedulesList([...schedulesList, schedule]);
                setShowScheduleModal(false);
                setNewSchedule({
                  name: '',
                  connector: '',
                  frequency: 'daily',
                  time: '02:00',
                  retryOnFailure: true,
                  sendNotifications: true,
                  skipWeekends: false
                });
                toast({
                  title: "Schedule Created Successfully! 🎉",
                  description: `${schedule.name} will sync ${connectorName} ${schedule.frequency.toLowerCase()} at ${schedule.time}.`,
                });
              } else {
                toast({
                  title: "Missing Required Fields",
                  description: "Please fill in schedule name and select a connector.",
                });
              }
            }}>
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}