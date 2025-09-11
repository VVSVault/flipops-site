"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Filter,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  ChevronRight,
  Home,
  Building,
  MapPin,
  TrendingUp,
  User,
  Zap,
  TestTube,
  Shield,
  AlertTriangle,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CampaignWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (campaign: any) => void;
}

// REI-specific filter options
const filterOptions = {
  distress: [
    { value: "probate", label: "Probate", icon: FileText },
    { value: "tax-delinquent", label: "Tax Delinquent", icon: AlertTriangle },
    { value: "code-violations", label: "Code Violations", icon: AlertCircle },
    { value: "preforeclosure", label: "Pre-foreclosure", icon: Clock },
    { value: "eviction", label: "Eviction Filed", icon: Building },
    { value: "vacant", label: "Vacant (USPS)", icon: Home },
    { value: "hoa-lien", label: "HOA Lien", icon: FileText },
    { value: "judgment-lien", label: "Judgment Lien", icon: FileText },
    { value: "utility-shutoff", label: "Utility Shutoff", icon: AlertCircle }
  ],
  property: [
    { value: "sfr", label: "Single Family", icon: Home },
    { value: "multi-family", label: "Multi-Family", icon: Building },
    { value: "condo", label: "Condo", icon: Building },
    { value: "townhouse", label: "Townhouse", icon: Home },
    { value: "land", label: "Vacant Land", icon: MapPin },
    { value: "mobile", label: "Mobile Home", icon: Home }
  ],
  owner: [
    { value: "absentee", label: "Absentee Owner", icon: User },
    { value: "out-of-state", label: "Out of State", icon: MapPin },
    { value: "corporate", label: "Corporate Owned", icon: Building },
    { value: "elderly", label: "65+ Years Old", icon: User },
    { value: "high-equity", label: "High Equity (60%+)", icon: TrendingUp },
    { value: "free-clear", label: "Free & Clear", icon: CheckCircle }
  ],
  market: [
    { value: "high-dom", label: "High DOM (90+ days)", icon: Clock },
    { value: "price-reduced", label: "Price Reduced", icon: TrendingUp },
    { value: "expired-listing", label: "Expired Listing", icon: X },
    { value: "fsbo", label: "For Sale By Owner", icon: User },
    { value: "rental", label: "Rental Property", icon: Building }
  ]
};

// Message templates by scenario
const messageTemplates = {
  probate: {
    sms: "Hi {{firstName}}, I'm {{agentName}} with {{company}}. I can help with any property tasks related to the estate at {{address}}. No pressure—just resources if useful. Reply STOP to opt out.",
    email: {
      subject: "Support for Estate Property at {{address}}",
      body: "Dear {{firstName}},\n\nI understand this can be a difficult time. If you need assistance with the property at {{address}}, I can provide:\n\n• Quick cash offer with flexible closing\n• Help with cleanouts and repairs\n• Guidance through the process\n\nNo obligation—just here to help if needed.\n\nBest regards,\n{{agentName}}"
    }
  },
  taxDelinquent: {
    sms: "Hi {{firstName}}, regarding {{address}} - I can help resolve the tax situation with a quick cash sale. We handle all details. Interested in options? Reply STOP to opt out.",
    email: {
      subject: "Property Tax Relief Options for {{address}}",
      body: "Dear {{firstName}},\n\nI noticed the property at {{address}} has delinquent taxes. I can offer:\n\n• Cash purchase to clear all liens\n• Close in 7-14 days\n• No fees or commissions\n\nWould you like to discuss your options?\n\nBest,\n{{agentName}}"
    }
  },
  codeViolations: {
    sms: "Saw {{address}} on the city violations list. We buy as-is and handle all repairs/permits. Want a hassle-free cash offer? Reply STOP to opt out.",
    email: {
      subject: "We Buy As-Is: {{address}}",
      body: "Hi {{firstName}},\n\nDealing with code violations can be stressful. We specialize in:\n\n• Buying properties as-is\n• Handling all repairs and permits\n• Quick cash closings\n\nNo need to fix anything. Interested in an offer?\n\n{{agentName}}"
    }
  }
};

