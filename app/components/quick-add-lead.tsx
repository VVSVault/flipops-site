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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  User, 
  Home, 
  Phone, 
  Mail, 
  DollarSign, 
  FileText, 
  AlertCircle,
  Calendar,
  MapPin,
  Tag,
  TrendingUp,
  Info
} from "lucide-react";

interface QuickAddLeadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddLead({ open, onOpenChange }: QuickAddLeadProps) {
  // Form state
  const [formData, setFormData] = useState({
    // Basic Info (Required)
    ownerName: "",
    propertyAddress: "",
    city: "",
    state: "FL",
    zipCode: "",
    phone: "",
    email: "",
    leadSource: "",
    
    // Property Details
    propertyType: "Single Family",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    yearBuilt: "",
    lotSize: "",
    condition: "",
    occupancy: "Owner Occupied",
    
    // Financial Info
    askingPrice: "",
    estimatedValue: "",
    mortgageBalance: "",
    monthlyPayment: "",
    taxesOwed: "",
    
    // Motivation & Timeline
    motivation: "",
    timeline: "",
    notes: "",
    
    // Signals & Tags
    signals: [] as string[],
    tags: [] as string[],
    
    // Preferences
    preferredContact: "phone",
    bestTimeToCall: "",
    optInSMS: true,
    optInEmail: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const leadSources = [
    "PPC",
    "Direct Mail",
    "Cold Call",
    "Referral",
    "Website",
    "Social Media",
    "Driving for Dollars",
    "Wholesaler",
    "MLS",
    "Other"
  ];

  const motivationReasons = [
    "Downsizing",
    "Upgrading",
    "Job Relocation",
    "Financial Distress",
    "Divorce",
    "Inherited Property",
    "Tired Landlord",
    "Health Issues",
    "Retirement",
    "Other"
  ];

  const propertyConditions = [
    "Excellent",
    "Good",
    "Fair",
    "Poor",
    "Needs Major Repairs",
    "Tear Down"
  ];

  const availableSignals = [
    "Distressed",
    "High Equity",
    "Pre-foreclosure",
    "Vacant",
    "Tax Delinquent",
    "Absentee Owner",
    "Expired Listing",
    "Code Violations",
    "Inherited",
    "Divorce"
  ];

  const availableTags = [
    "Hot Lead",
    "Warm Lead",
    "Cold Lead",
    "Cash Buyer",
    "Motivated Seller",
    "Investor Owned",
    "First Time Seller",
    "Multiple Properties",
    "Quick Close Needed",
    "Flexible Timeline"
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required";
    if (!formData.propertyAddress.trim()) newErrors.propertyAddress = "Property address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP code is required";
    if (!formData.phone.trim() && !formData.email.trim()) {
      newErrors.contact = "At least one contact method is required (phone or email)";
    }
    if (!formData.leadSource) newErrors.leadSource = "Lead source is required";
    
    // Phone validation
    if (formData.phone && !/^\(\d{3}\)\s?\d{3}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone format. Use (XXX) XXX-XXXX";
    }
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Add selected signals and tags to form data
    const finalData = {
      ...formData,
      signals: selectedSignals,
      tags: selectedTags,
      createdAt: new Date().toISOString(),
      leadId: `L-${Date.now()}`,
      status: "New",
      score: calculateLeadScore()
    };
    
    console.log("Submitting lead:", finalData);
    toast.success("Lead added successfully!");
    
    // Reset form
    setFormData({
      ownerName: "",
      propertyAddress: "",
      city: "",
      state: "FL",
      zipCode: "",
      phone: "",
      email: "",
      leadSource: "",
      propertyType: "Single Family",
      bedrooms: "",
      bathrooms: "",
      squareFeet: "",
      yearBuilt: "",
      lotSize: "",
      condition: "",
      occupancy: "Owner Occupied",
      askingPrice: "",
      estimatedValue: "",
      mortgageBalance: "",
      monthlyPayment: "",
      taxesOwed: "",
      motivation: "",
      timeline: "",
      notes: "",
      signals: [],
      tags: [],
      preferredContact: "phone",
      bestTimeToCall: "",
      optInSMS: true,
      optInEmail: true,
    });
    setSelectedSignals([]);
    setSelectedTags([]);
    setErrors({});
    onOpenChange(false);
  };

  const calculateLeadScore = () => {
    let score = 50; // Base score
    
    // Add points for motivation signals
    if (selectedSignals.includes("Distressed")) score += 15;
    if (selectedSignals.includes("Pre-foreclosure")) score += 20;
    if (selectedSignals.includes("Vacant")) score += 10;
    if (selectedSignals.includes("Tax Delinquent")) score += 15;
    
    // Add points for timeline
    if (formData.timeline === "Immediate") score += 20;
    if (formData.timeline === "1-3 months") score += 10;
    
    // Add points for tags
    if (selectedTags.includes("Hot Lead")) score += 15;
    if (selectedTags.includes("Motivated Seller")) score += 10;
    
    return Math.min(100, score);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Lead</DialogTitle>
          <DialogDescription>
            Add a new lead to your pipeline. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info*</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="motivation">Motivation</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Owner Information */}
              <div className="space-y-2">
                <Label htmlFor="ownerName">
                  <User className="inline h-4 w-4 mr-1" />
                  Owner Name *
                </Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="John Smith"
                  className={errors.ownerName ? "border-red-500" : ""}
                />
                {errors.ownerName && (
                  <p className="text-xs text-red-500">{errors.ownerName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadSource">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Lead Source *
                </Label>
                <Select
                  value={formData.leadSource}
                  onValueChange={(value) => setFormData({ ...formData, leadSource: value })}
                >
                  <SelectTrigger className={errors.leadSource ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.leadSource && (
                  <p className="text-xs text-red-500">{errors.leadSource}</p>
                )}
              </div>
            </div>

            {/* Property Address */}
            <div className="space-y-2">
              <Label htmlFor="propertyAddress">
                <Home className="inline h-4 w-4 mr-1" />
                Property Address *
              </Label>
              <Input
                id="propertyAddress"
                value={formData.propertyAddress}
                onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                placeholder="123 Main Street"
                className={errors.propertyAddress ? "border-red-500" : ""}
              />
              {errors.propertyAddress && (
                <p className="text-xs text-red-500">{errors.propertyAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  City *
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Jacksonville"
                  className={errors.city ? "border-red-500" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="SC">South Carolina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="32256"
                  maxLength={5}
                  className={errors.zipCode ? "border-red-500" : ""}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number {!formData.email && "*"}
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="(904) 555-1234"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address {!formData.phone && "*"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>
            </div>

            {errors.contact && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-500">{errors.contact}</p>
              </div>
            )}

            {/* Contact Preferences */}
            <div className="space-y-3">
              <Label>Contact Preferences</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                  <Select
                    value={formData.preferredContact}
                    onValueChange={(value) => setFormData({ ...formData, preferredContact: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bestTimeToCall">Best Time to Call</Label>
                  <Input
                    id="bestTimeToCall"
                    value={formData.bestTimeToCall}
                    onChange={(e) => setFormData({ ...formData, bestTimeToCall: e.target.value })}
                    placeholder="Morning, Evening, Weekends"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="optInSMS"
                    checked={formData.optInSMS}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, optInSMS: checked as boolean })
                    }
                  />
                  <Label htmlFor="optInSMS" className="text-sm font-normal">
                    Opted in for SMS
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="optInEmail"
                    checked={formData.optInEmail}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, optInEmail: checked as boolean })
                    }
                  />
                  <Label htmlFor="optInEmail" className="text-sm font-normal">
                    Opted in for Email
                  </Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="property" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Family">Single Family</SelectItem>
                    <SelectItem value="Multi Family">Multi Family</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Mobile Home">Mobile Home</SelectItem>
                    <SelectItem value="Land">Land</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupancy">Occupancy Status</Label>
                <Select
                  value={formData.occupancy}
                  onValueChange={(value) => setFormData({ ...formData, occupancy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner Occupied">Owner Occupied</SelectItem>
                    <SelectItem value="Tenant Occupied">Tenant Occupied</SelectItem>
                    <SelectItem value="Vacant">Vacant</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  placeholder="3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="squareFeet">Sq Ft</Label>
                <Input
                  id="squareFeet"
                  type="number"
                  value={formData.squareFeet}
                  onChange={(e) => setFormData({ ...formData, squareFeet: e.target.value })}
                  placeholder="1,500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  placeholder="1995"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lotSize">Lot Size (acres)</Label>
                <Input
                  id="lotSize"
                  value={formData.lotSize}
                  onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                  placeholder="0.25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Property Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyConditions.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property Signals */}
            <div className="space-y-2">
              <Label>Property Signals</Label>
              <div className="flex flex-wrap gap-2">
                {availableSignals.map((signal) => (
                  <Badge
                    key={signal}
                    variant={selectedSignals.includes(signal) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedSignals.includes(signal)) {
                        setSelectedSignals(selectedSignals.filter(s => s !== signal));
                      } else {
                        setSelectedSignals([...selectedSignals, signal]);
                      }
                    }}
                  >
                    {signal}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="askingPrice">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Asking Price
                </Label>
                <Input
                  id="askingPrice"
                  value={formData.askingPrice}
                  onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                  placeholder="$250,000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedValue">
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  Estimated ARV
                </Label>
                <Input
                  id="estimatedValue"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  placeholder="$300,000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mortgageBalance">Mortgage Balance</Label>
                <Input
                  id="mortgageBalance"
                  value={formData.mortgageBalance}
                  onChange={(e) => setFormData({ ...formData, mortgageBalance: e.target.value })}
                  placeholder="$180,000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyPayment">Monthly Payment</Label>
                <Input
                  id="monthlyPayment"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                  placeholder="$1,500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxesOwed">Back Taxes / Liens</Label>
              <Input
                id="taxesOwed"
                value={formData.taxesOwed}
                onChange={(e) => setFormData({ ...formData, taxesOwed: e.target.value })}
                placeholder="$0"
              />
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Financial Information Tips
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    • ARV (After Repair Value) helps determine profit potential
                    • Mortgage balance shows equity position
                    • Back taxes indicate motivation level
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="motivation" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="motivation">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Seller Motivation
              </Label>
              <Select
                value={formData.motivation}
                onValueChange={(value) => setFormData({ ...formData, motivation: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select motivation reason" />
                </SelectTrigger>
                <SelectContent>
                  {motivationReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">
                <Calendar className="inline h-4 w-4 mr-1" />
                Selling Timeline
              </Label>
              <Select
                value={formData.timeline}
                onValueChange={(value) => setFormData({ ...formData, timeline: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Immediate">Immediate (ASAP)</SelectItem>
                  <SelectItem value="1-3 months">1-3 months</SelectItem>
                  <SelectItem value="3-6 months">3-6 months</SelectItem>
                  <SelectItem value="6+ months">6+ months</SelectItem>
                  <SelectItem value="Just exploring">Just exploring options</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lead Tags */}
            <div className="space-y-2">
              <Label>Lead Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                <FileText className="inline h-4 w-4 mr-1" />
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information about the lead, property condition details, seller situation, etc."
                rows={4}
              />
            </div>

            {/* Lead Score Preview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Estimated Lead Score
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Based on provided information
                  </p>
                </div>
                <div className="text-3xl font-bold">
                  <span className={
                    calculateLeadScore() >= 80 ? "text-green-500" :
                    calculateLeadScore() >= 60 ? "text-yellow-500" : "text-red-500"
                  }>
                    {calculateLeadScore()}
                  </span>
                  <span className="text-sm font-normal text-gray-500">/100</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            * Required fields must be completed before submitting
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Add Lead
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}