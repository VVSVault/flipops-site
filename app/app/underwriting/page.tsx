"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Home,
  DollarSign,
  Calculator,
  Wrench,
  TrendingUp,
  AlertTriangle,
  History,
  FileText,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Plus,
  Save,
  Send,
  Download,
  AlertCircle,
  CheckCircle,
  Building,
  Phone,
  Mail,
  Clock,
  Star,
  Trash2,
  Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { underwritingSeedData, type RepairItem } from "./seed-data";

export default function UnderwritingPage() {
  // State management
  const [selectedDealId, setSelectedDealId] = useState<string>("LEAD-001");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  
  // What-if sliders
  const [arvAdjustment, setArvAdjustment] = useState(0);
  const [repairsAdjustment, setRepairsAdjustment] = useState(0);
  const [daysHeldAdjustment, setDaysHeldAdjustment] = useState(0);
  
  // Comps state
  const [selectedComps, setSelectedComps] = useState<string[]>([]);
  const [arvMethod, setArvMethod] = useState<"median" | "weighted" | "knn">("weighted");
  
  // Repairs state
  const [repairItems, setRepairItems] = useState<RepairItem[]>([]);
  
  // Get current deal data
  const currentDeal = underwritingSeedData.deals.find(d => d.id === selectedDealId);
  const currentSession = underwritingSeedData.sessions.find(s => s.leadId === selectedDealId);
  const currentComps = underwritingSeedData.comps.filter(c => c.leadId === selectedDealId);
  const currentRepairs = underwritingSeedData.repairItems.filter(r => r.sessionId === currentSession?.id);
  const currentHistory = underwritingSeedData.history.filter(h => h.sessionId === currentSession?.id);
  
  // Reset state when switching properties
  useEffect(() => {
    const compsForDeal = underwritingSeedData.comps.filter(c => c.leadId === selectedDealId);
    setSelectedComps(compsForDeal.filter(c => c.selected).map(c => c.id));
    
    const repairsForSession = underwritingSeedData.repairItems.filter(
      r => r.sessionId === underwritingSeedData.sessions.find(s => s.leadId === selectedDealId)?.id
    );
    setRepairItems(repairsForSession.length > 0 ? repairsForSession : [
      { id: "NEW-1", sessionId: currentSession?.id || "", category: "Exterior", item: "Roof Replacement", qty: 1, unit: "sqft", unitCost: 7, totalCost: 10500, notes: "" },
      { id: "NEW-2", sessionId: currentSession?.id || "", category: "Interior", item: "Kitchen Renovation", qty: 1, unit: "job", unitCost: 15000, totalCost: 15000, notes: "" },
      { id: "NEW-3", sessionId: currentSession?.id || "", category: "Interior", item: "Bathroom Remodel", qty: 2, unit: "each", unitCost: 5000, totalCost: 10000, notes: "" },
      { id: "NEW-4", sessionId: currentSession?.id || "", category: "Flooring", item: "LVP Installation", qty: 1200, unit: "sqft", unitCost: 4.5, totalCost: 5400, notes: "" },
      { id: "NEW-5", sessionId: currentSession?.id || "", category: "Interior", item: "Paint Interior", qty: 1, unit: "job", unitCost: 3500, totalCost: 3500, notes: "" }
    ]);
    
    // Reset sliders
    setArvAdjustment(0);
    setRepairsAdjustment(0);
    setDaysHeldAdjustment(0);
  }, [selectedDealId, currentSession?.id]);
  
  // Calculate ARV based on method
  const calculateARV = () => {
    const selected = currentComps.filter(c => selectedComps.includes(c.id));
    if (selected.length === 0) return 0;
    
    switch (arvMethod) {
      case "median": {
        const prices = selected.map(c => c.pricePerSqft).sort((a, b) => a - b);
        const median = prices[Math.floor(prices.length / 2)];
        return median * (currentDeal?.sqft || 0);
      }
      case "weighted": {
        let totalWeight = 0;
        let weightedSum = 0;
        selected.forEach(comp => {
          const distanceWeight = 1 / (1 + comp.distance);
          const similarityWeight = comp.similarity / 100;
          const weight = (distanceWeight * 0.4 + similarityWeight * 0.6);
          totalWeight += weight;
          weightedSum += comp.pricePerSqft * weight;
        });
        return (weightedSum / totalWeight) * (currentDeal?.sqft || 0);
      }
      case "knn": {
        // Simplified kNN - just use top 3 by similarity
        const top3 = selected.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
        const avgPricePerSqft = top3.reduce((sum, c) => sum + c.pricePerSqft, 0) / top3.length;
        return avgPricePerSqft * (currentDeal?.sqft || 0);
      }
      default:
        return 0;
    }
  };
  
  // Calculate adjusted values
  const baseARV = calculateARV();
  const adjustedARV = baseARV * (1 + arvAdjustment / 100);
  const baseRepairs = repairItems.reduce((sum, item) => sum + item.totalCost, 0);
  const adjustedRepairs = baseRepairs * (1 + repairsAdjustment / 100);
  
  // Calculate MAO
  const calculateMAO = () => {
    const assumptions = underwritingSeedData.assumptions;
    const realtorFees = adjustedARV * assumptions.realtorPct;
    const closingCosts = adjustedARV * assumptions.closingPct;
    const holdingCosts = assumptions.holdingPerDay * (assumptions.rehabDays + daysHeldAdjustment);
    const desiredProfit = adjustedARV * assumptions.profitTargetPct;
    
    const calculatedMAO = adjustedARV - adjustedRepairs - realtorFees - closingCosts - holdingCosts - desiredProfit;
    return Math.max(0, calculatedMAO); // Never return negative MAO
  };
  
  const mao = calculateMAO();
  const suggestedOffer = Math.max(0, mao * 0.95); // 95% of MAO as suggested offer, never negative

  // Toggle comp selection
  const toggleCompSelection = (compId: string) => {
    setSelectedComps(prev => 
      prev.includes(compId) 
        ? prev.filter(id => id !== compId)
        : [...prev, compId]
    );
  };

  // Update repair item
  const updateRepairItem = (itemId: string, field: keyof RepairItem, value: string | number) => {
    setRepairItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, [field]: value, totalCost: field === 'qty' || field === 'unitCost' 
            ? (field === 'qty' ? value : item.qty) * (field === 'unitCost' ? value : item.unitCost)
            : item.totalCost }
        : item
    ));
  };

  // Add repair item
  const addRepairItem = () => {
    const newItem: RepairItem = {
      id: `REPAIR-NEW-${Date.now()}`,
      sessionId: currentSession?.id || "",
      category: "other",
      description: "New repair item",
      qty: 1,
      uom: "each",
      unitCost: 1000,
      totalCost: 1000,
      confidence: "low"
    };
    setRepairItems(prev => [...prev, newItem]);
  };

  // Remove repair item
  const removeRepairItem = (itemId: string) => {
    setRepairItems(prev => prev.filter(item => item.id !== itemId));
  };

  return (
    <div className="flex h-[calc(100vh-6.5rem)] bg-gray-50 dark:bg-gray-950 p-2 gap-3 overflow-hidden">
      {/* Left Rail - Deal Selector */}
      <div className={cn(
        "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg transition-all duration-300 flex flex-col h-full",
        leftPanelCollapsed ? "w-16" : "w-80"
      )}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!leftPanelCollapsed && (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-white">Deals</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLeftPanelCollapsed(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </>
            )}
            {leftPanelCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftPanelCollapsed(false)}
                className="mx-auto"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          {!leftPanelCollapsed && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>
        
        {!leftPanelCollapsed && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {underwritingSeedData.deals
                .filter(deal => 
                  deal.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  deal.id.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((deal) => (
                <Card
                  key={deal.id}
                  className={cn(
                    "cursor-pointer transition-all border-gray-200 dark:border-gray-800",
                    selectedDealId === deal.id 
                      ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30" 
                      : "hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-700"
                  )}
                  onClick={() => setSelectedDealId(deal.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {deal.address}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {deal.owner} • {deal.id}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={deal.status === "hot" ? "destructive" : "secondary"} className="text-xs">
                            {deal.status}
                          </Badge>
                          {deal.signals.slice(0, 2).map((signal, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {deal.status === "hot" && (
                        <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg h-full overflow-hidden">
        {/* Sticky Net Sheet Bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">After Repair Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${Math.round(adjustedARV).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Est. Repairs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${Math.round(adjustedRepairs).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Maximum Allowable Offer</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${Math.round(mao).toLocaleString()}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">Suggested Offer</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">${Math.round(suggestedOffer).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.success("Snapshot saved!")}>
                <Save className="h-4 w-4 mr-2" />
                Save Snapshot
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => toast.success("Offer created!")}
              >
                <Send className="h-4 w-4 mr-2" />
                Create Offer
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 h-10">
            <TabsTrigger value="summary" className="gap-2">
              <Home className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="comps" className="gap-2">
              <MapPin className="h-4 w-4" />
              Comps
            </TabsTrigger>
            <TabsTrigger value="repairs" className="gap-2">
              <Wrench className="h-4 w-4" />
              Repairs
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="risks" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risks & Records
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-0">
                <div className="space-y-6">
                  {/* What-if Sliders */}
                  <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader className="pb-3 pt-4">
                      <CardTitle className="text-sm">Sensitivity Analysis</CardTitle>
                      <CardDescription className="text-xs">Adjust values to see impact on MAO</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>ARV Adjustment</Label>
                          <span className="text-sm font-medium">{arvAdjustment > 0 ? '+' : ''}{arvAdjustment}%</span>
                        </div>
                        <Slider
                          value={[arvAdjustment]}
                          onValueChange={([value]) => setArvAdjustment(value)}
                          min={-20}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Repairs Adjustment</Label>
                          <span className="text-sm font-medium">{repairsAdjustment > 0 ? '+' : ''}{repairsAdjustment}%</span>
                        </div>
                        <Slider
                          value={[repairsAdjustment]}
                          onValueChange={([value]) => setRepairsAdjustment(value)}
                          min={-20}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Days Held Adjustment</Label>
                          <span className="text-sm font-medium">{daysHeldAdjustment > 0 ? '+' : ''}{daysHeldAdjustment} days</span>
                        </div>
                        <Slider
                          value={[daysHeldAdjustment]}
                          onValueChange={([value]) => setDaysHeldAdjustment(value)}
                          min={-30}
                          max={30}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Exit Strategy Comparison */}
                  <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm">Exit Strategy Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Wholesale</span>
                            <span className="text-xs text-blue-600 dark:text-blue-400">Quick</span>
                          </div>
                          <p className="text-sm font-bold">${Math.round(Math.max(0, (mao * 0.15))).toLocaleString()}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Assignment</p>
                        </div>
                        
                        <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Fix & Flip</span>
                            <span className="text-xs text-green-600 dark:text-green-400">90d</span>
                          </div>
                          <p className="text-sm font-bold">${Math.round(Math.max(0, (adjustedARV - suggestedOffer - adjustedRepairs - (adjustedARV * 0.08)))).toLocaleString()}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Net Profit</p>
                        </div>
                        
                        <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Wholetail</span>
                            <span className="text-xs text-purple-600 dark:text-purple-400">30d</span>
                          </div>
                          <p className="text-sm font-bold">${Math.round(Math.max(0, (adjustedARV * 0.85 - suggestedOffer - 5000))).toLocaleString()}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Light Rehab</p>
                        </div>
                        
                        <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Rental</span>
                            <span className="text-xs text-orange-600 dark:text-orange-400">Hold</span>
                          </div>
                          <p className="text-sm font-bold">${Math.round(Math.max(0, adjustedARV * 0.01)).toLocaleString()}/mo</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Est. Rent</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Best Strategy:</span>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            {adjustedARV - suggestedOffer - adjustedRepairs > 50000 ? "Fix & Flip" : 
                             mao < 50000 ? "Wholesale" : "Wholetail"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Property Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Address</span>
                            <span className="text-sm font-medium">{currentDeal?.address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Beds / Baths</span>
                            <span className="text-sm font-medium">{currentDeal?.beds} / {currentDeal?.baths}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Square Feet</span>
                            <span className="text-sm font-medium">{currentDeal?.sqft?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Year Built</span>
                            <span className="text-sm font-medium">{currentDeal?.yearBuilt}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Owner</span>
                            <span className="text-sm font-medium">{currentDeal?.owner}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">List Price</span>
                            <span className="text-sm font-medium">
                              {currentDeal?.listPrice ? `$${Math.round(currentDeal.listPrice).toLocaleString()}` : 'Not Listed'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Days on Market</span>
                            <span className="text-sm font-medium">{currentDeal?.dom || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Property Type</span>
                            <span className="text-sm font-medium">Single Family</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Comps Tab */}
              <TabsContent value="comps" className="mt-0">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Comparable Properties</CardTitle>
                          <CardDescription>Select and weight comps to calculate ARV</CardDescription>
                        </div>
                        <Select value={arvMethod} onValueChange={(value) => setArvMethod(value as "median" | "weighted" | "knn")}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="median">Median Method</SelectItem>
                            <SelectItem value="weighted">Weighted Method</SelectItem>
                            <SelectItem value="knn">kNN Method</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Select</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Sold Date</TableHead>
                            <TableHead>Sold Price</TableHead>
                            <TableHead>Beds/Baths</TableHead>
                            <TableHead>Sqft</TableHead>
                            <TableHead>$/Sqft</TableHead>
                            <TableHead>Distance</TableHead>
                            <TableHead>Similarity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentComps.map((comp) => (
                            <TableRow key={comp.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedComps.includes(comp.id)}
                                  onCheckedChange={() => toggleCompSelection(comp.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{comp.address}</TableCell>
                              <TableCell>{new Date(comp.soldDate).toLocaleDateString()}</TableCell>
                              <TableCell>${Math.round(comp.soldPrice).toLocaleString()}</TableCell>
                              <TableCell>{comp.beds}/{comp.baths}</TableCell>
                              <TableCell>{comp.sqft.toLocaleString()}</TableCell>
                              <TableCell>${Math.round(comp.pricePerSqft)}</TableCell>
                              <TableCell>{comp.distance} mi</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={comp.similarity} className="w-16 h-2" />
                                  <span className="text-xs">{comp.similarity}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Comps Quality Check */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quality Checks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {selectedComps.length >= 3 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm">
                            {selectedComps.length} comps selected (minimum 3 recommended)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">All comps within 0.75 miles</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">All comps sold within last 12 months</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Repairs Tab */}
              <TabsContent value="repairs" className="mt-0">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Repair Estimates</CardTitle>
                        <CardDescription>Detailed breakdown of repair costs</CardDescription>
                      </div>
                      <Button onClick={addRepairItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {repairItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.description}
                                onChange={(e) => updateRepairItem(item.id, 'description', e.target.value)}
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateRepairItem(item.id, 'qty', Number(e.target.value))}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>{item.uom}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.unitCost}
                                onChange={(e) => updateRepairItem(item.id, 'unitCost', Number(e.target.value))}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              ${Math.round(item.totalCost).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  item.confidence === "high" ? "default" :
                                  item.confidence === "medium" ? "secondary" :
                                  "outline"
                                }
                              >
                                {item.confidence}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeRepairItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Total Repairs:</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          ${Math.round(baseRepairs).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scenarios Tab */}
              <TabsContent value="scenarios" className="mt-0">
                <div className="grid grid-cols-3 gap-6">
                  {/* Wholesale Scenario */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Wholesale
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Purchase Price</span>
                          <span className="font-medium">${Math.round(suggestedOffer).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Assignment Fee</span>
                          <span className="font-medium">$10,000</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-semibold">Net Profit</span>
                          <span className="font-bold text-green-600">$10,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ROI</span>
                          <span className="font-medium">6.1%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fix & Flip Scenario */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Fix & Flip
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Purchase Price</span>
                          <span className="font-medium">${Math.round(suggestedOffer).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Repair Costs</span>
                          <span className="font-medium">${Math.round(adjustedRepairs).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Holding Costs</span>
                          <span className="font-medium">$4,500</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Selling Costs</span>
                          <span className="font-medium">${Math.round(adjustedARV * 0.08).toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-semibold">Net Profit</span>
                          <span className="font-bold text-green-600">
                            ${Math.round(adjustedARV - suggestedOffer - adjustedRepairs - 4500 - (adjustedARV * 0.08)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ROI</span>
                          <span className="font-medium">16.5%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rental Scenario */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Buy & Hold (Rental)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">All-in Cost</span>
                          <span className="font-medium">
                            ${Math.round(suggestedOffer + adjustedRepairs).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monthly Rent</span>
                          <span className="font-medium">$2,100</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monthly Cash Flow</span>
                          <span className="font-medium">$450</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-semibold">Cap Rate</span>
                          <span className="font-bold text-blue-600">8.2%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">DSCR</span>
                          <span className="font-medium">1.35</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cash-on-Cash</span>
                          <span className="font-medium">12.1%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Risks Tab */}
              <TabsContent value="risks" className="mt-0">
                <div className="space-y-4">
                  {underwritingSeedData.risks.map((risk, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className={cn(
                            "h-5 w-5 mt-0.5",
                            risk.severity === "high" ? "text-red-500" :
                            risk.severity === "medium" ? "text-yellow-500" :
                            "text-gray-500"
                          )} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={
                                risk.severity === "high" ? "destructive" :
                                risk.severity === "medium" ? "secondary" :
                                "outline"
                              }>
                                {risk.type}
                              </Badge>
                              <Badge variant="outline">{risk.severity} risk</Badge>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{risk.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Source: {risk.source} • Found: {risk.dateFound}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-0">
                <div className="space-y-4">
                  {currentHistory.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-medium text-sm">{entry.user}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{entry.action}</p>
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs space-y-1">
                              {Object.entries(entry.changes).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-600">{key}:</span>
                                  <span className="font-medium">${value.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Right Rail - Property Context */}
      <div className={cn(
        "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg transition-all duration-300 flex flex-col h-full",
        rightPanelCollapsed ? "w-16" : "w-80"
      )}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!rightPanelCollapsed && (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-white">Context</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightPanelCollapsed(true)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            {rightPanelCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightPanelCollapsed(false)}
                className="mx-auto"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {!rightPanelCollapsed && currentDeal && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-3">
              {/* Lead Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{currentDeal.owner.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{currentDeal.owner}</p>
                      <p className="text-xs text-gray-500">Property Owner</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>(555) 123-4567</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>owner@email.com</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signals */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Property Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentDeal.signals.map((signal, idx) => (
                      <Badge key={idx} variant="outline">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => toast.success("Packet generated!")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Packet
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => toast.success("LOI generated!")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate LOI
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => toast.success("Sent to buyers!")}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to Buyers
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => toast.success("Analysis duplicated!")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Analysis
                  </Button>
                </CardContent>
              </Card>

              {/* Tasks */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tasks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Checkbox className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">Verify comps accuracy</p>
                      <p className="text-xs text-gray-500">Due today</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">Get contractor quotes</p>
                      <p className="text-xs text-gray-500">Due tomorrow</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">Schedule property visit</p>
                      <p className="text-xs text-gray-500">Due in 3 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}