export function CampaignWizard({ open, onOpenChange, onComplete }: CampaignWizardProps) {
  const [currentTab, setCurrentTab] = useState("basics");
  const [campaignData, setCampaignData] = useState({
    // Basics
    name: "",
    objective: "inbound",
    description: "",
    
    // Audience
    filters: {
      distress: [] as string[],
      property: [] as string[],
      owner: [] as string[],
      market: [] as string[],
      geographic: {
        states: [] as string[],
        counties: [] as string[],
        cities: [] as string[],
        zips: [] as string[]
      },
      financial: {
        minEquity: 0,
        maxLTV: 100,
        minValue: 0,
        maxValue: 1000000,
        minTaxOwed: 0
      },
      engagement: {
        lastContactDays: 0,
        minScore: 0,
        stage: [] as string[],
        excludeOptOut: true
      }
    },
    suppressionLists: [] as string[],
    audienceSize: 0,
    
    // Cadence
    steps: [] as any[],
    
    // Settings
    schedule: {
      startDate: new Date(),
      endDate: null as Date | null,
      timezone: "America/New_York",
      quietHours: { start: 8, end: 20 },
      daysOfWeek: ["mon", "tue", "wed", "thu", "fri"]
    },
    throttle: {
      maxPerDay: 500,
      maxPerHour: 100
    },
    compliance: {
      checkDNC: true,
      requireConsent: true,
      honorOptOut: true,
      includeUnsubscribe: true
    },
    simulation: {
      enabled: false,
      replyRate: 8,
      positiveRate: 4,
      speed: 1
    }
  });

  const [estimatedCost, setEstimatedCost] = useState(0);
  const [complianceIssues, setComplianceIssues] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Calculate audience size based on filters
  const calculateAudienceSize = () => {
    // Simulated calculation
    let size = 5000;
    
    // Reduce by filters
    if (campaignData.filters.distress.length > 0) {
      size = Math.floor(size * 0.3);
    }
    if (campaignData.filters.property.length > 0) {
      size = Math.floor(size * 0.8);
    }
    if (campaignData.filters.owner.length > 0) {
      size = Math.floor(size * 0.6);
    }
    if (campaignData.filters.market.length > 0) {
      size = Math.floor(size * 0.5);
    }
    
    return Math.max(10, size);
  };

  // Calculate estimated cost
  const calculateEstimatedCost = () => {
    const audienceSize = calculateAudienceSize();
    const steps = campaignData.steps.length || 1;
    
    let costPerMessage = 0;
    campaignData.steps.forEach(step => {
      if (step.channel === "sms") costPerMessage += 0.015;
      if (step.channel === "email") costPerMessage += 0.001;
      if (step.channel === "voicemail") costPerMessage += 0.10;
      if (step.channel === "letter") costPerMessage += 1.50;
    });
    
    return audienceSize * steps * costPerMessage;
  };

  // Add a campaign step
  const addStep = () => {
    const newStep = {
      id: Date.now().toString(),
      index: campaignData.steps.length,
      channel: "sms",
      delayDays: campaignData.steps.length * 2,
      template: "",
      subject: "",
      abTest: false,
      variants: [],
      conditions: {
        stopOnReply: true,
        stopOnPositive: false,
        branchOnSentiment: false
      }
    };
    
    setCampaignData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  // Remove a campaign step
  const removeStep = (stepId: string) => {
    setCampaignData(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s.id !== stepId)
    }));
  };

  // Validate campaign before starting
  const validateCampaign = () => {
    const issues = [];
    
    if (!campaignData.name) {
      issues.push("Campaign name is required");
    }
    
    if (calculateAudienceSize() === 0) {
      issues.push("No leads match your audience criteria");
    }
    
    if (campaignData.steps.length === 0) {
      issues.push("At least one campaign step is required");
    }
    
    campaignData.steps.forEach((step, idx) => {
      if (!step.template) {
        issues.push(`Step ${idx + 1} is missing a message template`);
      }
    });
    
    if (campaignData.compliance.checkDNC && !campaignData.compliance.requireConsent) {
      issues.push("Warning: Sending without consent verification");
    }
    
    setComplianceIssues(issues);
    return issues.length === 0;
  };

  // Handle campaign creation
  const handleCreate = () => {
    if (!validateCampaign()) {
      toast.error("Please fix validation issues before creating the campaign");
      return;
    }
    
    const campaign = {
      id: `CMP-${Date.now()}`,
      ...campaignData,
      status: "draft",
      audience: {
        size: calculateAudienceSize(),
        filters: Object.entries(campaignData.filters)
          .filter(([_, value]) => Array.isArray(value) ? value.length > 0 : true)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      },
      channels: [...new Set(campaignData.steps.map(s => s.channel))],
      abTest: campaignData.steps.some(s => s.abTest),
      metrics: {
        sends: 0,
        delivered: 0,
        replies: 0,
        positive: 0,
        appointments: 0,
        contracts: 0,
        cost: 0
      },
      progress: 0,
      lastRun: null,
      createdAt: new Date()
    };
    
    onComplete(campaign);
    toast.success("Campaign created successfully!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>
            Set up a multi-channel outreach campaign with audience targeting and automated cadences
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="cadence">Cadence</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="basics" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name *</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., Probate Leads - Q1 2025"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <Select 
                  value={campaignData.objective}
                  onValueChange={(value) => setCampaignData(prev => ({ ...prev, objective: value }))}
                >
                  <SelectTrigger id="objective">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Lead Generation</SelectItem>
                    <SelectItem value="reengage">Re-engagement</SelectItem>
                    <SelectItem value="disposition">Buyer Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the campaign goals and strategy..."
                  value={campaignData.description}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Campaign Preview</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Est. Audience</p>
                    <p className="text-lg font-bold">{calculateAudienceSize().toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Steps</p>
                    <p className="text-lg font-bold">{campaignData.steps.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Est. Cost</p>
                    <p className="text-lg font-bold">${calculateEstimatedCost().toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audience" className="space-y-4">
              {/* Distress Signals */}
              <div className="space-y-2">
                <Label>Distress Signals</Label>
                <div className="grid grid-cols-3 gap-2">
                  {filterOptions.distress.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={campaignData.filters.distress.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCampaignData(prev => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                distress: [...prev.filters.distress, option.value]
                              }
                            }));
                          } else {
                            setCampaignData(prev => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                distress: prev.filters.distress.filter(v => v !== option.value)
                              }
                            }));
                          }
                        }}
                      />
                      <Label 
                        htmlFor={option.value} 
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Property Types */}
              <div className="space-y-2">
                <Label>Property Types</Label>
                <div className="grid grid-cols-3 gap-2">
                  {filterOptions.property.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={campaignData.filters.property.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCampaignData(prev => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                property: [...prev.filters.property, option.value]
                              }
                            }));
                          } else {
                            setCampaignData(prev => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                property: prev.filters.property.filter(v => v !== option.value)
                              }
                            }));
                          }
                        }}
                      />
                      <Label 
                        htmlFor={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Owner Characteristics */}
              <div className="space-y-2">
                <Label>Owner Characteristics</Label>
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.owner.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={campaignData.filters.owner.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCampaignData(prev => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                owner: [...prev.filters.owner, option.value]
                              }
                            }));
                          } else {
                            setCampaignData(prev => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                owner: prev.filters.owner.filter(v => v !== option.value)
                              }
                            }));
                          }
                        }}
                      />
                      <Label 
                        htmlFor={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Financial Filters */}
              <div className="space-y-2">
                <Label>Financial Criteria</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Min Equity %</Label>
                    <Slider
                      value={[campaignData.filters.financial.minEquity]}
                      onValueChange={([value]) => setCampaignData(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          financial: { ...prev.filters.financial, minEquity: value }
                        }
                      }))}
                      max={100}
                      step={5}
                    />
                    <span className="text-xs text-gray-500">{campaignData.filters.financial.minEquity}%</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max LTV %</Label>
                    <Slider
                      value={[campaignData.filters.financial.maxLTV]}
                      onValueChange={([value]) => setCampaignData(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          financial: { ...prev.filters.financial, maxLTV: value }
                        }
                      }))}
                      max={120}
                      step={5}
                    />
                    <span className="text-xs text-gray-500">{campaignData.filters.financial.maxLTV}%</span>
                  </div>
                </div>
              </div>

              {/* Audience Preview */}
              <Card className="bg-blue-50 dark:bg-blue-900/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Estimated Audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{calculateAudienceSize().toLocaleString()} leads</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Based on current filter criteria
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cadence" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Campaign Steps</Label>
                <Button onClick={addStep} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {campaignData.steps.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No steps added yet. Add your first message step to get started.
                    </p>
                    <Button onClick={addStep} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Step
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {campaignData.steps.map((step, index) => (
                    <Card key={step.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            Step {index + 1}
                            {index > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Day {step.delayDays}
                              </Badge>
                            )}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStep(step.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Channel</Label>
                            <Select
                              value={step.channel}
                              onValueChange={(value) => {
                                setCampaignData(prev => ({
                                  ...prev,
                                  steps: prev.steps.map(s => 
                                    s.id === step.id ? { ...s, channel: value } : s
                                  )
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="voicemail">Voicemail</SelectItem>
                                <SelectItem value="letter">Letter</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {index > 0 && (
                            <div className="space-y-2">
                              <Label className="text-xs">Delay (days)</Label>
                              <Input
                                type="number"
                                value={step.delayDays}
                                onChange={(e) => {
                                  setCampaignData(prev => ({
                                    ...prev,
                                    steps: prev.steps.map(s => 
                                      s.id === step.id ? { ...s, delayDays: parseInt(e.target.value) } : s
                                    )
                                  }));
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {step.channel === "email" && (
                          <div className="space-y-2">
                            <Label className="text-xs">Subject Line</Label>
                            <Input
                              placeholder="Enter email subject..."
                              value={step.subject}
                              onChange={(e) => {
                                setCampaignData(prev => ({
                                  ...prev,
                                  steps: prev.steps.map(s => 
                                    s.id === step.id ? { ...s, subject: e.target.value } : s
                                  )
                                }));
                              }}
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs">Message Template</Label>
                          <Textarea
                            placeholder="Enter your message template. Use {{firstName}}, {{address}}, etc. for variables..."
                            value={step.template}
                            onChange={(e) => {
                              setCampaignData(prev => ({
                                ...prev,
                                steps: prev.steps.map(s => 
                                  s.id === step.id ? { ...s, template: e.target.value } : s
                                )
                              }));
                            }}
                            rows={4}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`ab-test-${step.id}`}
                            checked={step.abTest}
                            onCheckedChange={(checked) => {
                              setCampaignData(prev => ({
                                ...prev,
                                steps: prev.steps.map(s => 
                                  s.id === step.id ? { ...s, abTest: checked } : s
                                )
                              }));
                            }}
                          />
                          <Label htmlFor={`ab-test-${step.id}`} className="text-sm">
                            Enable A/B Testing
                          </Label>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Stop Conditions</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`stop-reply-${step.id}`}
                                checked={step.conditions.stopOnReply}
                                onCheckedChange={(checked) => {
                                  setCampaignData(prev => ({
                                    ...prev,
                                    steps: prev.steps.map(s => 
                                      s.id === step.id 
                                        ? { ...s, conditions: { ...s.conditions, stopOnReply: checked } } 
                                        : s
                                    )
                                  }));
                                }}
                              />
                              <Label htmlFor={`stop-reply-${step.id}`} className="text-sm">
                                Stop on reply
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`stop-positive-${step.id}`}
                                checked={step.conditions.stopOnPositive}
                                onCheckedChange={(checked) => {
                                  setCampaignData(prev => ({
                                    ...prev,
                                    steps: prev.steps.map(s => 
                                      s.id === step.id 
                                        ? { ...s, conditions: { ...s.conditions, stopOnPositive: checked } } 
                                        : s
                                    )
                                  }));
                                }}
                              />
                              <Label htmlFor={`stop-positive-${step.id}`} className="text-sm">
                                Stop on positive sentiment
                              </Label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              {/* Schedule Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={campaignData.schedule.startDate.toISOString().split('T')[0]}
                        onChange={(e) => setCampaignData(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, startDate: new Date(e.target.value) }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Timezone</Label>
                      <Select
                        value={campaignData.schedule.timezone}
                        onValueChange={(value) => setCampaignData(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, timezone: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern</SelectItem>
                          <SelectItem value="America/Chicago">Central</SelectItem>
                          <SelectItem value="America/Denver">Mountain</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Quiet Hours (Local Time)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={campaignData.schedule.quietHours.start}
                        onChange={(e) => setCampaignData(prev => ({
                          ...prev,
                          schedule: { 
                            ...prev.schedule, 
                            quietHours: { ...prev.schedule.quietHours, start: parseInt(e.target.value) }
                          }
                        }))}
                        className="w-20"
                      />
                      <span>to</span>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={campaignData.schedule.quietHours.end}
                        onChange={(e) => setCampaignData(prev => ({
                          ...prev,
                          schedule: { 
                            ...prev.schedule, 
                            quietHours: { ...prev.schedule.quietHours, end: parseInt(e.target.value) }
                          }
                        }))}
                        className="w-20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Throttle Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Throttle & Pacing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Max per Day</Label>
                      <Input
                        type="number"
                        value={campaignData.throttle.maxPerDay}
                        onChange={(e) => setCampaignData(prev => ({
                          ...prev,
                          throttle: { ...prev.throttle, maxPerDay: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Max per Hour</Label>
                      <Input
                        type="number"
                        value={campaignData.throttle.maxPerHour}
                        onChange={(e) => setCampaignData(prev => ({
                          ...prev,
                          throttle: { ...prev.throttle, maxPerHour: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Compliance & Safety
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="check-dnc"
                      checked={campaignData.compliance.checkDNC}
                      onCheckedChange={(checked) => setCampaignData(prev => ({
                        ...prev,
                        compliance: { ...prev.compliance, checkDNC: checked }
                      }))}
                    />
                    <Label htmlFor="check-dnc">Check Do Not Call list</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require-consent"
                      checked={campaignData.compliance.requireConsent}
                      onCheckedChange={(checked) => setCampaignData(prev => ({
                        ...prev,
                        compliance: { ...prev.compliance, requireConsent: checked }
                      }))}
                    />
                    <Label htmlFor="require-consent">Require explicit consent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="honor-optout"
                      checked={campaignData.compliance.honorOptOut}
                      onCheckedChange={(checked) => setCampaignData(prev => ({
                        ...prev,
                        compliance: { ...prev.compliance, honorOptOut: checked }
                      }))}
                    />
                    <Label htmlFor="honor-optout">Honor opt-out requests</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Demo Mode */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    Demo / Simulation Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="simulation-enabled"
                      checked={campaignData.simulation.enabled}
                      onCheckedChange={(checked) => setCampaignData(prev => ({
                        ...prev,
                        simulation: { ...prev.simulation, enabled: checked }
                      }))}
                    />
                    <Label htmlFor="simulation-enabled">Enable simulation mode</Label>
                  </div>
                  
                  {campaignData.simulation.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Reply Rate (%)</Label>
                        <Slider
                          value={[campaignData.simulation.replyRate]}
                          onValueChange={([value]) => setCampaignData(prev => ({
                            ...prev,
                            simulation: { ...prev.simulation, replyRate: value }
                          }))}
                          max={20}
                          step={1}
                        />
                        <span className="text-xs text-gray-500">{campaignData.simulation.replyRate}%</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Positive Rate (%)</Label>
                        <Slider
                          value={[campaignData.simulation.positiveRate]}
                          onValueChange={([value]) => setCampaignData(prev => ({
                            ...prev,
                            simulation: { ...prev.simulation, positiveRate: value }
                          }))}
                          max={10}
                          step={1}
                        />
                        <span className="text-xs text-gray-500">{campaignData.simulation.positiveRate}%</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Validation Errors */}
        {complianceIssues.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Validation Issues
                </p>
                <ul className="text-xs text-red-800 dark:text-red-200 mt-1 list-disc list-inside">
                  {complianceIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Est. Cost: <span className="font-bold">${calculateEstimatedCost().toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create Campaign
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}