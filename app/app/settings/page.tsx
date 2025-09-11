"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Bell, 
  Database,
  Key,
  Users,
  Palette,
  Zap,
  Mail,
  Phone,
  DollarSign,
  Globe,
  Clock,
  Download,
  Upload,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  ChevronRight,
  Save,
  RefreshCw,
  Trash2,
  Plus,
  Settings,
  UserCheck,
  FileText,
  BarChart,
  Laptop,
  Tablet
} from "lucide-react";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [autoLogout, setAutoLogout] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [leadScoring, setLeadScoring] = useState(true);
  const [autoAssign, setAutoAssign] = useState(false);
  const [dataRetention, setDataRetention] = useState("12");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("America/New_York");
  const [priceAlertThreshold, setPriceAlertThreshold] = useState([10]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toast = (props: { title: string; description: string }) => {
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

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "All your preferences have been updated successfully."
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-6rem)] overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex-none pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your account preferences, security, and platform configuration
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline">
                Reset to Defaults
              </Button>
              <Button onClick={handleSaveSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="data">Data & Privacy</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            {/* General Settings */}
            <TabsContent value="general" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        <CardTitle>Display Preferences</CardTitle>
                      </div>
                      <CardDescription>
                        Customize how FlipOps looks and feels
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Theme Mode</Label>
                          <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                          <Moon className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Compact View</Label>
                          <p className="text-sm text-muted-foreground">Show more data in less space</p>
                        </div>
                        <Switch checked={compactView} onCheckedChange={setCompactView} />
                      </div>

                      <div className="space-y-2">
                        <Label>Currency Display</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                            <SelectItem value="GBP">£ GBP - British Pound</SelectItem>
                            <SelectItem value="CAD">$ CAD - Canadian Dollar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Auto-save Changes</Label>
                          <p className="text-sm text-muted-foreground">Automatically save form data as you type</p>
                        </div>
                        <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        <CardTitle>Dashboard Settings</CardTitle>
                      </div>
                      <CardDescription>
                        Configure your dashboard layout and widgets
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Default Dashboard View</Label>
                        <Select defaultValue="executive">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="executive">Executive Overview</SelectItem>
                            <SelectItem value="deals">Deal Pipeline</SelectItem>
                            <SelectItem value="marketing">Marketing Performance</SelectItem>
                            <SelectItem value="properties">Property Analysis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Data Refresh Rate</Label>
                        <Select defaultValue="5">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Every minute</SelectItem>
                            <SelectItem value="5">Every 5 minutes</SelectItem>
                            <SelectItem value="15">Every 15 minutes</SelectItem>
                            <SelectItem value="30">Every 30 minutes</SelectItem>
                            <SelectItem value="manual">Manual only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        <CardTitle>Notification Channels</CardTitle>
                      </div>
                      <CardDescription>
                        Choose how you want to receive alerts and updates
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5" />
                          <div>
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive updates via email</p>
                          </div>
                        </div>
                        <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5" />
                          <div>
                            <Label>SMS Notifications</Label>
                            <p className="text-sm text-muted-foreground">Get text messages for urgent alerts</p>
                          </div>
                        </div>
                        <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5" />
                          <div>
                            <Label>Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Browser and mobile app notifications</p>
                          </div>
                        </div>
                        <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Preferences</CardTitle>
                      <CardDescription>
                        Configure what triggers notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label>Price Change Alert Threshold</Label>
                        <div className="flex items-center gap-4">
                          <Slider 
                            value={priceAlertThreshold} 
                            onValueChange={setPriceAlertThreshold}
                            max={50}
                            step={5}
                            className="flex-1"
                          />
                          <span className="w-12 text-sm font-medium">{priceAlertThreshold[0]}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Get notified when property prices change by this percentage
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "New leads", desc: "When assigned", default: true },
                          { label: "Deal stages", desc: "Status changes", default: true },
                          { label: "Documents", desc: "Signatures needed", default: true },
                          { label: "Price updates", desc: "Property changes", default: false },
                          { label: "Team mentions", desc: "In notes/comments", default: true },
                          { label: "Maintenance", desc: "System updates", default: false }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                            </div>
                            <Switch defaultChecked={item.default} className="scale-90" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <CardTitle>Security Settings</CardTitle>
                      </div>
                      <CardDescription>
                        Protect your account and data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Lock className="h-5 w-5 mt-0.5" />
                          <div className="space-y-1">
                            <Label>Automatic Security Logout</Label>
                            <p className="text-sm text-muted-foreground">
                              Auto-logout after 10 minutes of inactivity
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-green-600">Recommended</span>
                            </div>
                          </div>
                        </div>
                        <Switch checked={autoLogout} onCheckedChange={setAutoLogout} />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 mt-0.5" />
                          <div className="space-y-1">
                            <Label>Two-Factor Authentication</Label>
                            <p className="text-sm text-muted-foreground">
                              Extra verification for sensitive actions
                            </p>
                            {!twoFactorEnabled && (
                              <div className="flex items-center gap-2 mt-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                <span className="text-xs text-yellow-600">Not enabled</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                      </div>

                      <div className="space-y-2">
                        <Label>Session Timeout</Label>
                        <Select defaultValue="10">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="10">10 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>IP Restrictions</Label>
                        <Input placeholder="Enter allowed IP addresses (comma-separated)" />
                        <p className="text-xs text-muted-foreground">
                          Leave blank to allow access from any IP
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Active Sessions</CardTitle>
                      <CardDescription>
                        Manage devices with access to your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-6 gap-4">
                        {[
                          { device: "MacBook Pro", browser: "Chrome", location: "Miami, FL", time: "Current", current: true, icon: Laptop, os: "macOS" },
                          { device: "iPhone 14", browser: "App", location: "Miami, FL", time: "2h ago", current: false, icon: Smartphone, os: "iOS" },
                          { device: "iPad", browser: "Safari", location: "Fort Lauderdale", time: "Yesterday", current: false, icon: Tablet, os: "iPadOS" },
                          { device: "Windows PC", browser: "Edge", location: "Orlando, FL", time: "3d ago", current: false, icon: Monitor, os: "Windows" },
                          { device: "Android", browser: "Chrome", location: "Tampa, FL", time: "1w ago", current: false, icon: Smartphone, os: "Android" }
                        ].map((session, idx) => {
                          const Icon = session.icon;
                          return (
                            <div 
                              key={idx} 
                              className="relative group cursor-pointer"
                              title={`${session.browser} on ${session.device}\n${session.location}\n${session.time}`}
                            >
                              <div className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                                session.current 
                                  ? 'border-green-500 bg-green-500/10' 
                                  : 'border-muted hover:border-muted-foreground/50'
                              }`}>
                                <Icon className={`h-8 w-8 mx-auto ${
                                  session.current ? 'text-green-500' : 'text-muted-foreground'
                                }`} />
                                <p className="text-xs text-center mt-2 font-medium">
                                  {session.time}
                                </p>
                              </div>
                              
                              {/* Hover card with details */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <div className="bg-popover border rounded-lg shadow-lg p-3 whitespace-nowrap">
                                  <p className="text-sm font-medium">{session.device}</p>
                                  <p className="text-xs text-muted-foreground">{session.browser} • {session.os}</p>
                                  <p className="text-xs text-muted-foreground">{session.location}</p>
                                  {!session.current && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-red-500 mt-2 w-full pointer-events-auto"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "Session Revoked",
                                          description: `Access from ${session.device} has been revoked.`
                                        });
                                      }}
                                    >
                                      Revoke Access
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {session.current && (
                                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5">
                                  Active
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Click on any device to see details or revoke access
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Integrations */}
            <TabsContent value="integrations" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        <CardTitle>API Configuration</CardTitle>
                      </div>
                      <CardDescription>
                        Manage your API keys and external service connections
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                          API Key Security
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          Never share your API keys. Regenerate them immediately if compromised.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Public API Key</Label>
                        <div className="flex gap-2">
                          <Input value="pk_live_51234567890abcdef" readOnly className="font-mono text-xs" />
                          <Button size="icon" variant="outline">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Secret API Key</Label>
                        <div className="flex gap-2">
                          <Input type="password" value="sk_live_51234567890abcdef" readOnly className="font-mono text-xs" />
                          <Button size="icon" variant="outline">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <Input placeholder="https://your-domain.com/webhooks" />
                        <p className="text-xs text-muted-foreground">
                          Endpoint for receiving real-time updates
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Connected Services</CardTitle>
                      <CardDescription>
                        Third-party integrations and their status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-6 gap-2">
                        {[
                          { name: "Calendar", status: "connected", icon: "📅" },
                          { name: "Zapier", status: "connected", icon: "⚡" },
                          { name: "QuickBooks", status: "disconnected", icon: "💰" },
                          { name: "Slack", status: "connected", icon: "💬" },
                          { name: "Mailchimp", status: "disconnected", icon: "📧" },
                          { name: "Dropbox", status: "connected", icon: "📦" },
                          { name: "DocuSign", status: "connected", icon: "✍️" },
                          { name: "Zillow", status: "disconnected", icon: "🏠" },
                          { name: "Stripe", status: "connected", icon: "💳" },
                          { name: "HubSpot", status: "disconnected", icon: "🎯" },
                          { name: "Drive", status: "connected", icon: "☁️" },
                          { name: "Twilio", status: "disconnected", icon: "📱" }
                        ].map((service, idx) => (
                          <div 
                            key={idx} 
                            className={`relative group cursor-pointer p-2 rounded-lg border transition-all hover:scale-105 ${
                              service.status === "connected" 
                                ? 'border-green-500/50 bg-green-500/10' 
                                : 'border-muted hover:border-muted-foreground/50'
                            }`}
                            title={service.name}
                          >
                            <div className="text-center">
                              <span className="text-xl">{service.icon}</span>
                              <p className="text-[10px] font-medium mt-0.5 truncate">{service.name}</p>
                              <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                                service.status === "connected" 
                                  ? 'bg-green-500' 
                                  : 'bg-muted-foreground/50'
                              }`} />
                            </div>
                            
                            {/* Hover overlay with action */}
                            <div className="absolute inset-0 bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-1">
                              <p className="text-[10px] font-medium mb-1">{service.name}</p>
                              <Button size="sm" variant={service.status === "connected" ? "outline" : "default"} className="text-[10px] h-5 px-2">
                                {service.status === "connected" ? "Settings" : "Connect"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Automation */}
            <TabsContent value="automation" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        <CardTitle>Workflow Automation</CardTitle>
                      </div>
                      <CardDescription>
                        Configure automatic actions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <UserCheck className="h-5 w-5 mt-0.5" />
                          <div className="space-y-1">
                            <Label>Automatic Lead Scoring</Label>
                            <p className="text-sm text-muted-foreground">
                              Score leads based on engagement and criteria
                            </p>
                          </div>
                        </div>
                        <Switch checked={leadScoring} onCheckedChange={setLeadScoring} />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Users className="h-5 w-5 mt-0.5" />
                          <div className="space-y-1">
                            <Label>Auto-assign Leads</Label>
                            <p className="text-sm text-muted-foreground">
                              Distribute new leads to team members automatically
                            </p>
                          </div>
                        </div>
                        <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
                      </div>

                      <div className="space-y-2">
                        <Label>Lead Assignment Method</Label>
                        <Select defaultValue="round-robin" disabled={!autoAssign}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="round-robin">Round Robin</SelectItem>
                            <SelectItem value="load-balanced">Load Balanced</SelectItem>
                            <SelectItem value="territory">By Territory</SelectItem>
                            <SelectItem value="expertise">By Expertise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Follow-up Reminder Delay</Label>
                        <Select defaultValue="24">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 hours</SelectItem>
                            <SelectItem value="6">6 hours</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="48">48 hours</SelectItem>
                            <SelectItem value="72">72 hours</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Automatic reminder if lead hasn't been contacted
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Email Templates</CardTitle>
                      <CardDescription>
                        Automated email responses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: "Welcome Email", trigger: "New lead", status: "active", icon: "👋" },
                          { name: "Property Inquiry", trigger: "Question", status: "active", icon: "🏠" },
                          { name: "Showing Confirm", trigger: "Scheduled", status: "draft", icon: "📅" },
                          { name: "Deal Update", trigger: "Status change", status: "active", icon: "📊" },
                          { name: "Doc Request", trigger: "Missing docs", status: "draft", icon: "📄" },
                          { name: "Follow Up", trigger: "3 days", status: "active", icon: "🔔" }
                        ].map((template, idx) => (
                          <div 
                            key={idx} 
                            className="group relative p-3 border rounded-lg hover:border-muted-foreground/50 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{template.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">{template.name}</p>
                                  <Badge 
                                    variant={template.status === "active" ? "default" : "secondary"}
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {template.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{template.trigger}</p>
                              </div>
                            </div>
                            
                            {/* Hover actions */}
                            <div className="absolute inset-0 bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button size="sm" variant="outline" className="text-xs h-7">
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7">
                                Preview
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" variant="outline" className="w-full mt-3">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Data & Privacy */}
            <TabsContent value="data" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        <CardTitle>Data Management</CardTitle>
                      </div>
                      <CardDescription>
                        Control how your data is stored and processed
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Data Retention Period</Label>
                        <Select value={dataRetention} onValueChange={setDataRetention}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 months</SelectItem>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                            <SelectItem value="24">24 months</SelectItem>
                            <SelectItem value="forever">Forever</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          How long to keep inactive lead and property data
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Data Export</Label>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 text-xs h-8">
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                          <Button variant="outline" className="flex-1 text-xs h-8">
                            <Upload className="h-3 w-3 mr-1" />
                            Import
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Download your data in CSV or JSON format
                        </p>
                      </div>

                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                          <div className="space-y-2 flex-1">
                            <div>
                              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                Danger Zone
                              </p>
                              <p className="text-xs text-red-800 dark:text-red-200">
                                These actions cannot be undone
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-red-600 text-xs h-7">
                                <Trash2 className="h-3 w-3 mr-1" />
                                Clear Data
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 text-xs h-7">
                                Delete Account
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy Settings</CardTitle>
                      <CardDescription>
                        Control data sharing and privacy
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Usage analytics", desc: "Help improve", default: true },
                          { label: "Marketing", desc: "Updates & tips", default: false },
                          { label: "Public profile", desc: "Discoverable", default: false },
                          { label: "Data processing", desc: "Required", default: true, disabled: true },
                          { label: "Cookies", desc: "Experience", default: true },
                          { label: "Third-party", desc: "Partners", default: false },
                          { label: "Performance", desc: "Optimization", default: true },
                          { label: "Beta features", desc: "Early access", default: false }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                            </div>
                            <Switch 
                              defaultChecked={item.default} 
                              disabled={item.disabled}
                              className="flex-shrink-0 scale-90" 
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}