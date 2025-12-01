
"use client";

// Force dynamic rendering to prevent static pre-rendering with Clerk
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useTruthPanel, useMoneyPanel, useMotionPanel } from "@/hooks/usePanels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Database,
  TrendingUp,
  Activity,
  RefreshCw,
  Loader2,
} from "lucide-react";

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_DATASOURCE_PANELS === "1";

export default function PanelsDataSourcePage() {
  if (!ENABLED) {
    return (
      <div className="p-6">
        <Alert className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Panel data sources are not enabled. Set{" "}
            <code className="bg-muted px-1">NEXT_PUBLIC_ENABLE_DATASOURCE_PANELS=1</code> to enable.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [dealId, setDealId] = useState<string>("cmfw2sw5r000dmfw4bcqpg3o8");
  const [inputDealId, setInputDealId] = useState<string>(dealId);
  const [showJson, setShowJson] = useState<{ truth: boolean; money: boolean; motion: boolean }>({
    truth: false,
    money: false,
    motion: false,
  });

  const {
    data: truth,
    error: truthError,
    isLoading: truthLoading,
    mutate: mutateTruth,
  } = useTruthPanel(dealId);

  const {
    data: money,
    error: moneyError,
    isLoading: moneyLoading,
    mutate: mutateMoney,
  } = useMoneyPanel(dealId);

  const {
    data: motion,
    error: motionError,
    isLoading: motionLoading,
    mutate: mutateMotion,
  } = useMotionPanel(dealId);

  const handleRefresh = () => {
    mutateTruth();
    mutateMoney();
    mutateMotion();
  };

  const handleDealIdUpdate = () => {
    if (inputDealId && inputDealId !== dealId) {
      setDealId(inputDealId);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel Data Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Admin-only view for Truth, Money, and Motion panel endpoints
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="w-64"
            placeholder="Deal ID"
            value={inputDealId}
            onChange={(e) => setInputDealId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleDealIdUpdate()}
          />
          <Button onClick={handleDealIdUpdate} variant="outline">
            Update
          </Button>
          <Button onClick={handleRefresh} size="icon" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Truth Panel */}
        <PanelCard
          title="Truth Panel"
          icon={<Database className="h-5 w-5" />}
          loading={truthLoading}
          error={truthError?.message}
          color="blue"
        >
          {truth && (
            <div className="space-y-4">
              <div className="space-y-2">
                <KpiRow label="Max Exposure" value={`$${truth.policy.maxExposureUsd.toLocaleString()}`} />
                <KpiRow label="P80 Estimate" value={`$${truth.estimate.p80.toLocaleString()}`} />
                <KpiRow
                  label="Headroom"
                  value={`$${truth.headroom.amount.toLocaleString()} (${truth.headroom.pct}%)`}
                  highlight={truth.headroom.pct < 5 ? "danger" : truth.headroom.pct < 15 ? "warning" : "success"}
                />
                <KpiRow label="Target ROI" value={`${truth.policy.targetRoiPct}%`} />
                <KpiRow label="Contingency" value={`$${truth.contingency.remainingUsd.toLocaleString()}`} />
              </div>

              {/* Gate Status */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Gate Status</p>
                <div className="flex flex-wrap gap-1">
                  <StatusBadge label="G1" status={truth.status.g1} />
                  <StatusBadge label="G2" status={truth.status.g2} />
                  <StatusBadge label="G3" status={truth.status.g3} />
                  <StatusBadge label="G4" status={truth.status.g4} />
                </div>
              </div>

              {/* Drivers */}
              {truth.drivers.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Top Risk Drivers</p>
                  <div className="space-y-1">
                    {truth.drivers.map((driver, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{driver.trade}</span>
                        <span className={driver.delta > 0 ? "text-red-600" : "text-green-600"}>
                          ${Math.abs(driver.delta).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {truth.actions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Recommended Actions</p>
                  <div className="space-y-1">
                    {truth.actions.map((action, i) => (
                      <div key={i} className="text-xs bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                        {action.replace(/_/g, " ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <JsonToggle
                open={showJson.truth}
                onToggle={() => setShowJson({ ...showJson, truth: !showJson.truth })}
                data={truth}
              />
            </div>
          )}
        </PanelCard>

        {/* Money Panel */}
        <PanelCard
          title="Money Panel"
          icon={<TrendingUp className="h-5 w-5" />}
          loading={moneyLoading}
          error={moneyError?.message}
          color="green"
        >
          {money && (
            <div className="space-y-4">
              <div className="space-y-2">
                <KpiRow label="Baseline" value={`$${money.budget.baseline.toLocaleString()}`} />
                <KpiRow label="Committed" value={`$${money.budget.committed.toLocaleString()}`} />
                <KpiRow label="Actuals" value={`$${money.budget.actuals.toLocaleString()}`} />
                <KpiRow
                  label="Variance"
                  value={`$${money.budget.variance.abs.toLocaleString()} (${(money.budget.variance.pct * 100).toFixed(1)}%)`}
                  highlight={money.budget.variance.pct > 0.1 ? "danger" : money.budget.variance.pct > 0.05 ? "warning" : "success"}
                />
              </div>

              {/* Change Orders */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Change Orders</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved</span>
                    <span>{money.changeOrders.approved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Denied</span>
                    <span>{money.changeOrders.denied}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Impact</span>
                    <span className={money.changeOrders.netImpactUsd > 0 ? "text-red-600" : ""}>
                      ${money.changeOrders.netImpactUsd.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Burn Rate */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Burn Rate</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily</span>
                    <span>${money.burn.dailyUsd.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days Held</span>
                    <span>{money.burn.daysHeld}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Carry</span>
                    <span>${money.burn.carryToDateUsd.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Top Trades by Variance */}
              {money.byTrade && money.byTrade.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Top Trades by Variance</p>
                  <div className="space-y-1">
                    {money.byTrade
                      .sort((a, b) => Math.abs(b.varianceAbs) - Math.abs(a.varianceAbs))
                      .slice(0, 3)
                      .map((trade, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="flex items-center gap-1">
                            {trade.trade}
                            {trade.frozen && <Badge variant="outline" className="text-[10px] px-1 py-0 h-3">Frozen</Badge>}
                          </span>
                          <span className={trade.varianceAbs > 0 ? "text-red-600" : "text-green-600"}>
                            ${Math.abs(trade.varianceAbs).toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <JsonToggle
                open={showJson.money}
                onToggle={() => setShowJson({ ...showJson, money: !showJson.money })}
                data={money}
              />
            </div>
          )}
        </PanelCard>

        {/* Motion Panel */}
        <PanelCard
          title="Motion Panel"
          icon={<Activity className="h-5 w-5" />}
          loading={motionLoading}
          error={motionError?.message}
          color="purple"
        >
          {motion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <KpiRow
                  label="Progress"
                  value={`${motion.progress.completedMilestones}/${motion.progress.plannedMilestones} (${motion.progress.percentComplete}%)`}
                />
                <KpiRow label="Bottlenecks" value={motion.bottlenecks.length.toString()} />
                <KpiRow label="Active Vendors" value={motion.vendors.length.toString()} />
              </div>

              {/* Bottlenecks */}
              {motion.bottlenecks.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Current Bottlenecks</p>
                  <div className="space-y-2">
                    {motion.bottlenecks.slice(0, 3).map((bottleneck, i) => (
                      <div key={i} className="text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="destructive" className="text-[10px]">
                            {bottleneck.type}
                          </Badge>
                          <span className="text-muted-foreground">{bottleneck.ageHours}h old</span>
                        </div>
                        <p className="text-muted-foreground">{bottleneck.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Vendors */}
              {motion.vendors.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Vendor Performance</p>
                  <div className="space-y-1">
                    {motion.vendors.slice(0, 3).map((vendor, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{vendor.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={vendor.reliabilityScore >= 0.9 ? "default" : vendor.reliabilityScore >= 0.7 ? "secondary" : "destructive"}
                            className="text-[10px]"
                          >
                            {(vendor.reliabilityScore * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Events */}
              {motion.recentEvents.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Recent Activity</p>
                  <div className="space-y-1">
                    {motion.recentEvents.slice(0, 3).map((event, i) => (
                      <div key={i} className="text-xs flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {new Date(event.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1">
                          {event.artifact}
                        </Badge>
                        <span className="truncate">{event.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <JsonToggle
                open={showJson.motion}
                onToggle={() => setShowJson({ ...showJson, motion: !showJson.motion })}
                data={motion}
              />
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}

function PanelCard({
  title,
  icon,
  loading,
  error,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  loading?: boolean;
  error?: string;
  color: "blue" | "green" | "purple";
  children?: React.ReactNode;
}) {
  const colorClasses = {
    blue: "border-blue-200 dark:border-blue-800",
    green: "border-green-200 dark:border-green-800",
    purple: "border-purple-200 dark:border-purple-800",
  };

  return (
    <Card className={`${colorClasses[color]} relative`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error: {error}</AlertDescription>
          </Alert>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function KpiRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "success" | "warning" | "danger";
}) {
  const highlightClasses = {
    success: "text-green-600 dark:text-green-400 font-semibold",
    warning: "text-amber-600 dark:text-amber-400 font-semibold",
    danger: "text-red-600 dark:text-red-400 font-semibold",
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${highlight ? highlightClasses[highlight] : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  const getVariant = () => {
    const s = status.toUpperCase();
    if (s === "APPROVED" || s === "OK" || s === "GREEN" || s === "HEALTHY") return "default";
    if (s === "BLOCKED" || s === "DENIED" || s === "DENIED_RECENT") return "destructive";
    if (s === "TIER1" || s === "TIER2") return "secondary";
    return "outline";
  };

  return (
    <Badge variant={getVariant()} className="text-xs">
      {label}: {status}
    </Badge>
  );
}

function JsonToggle({ open, onToggle, data }: { open: boolean; onToggle: () => void; data: any }) {
  return (
    <div className="pt-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? "Hide" : "Show"} JSON
      </button>
      {open && (
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-muted/50 p-3 text-[11px] leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}