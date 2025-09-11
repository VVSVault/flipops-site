"use client";

import { useState } from "react";
import { OfferData } from "./generate-offer-modal";
import { 
  DollarSign, 
  Calendar, 
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Home,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OfferWidgetProps {
  offer: OfferData;
  onViewDetails?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
}

export function OfferWidget({ 
  offer, 
  onViewDetails,
  onAccept,
  onReject,
  onCounter 
}: OfferWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "viewed": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "accepted": return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "rejected": return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "expired": return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
      case "countered": return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      case "expired": return <Clock className="h-4 w-4" />;
      case "viewed": return <Eye className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const daysUntilExpiration = Math.ceil(
    (offer.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const daysToClose = Math.ceil(
    (offer.closingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 max-w-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Cash Offer #{offer.id}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sent {offer.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge className={cn("gap-1", getStatusColor(offer.status))}>
          {getStatusIcon(offer.status)}
          {offer.status}
        </Badge>
      </div>

      {/* Main Offer Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Offer Price</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(offer.offerPrice)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {offer.purchaseType === "cash" ? "All Cash" : offer.purchaseType}
            </p>
            {offer.estimatedProfit > 0 && (
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                +{formatCurrency(offer.estimatedProfit)} profit
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Closing</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {daysToClose} days
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded">
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Expires</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {daysUntilExpiration > 0 ? `${daysUntilExpiration} days` : "Expired"}
              </p>
            </div>
          </div>
        </div>

        {/* Property Address */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
          <Home className="h-4 w-4 text-gray-500" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {offer.propertyAddress}
          </p>
        </div>

        {/* Expandable Details */}
        {expanded && (
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Key Terms */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                Key Terms
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Earnest Money</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(offer.earnestMoney)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Inspection Period</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {offer.inspectionPeriod} days
                  </span>
                </div>
                {offer.contingencies.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Contingencies</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {offer.contingencies.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Credits & Costs */}
            {(offer.sellerCredits > 0 || offer.repairCredits > 0) && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  Credits & Costs
                </p>
                <div className="space-y-1 text-sm">
                  {offer.sellerCredits > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Seller Credits</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(offer.sellerCredits)}
                      </span>
                    </div>
                  )}
                  {offer.repairCredits > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Repair Credits</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(offer.repairCredits)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Closing Costs</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {offer.closingCostsPaidBy === "buyer" ? "Buyer Pays" :
                       offer.closingCostsPaidBy === "seller" ? "Seller Pays" : "Split 50/50"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Investment Analysis */}
            {offer.estimatedARV > 0 && (
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                  Investment Analysis
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">ARV</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(offer.estimatedARV)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Repairs</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(offer.estimatedRepairs)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Less Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                More Details
              </>
            )}
          </Button>

          {offer.status === "sent" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onViewDetails}
              >
                View Full
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  // Mark as viewed
                  offer.status = "viewed";
                }}
              >
                Track Status
              </Button>
            </div>
          )}

          {offer.status === "viewed" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
              >
                Withdraw
              </Button>
              <Button
                size="sm"
                onClick={onCounter}
              >
                Send Reminder
              </Button>
            </div>
          )}

          {offer.status === "countered" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
              >
                Reject Counter
              </Button>
              <Button
                size="sm"
                onClick={onAccept}
              >
                Accept Counter
              </Button>
            </div>
          )}
        </div>

        {/* Expiration Warning */}
        {daysUntilExpiration <= 1 && daysUntilExpiration > 0 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              This offer expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}