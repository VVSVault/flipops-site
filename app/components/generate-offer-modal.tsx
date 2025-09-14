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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  DollarSign, 
  Home, 
  Calendar,
  FileText,
  Calculator,
  AlertCircle,
  TrendingUp,
  Percent,
  Clock,
  Building,
  CreditCard,
  Info,
  CheckCircle
} from "lucide-react";

export interface OfferData {
  id: string;
  createdAt: Date;
  // Property Info
  propertyAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Offer Details
  offerPrice: number;
  earnestMoney: number;
  earnestMoneyDays: number;
  closingDate: Date;
  expirationDate: Date;
  
  // Purchase Terms
  purchaseType: "cash" | "financing" | "subject-to" | "seller-financing";
  contingencies: string[];
  
  // Costs & Credits
  closingCostsPaidBy: "buyer" | "seller" | "split";
  sellerCredits: number;
  repairCredits: number;
  
  // Additional Terms
  inspectionPeriod: number;
  dueDiligencePeriod: number;
  occupancy: "at-closing" | "post-closing" | "vacant";
  rentBackDays: number;
  rentBackAmount: number;
  
  // Special Provisions
  specialProvisions: string;
  inclusions: string[];
  exclusions: string[];
  
  // Calculated Values
  estimatedARV: number;
  estimatedRepairs: number;
  estimatedProfit: number;
  cashToClose: number;
  
  // Status
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired" | "countered";
}

interface GenerateOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadInfo: {
    name: string;
    address: string;
    leadId: string;
  } | null;
  onOfferGenerated: (offer: OfferData) => void;
}

