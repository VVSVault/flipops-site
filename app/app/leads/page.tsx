"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Filter, 
  Download,
  MoreVertical,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const mockLeads = [
  {
    id: "L-1234",
    property: "123 Main St, Jacksonville, FL",
    owner: "John Smith",
    source: "PPC",
    signals: ["Distressed", "High Equity"],
    score: 92,
    status: "New",
    lastOutbound: "2 days ago",
    sentiment: "Positive",
    nextTask: "Follow-up call",
  },
  {
    id: "L-1235",
    property: "456 Oak Ave, Miami, FL",
    owner: "Jane Doe LLC",
    source: "Direct Mail",
    signals: ["Pre-foreclosure"],
    score: 88,
    status: "Contacted",
    lastOutbound: "1 day ago",
    sentiment: "Neutral",
    nextTask: "Send offer",
  },
  {
    id: "L-1236",
    property: "789 Pine Rd, Tampa, FL",
    owner: "Mike Johnson",
    source: "Cold Call",
    signals: ["Vacant", "Tax Delinquent"],
    score: 85,
    status: "Negotiating",
    lastOutbound: "3 hours ago",
    sentiment: "Positive",
    nextTask: "Schedule showing",
  },
];

function LeadsContent() {
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchParams = useSearchParams();

  const openLeadDrawer = (lead: any) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  // Check if a lead ID is passed in the URL and open the drawer
  useEffect(() => {
    const leadId = searchParams.get('lead');
    if (leadId) {
      const lead = mockLeads.find(l => l.id === leadId);
      if (lead) {
        openLeadDrawer(lead);
      }
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and track all your real estate leads</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by property, owner, or ID..."
                className="pl-10 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full lg:w-[180px] bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full lg:w-[180px] bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="ppc">PPC</SelectItem>
                <SelectItem value="direct-mail">Direct Mail</SelectItem>
                <SelectItem value="cold-call">Cold Call</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-700">
                <TableHead className="text-gray-600 dark:text-gray-400">ID</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Property</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Owner</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Source</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Signals</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Score</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Status</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Last Outbound</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Sentiment</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400">Next Task</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                  onClick={() => openLeadDrawer(lead)}
                >
                  <TableCell className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {lead.id}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-white font-medium">
                    {lead.property}
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{lead.owner}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {lead.signals.map((signal) => (
                        <Badge key={signal} variant="secondary" className="text-xs">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-bold ${
                      lead.score >= 90 ? 'text-green-500' : 
                      lead.score >= 70 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {lead.score}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                    {lead.lastOutbound}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={lead.sentiment === 'Positive' ? 'default' : 'outline'}
                      className={lead.sentiment === 'Positive' ? 'bg-green-500/20 text-green-500' : ''}
                    >
                      {lead.sentiment}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300 text-sm">
                    {lead.nextTask}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lead Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="text-gray-900 dark:text-white">{selectedLead.property}</SheetTitle>
                <SheetDescription className="text-gray-600 dark:text-gray-400">
                  Lead ID: {selectedLead.id} • Score: {selectedLead.score}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    SMS
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Offer
                  </Button>
                </div>

                {/* Property Details */}
                <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white text-sm">Property Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Address</span>
                      <span className="text-gray-900 dark:text-white">{selectedLead.property}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Owner</span>
                      <span className="text-gray-900 dark:text-white">{selectedLead.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Source</span>
                      <span className="text-gray-900 dark:text-white">{selectedLead.source}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white text-sm">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white text-sm">SMS sent</p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">2 days ago • "Hi, are you interested in selling..."</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full mt-2" />
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white text-sm">Lead scored</p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">3 days ago • Score: 92 (High potential)</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="h-2 w-2 bg-gray-500 rounded-full mt-2" />
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white text-sm">Lead created</p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">5 days ago • Source: PPC Campaign</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeadsContent />
    </Suspense>
  );
}