export function GenerateOfferModal({ 
  open, 
  onOpenChange, 
  leadInfo,
  onOfferGenerated 
}: GenerateOfferModalProps) {
  const [formData, setFormData] = useState({
    // Offer Details
    offerPrice: "",
    earnestMoney: "1000",
    earnestMoneyDays: "3",
    closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    
    // Purchase Terms
    purchaseType: "cash" as const,
    contingencies: [] as string[],
    
    // Costs & Credits
    closingCostsPaidBy: "buyer" as const,
    sellerCredits: "0",
    repairCredits: "0",
    
    // Additional Terms
    inspectionPeriod: "10",
    dueDiligencePeriod: "7",
    occupancy: "at-closing" as const,
    rentBackDays: "0",
    rentBackAmount: "0",
    
    // Special Provisions
    specialProvisions: "",
    inclusions: ["appliances", "fixtures"] as string[],
    exclusions: [] as string[],
    
    // Analysis
    estimatedARV: "",
    estimatedRepairs: "",
    maxAllowableOffer: "",
    targetProfit: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAnalysis, setShowAnalysis] = useState(false);

  const availableContingencies = [
    "Financing",
    "Inspection",
    "Appraisal",
    "Sale of Buyer's Property",
    "Title Review",
    "Survey",
    "Insurance",
    "HOA Documents Review"
  ];

  const commonInclusions = [
    "All Appliances",
    "Window Treatments",
    "Light Fixtures",
    "Ceiling Fans",
    "Built-in Shelving",
    "Storage Sheds",
    "Playground Equipment",
    "Pool Equipment",
    "Security System",
    "Smart Home Devices"
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.offerPrice || parseFloat(formData.offerPrice) <= 0) {
      newErrors.offerPrice = "Offer price is required";
    }
    
    if (!formData.earnestMoney || parseFloat(formData.earnestMoney) < 0) {
      newErrors.earnestMoney = "Earnest money amount is required";
    }
    
    if (!formData.closingDate) {
      newErrors.closingDate = "Closing date is required";
    }
    
    if (!formData.expirationDate) {
      newErrors.expirationDate = "Expiration date is required";
    }
    
    if (new Date(formData.expirationDate) < new Date()) {
      newErrors.expirationDate = "Expiration date must be in the future";
    }
    
    if (new Date(formData.closingDate) < new Date()) {
      newErrors.closingDate = "Closing date must be in the future";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateAnalysis = () => {
    const offerPrice = parseFloat(formData.offerPrice) || 0;
    const arv = parseFloat(formData.estimatedARV) || 0;
    const repairs = parseFloat(formData.estimatedRepairs) || 0;
    const sellerCredits = parseFloat(formData.sellerCredits) || 0;
    const repairCredits = parseFloat(formData.repairCredits) || 0;
    
    const totalInvestment = offerPrice + repairs - sellerCredits - repairCredits;
    const estimatedProfit = arv - totalInvestment;
    const roi = totalInvestment > 0 ? (estimatedProfit / totalInvestment * 100).toFixed(1) : "0";
    const maxOffer = arv * 0.7 - repairs; // 70% rule
    
    return {
      totalInvestment,
      estimatedProfit,
      roi,
      maxOffer,
      cashToClose: offerPrice - sellerCredits + parseFloat(formData.earnestMoney)
    };
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!leadInfo) {
      toast.error("Lead information is missing");
      return;
    }
    
    const analysis = calculateAnalysis();
    
    const offer: OfferData = {
      id: `OFF-${Date.now()}`,
      createdAt: new Date(),
      propertyAddress: leadInfo.address,
      city: leadInfo.address.split(',')[1]?.trim() || "",
      state: leadInfo.address.split(',')[2]?.trim()?.split(' ')[0] || "FL",
      zipCode: leadInfo.address.split(',')[2]?.trim()?.split(' ')[1] || "",
      offerPrice: parseFloat(formData.offerPrice),
      earnestMoney: parseFloat(formData.earnestMoney),
      earnestMoneyDays: parseInt(formData.earnestMoneyDays),
      closingDate: new Date(formData.closingDate),
      expirationDate: new Date(formData.expirationDate),
      purchaseType: formData.purchaseType,
      contingencies: formData.contingencies,
      closingCostsPaidBy: formData.closingCostsPaidBy,
      sellerCredits: parseFloat(formData.sellerCredits),
      repairCredits: parseFloat(formData.repairCredits),
      inspectionPeriod: parseInt(formData.inspectionPeriod),
      dueDiligencePeriod: parseInt(formData.dueDiligencePeriod),
      occupancy: formData.occupancy,
      rentBackDays: parseInt(formData.rentBackDays),
      rentBackAmount: parseFloat(formData.rentBackAmount),
      specialProvisions: formData.specialProvisions,
      inclusions: formData.inclusions,
      exclusions: formData.exclusions,
      estimatedARV: parseFloat(formData.estimatedARV) || 0,
      estimatedRepairs: parseFloat(formData.estimatedRepairs) || 0,
      estimatedProfit: analysis.estimatedProfit,
      cashToClose: analysis.cashToClose,
      status: "sent"
    };
    
    onOfferGenerated(offer);
    toast.success("Offer generated and sent successfully!");
    
    // Reset form
    setFormData({
      offerPrice: "",
      earnestMoney: "1000",
      earnestMoneyDays: "3",
      closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      purchaseType: "cash",
      contingencies: [],
      closingCostsPaidBy: "buyer",
      sellerCredits: "0",
      repairCredits: "0",
      inspectionPeriod: "10",
      dueDiligencePeriod: "7",
      occupancy: "at-closing",
      rentBackDays: "0",
      rentBackAmount: "0",
      specialProvisions: "",
      inclusions: ["appliances", "fixtures"],
      exclusions: [],
      estimatedARV: "",
      estimatedRepairs: "",
      maxAllowableOffer: "",
      targetProfit: "",
    });
    setErrors({});
    onOpenChange(false);
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers ? parseInt(numbers).toLocaleString() : "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Cash Offer</DialogTitle>
          <DialogDescription>
            {leadInfo ? (
              <>Create a professional cash offer for {leadInfo.name} at {leadInfo.address}</>
            ) : (
              <>Create a professional cash offer</>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="offer" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="offer">Offer Details</TabsTrigger>
            <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="costs">Costs & Credits</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="offer" className="space-y-4 mt-4">
            {/* Offer Price Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offerPrice">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Offer Price *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="offerPrice"
                      type="text"
                      value={formatCurrency(formData.offerPrice)}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        offerPrice: e.target.value.replace(/\D/g, "") 
                      })}
                      placeholder="250,000"
                      className={`pl-8 ${errors.offerPrice ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.offerPrice && (
                    <p className="text-xs text-red-500">{errors.offerPrice}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseType">
                    <CreditCard className="inline h-4 w-4 mr-1" />
                    Purchase Type *
                  </Label>
                  <Select
                    value={formData.purchaseType}
                    onValueChange={(value: any) => setFormData({ ...formData, purchaseType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">All Cash</SelectItem>
                      <SelectItem value="financing">Conventional Financing</SelectItem>
                      <SelectItem value="subject-to">Subject To Existing Mortgage</SelectItem>
                      <SelectItem value="seller-financing">Seller Financing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Earnest Money */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="earnestMoney">
                    Earnest Money Deposit *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="earnestMoney"
                      type="text"
                      value={formatCurrency(formData.earnestMoney)}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        earnestMoney: e.target.value.replace(/\D/g, "") 
                      })}
                      placeholder="1,000"
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="earnestMoneyDays">
                    EMD Due Within (Days)
                  </Label>
                  <Input
                    id="earnestMoneyDays"
                    type="number"
                    value={formData.earnestMoneyDays}
                    onChange={(e) => setFormData({ ...formData, earnestMoneyDays: e.target.value })}
                    placeholder="3"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="closingDate">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Closing Date *
                  </Label>
                  <Input
                    id="closingDate"
                    type="date"
                    value={formData.closingDate}
                    onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                    className={errors.closingDate ? "border-red-500" : ""}
                  />
                  {errors.closingDate && (
                    <p className="text-xs text-red-500">{errors.closingDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expirationDate">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Offer Expiration *
                  </Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className={errors.expirationDate ? "border-red-500" : ""}
                  />
                  {errors.expirationDate && (
                    <p className="text-xs text-red-500">{errors.expirationDate}</p>
                  )}
                </div>
              </div>

              {/* Quick Calculation */}
              {formData.offerPrice && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Quick Summary
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                        Cash offer of ${formatCurrency(formData.offerPrice)} closing in{" "}
                        {Math.ceil((new Date(formData.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">
                      {formData.purchaseType === "cash" ? "All Cash" : formData.purchaseType}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="terms" className="space-y-4 mt-4">
            {/* Contingencies */}
            <div className="space-y-2">
              <Label>Contingencies</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableContingencies.map((contingency) => (
                  <div key={contingency} className="flex items-center space-x-2">
                    <Checkbox
                      id={contingency}
                      checked={formData.contingencies.includes(contingency)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            contingencies: [...formData.contingencies, contingency]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            contingencies: formData.contingencies.filter(c => c !== contingency)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={contingency} className="text-sm font-normal cursor-pointer">
                      {contingency}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Due Diligence Periods */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inspectionPeriod">
                  Inspection Period (Days)
                </Label>
                <Input
                  id="inspectionPeriod"
                  type="number"
                  value={formData.inspectionPeriod}
                  onChange={(e) => setFormData({ ...formData, inspectionPeriod: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDiligencePeriod">
                  Due Diligence Period (Days)
                </Label>
                <Input
                  id="dueDiligencePeriod"
                  type="number"
                  value={formData.dueDiligencePeriod}
                  onChange={(e) => setFormData({ ...formData, dueDiligencePeriod: e.target.value })}
                />
              </div>
            </div>

            {/* Occupancy */}
            <div className="space-y-2">
              <Label>Occupancy at Closing</Label>
              <Select
                value={formData.occupancy}
                onValueChange={(value: any) => setFormData({ ...formData, occupancy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="at-closing">Vacant at Closing</SelectItem>
                  <SelectItem value="post-closing">Post-Closing Occupancy</SelectItem>
                  <SelectItem value="vacant">Already Vacant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.occupancy as string) === "post-closing" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rentBackDays">Rent Back Days</Label>
                  <Input
                    id="rentBackDays"
                    type="number"
                    value={formData.rentBackDays}
                    onChange={(e) => setFormData({ ...formData, rentBackDays: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rentBackAmount">Daily Rent Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="rentBackAmount"
                      type="text"
                      value={formatCurrency(formData.rentBackAmount)}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        rentBackAmount: e.target.value.replace(/\D/g, "") 
                      })}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Inclusions/Exclusions */}
            <div className="space-y-2">
              <Label>Inclusions</Label>
              <div className="grid grid-cols-2 gap-2">
                {commonInclusions.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={`inc-${item}`}
                      checked={formData.inclusions.includes(item.toLowerCase())}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            inclusions: [...formData.inclusions, item.toLowerCase()]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            inclusions: formData.inclusions.filter(i => i !== item.toLowerCase())
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`inc-${item}`} className="text-sm font-normal cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Provisions */}
            <div className="space-y-2">
              <Label htmlFor="specialProvisions">
                <FileText className="inline h-4 w-4 mr-1" />
                Special Provisions / Additional Terms
              </Label>
              <Textarea
                id="specialProvisions"
                value={formData.specialProvisions}
                onChange={(e) => setFormData({ ...formData, specialProvisions: e.target.value })}
                placeholder="Enter any special terms, conditions, or provisions..."
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4 mt-4">
            {/* Closing Costs */}
            <div className="space-y-2">
              <Label>Closing Costs Paid By</Label>
              <Select
                value={formData.closingCostsPaidBy}
                onValueChange={(value: any) => setFormData({ ...formData, closingCostsPaidBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer Pays All</SelectItem>
                  <SelectItem value="seller">Seller Pays All</SelectItem>
                  <SelectItem value="split">Split 50/50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Credits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellerCredits">
                  Seller Credits to Buyer
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="sellerCredits"
                    type="text"
                    value={formatCurrency(formData.sellerCredits)}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      sellerCredits: e.target.value.replace(/\D/g, "") 
                    })}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repairCredits">
                  Repair Credits
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="repairCredits"
                    type="text"
                    value={formatCurrency(formData.repairCredits)}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      repairCredits: e.target.value.replace(/\D/g, "") 
                    })}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Net to Seller Calculation */}
            {formData.offerPrice && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                <h4 className="font-medium text-sm mb-3">Net to Seller Calculation</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Offer Price</span>
                    <span className="font-medium">${formatCurrency(formData.offerPrice)}</span>
                  </div>
                  {parseFloat(formData.sellerCredits) > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>- Seller Credits</span>
                      <span>-${formatCurrency(formData.sellerCredits)}</span>
                    </div>
                  )}
                  {parseFloat(formData.repairCredits) > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>- Repair Credits</span>
                      <span>-${formatCurrency(formData.repairCredits)}</span>
                    </div>
                  )}
                  {(formData.closingCostsPaidBy as string) === "seller" && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>- Estimated Closing Costs</span>
                      <span>-${formatCurrency(String(parseFloat(formData.offerPrice) * 0.03))}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-bold">
                      <span>Estimated Net to Seller</span>
                      <span className="text-green-600 dark:text-green-400">
                        ${formatCurrency(String(
                          parseFloat(formData.offerPrice || "0") - 
                          parseFloat(formData.sellerCredits || "0") - 
                          parseFloat(formData.repairCredits || "0") -
                          ((formData.closingCostsPaidBy as string) === "seller" ? parseFloat(formData.offerPrice || "0") * 0.03 : 0)
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            {/* Investment Analysis */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedARV">
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  Estimated ARV (After Repair Value)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="estimatedARV"
                    type="text"
                    value={formatCurrency(formData.estimatedARV)}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      estimatedARV: e.target.value.replace(/\D/g, "") 
                    })}
                    placeholder="350,000"
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedRepairs">
                  <Calculator className="inline h-4 w-4 mr-1" />
                  Estimated Repair Costs
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="estimatedRepairs"
                    type="text"
                    value={formatCurrency(formData.estimatedRepairs)}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      estimatedRepairs: e.target.value.replace(/\D/g, "") 
                    })}
                    placeholder="30,000"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Deal Analysis */}
            {formData.offerPrice && formData.estimatedARV && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-sm mb-3 text-green-900 dark:text-green-100">
                  Deal Analysis
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Investment</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${formatCurrency(String(calculateAnalysis().totalInvestment))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Estimated Profit</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${formatCurrency(String(calculateAnalysis().estimatedProfit))}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">ROI</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {calculateAnalysis().roi}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Max Offer (70% Rule)</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${formatCurrency(String(calculateAnalysis().maxOffer))}
                      </p>
                    </div>
                  </div>
                </div>
                
                {parseFloat(formData.offerPrice) > calculateAnalysis().maxOffer && (
                  <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      Offer exceeds 70% rule recommendation by ${formatCurrency(String(parseFloat(formData.offerPrice) - calculateAnalysis().maxOffer))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Cash Required */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Cash Required at Closing
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                    Including earnest money and credits
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${formatCurrency(String(calculateAnalysis().cashToClose))}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info className="h-4 w-4" />
            <span>Offer will be sent via {leadInfo?.name || "lead"}'s preferred contact method</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Generate & Send Offer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}