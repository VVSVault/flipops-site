
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { PreviewModeWrapper } from "@/app/components/preview-mode-wrapper";
import { GenerateOfferModal, OfferData } from "@/app/components/generate-offer-modal";
import { OfferWidget } from "@/app/components/offer-widget";
import { 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Voicemail, 
  MessageSquare,
  Send,
  Calendar,
  Paperclip,
  MoreVertical,
  ChevronDown,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  X,
  FileText,
  File,
  Image as ImageIcon,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  MapPin,
  Tag,
  ChevronRight,
  PhoneCall,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock data types
interface Message {
  id: string;
  threadId: string;
  direction: "in" | "out";
  channel: "sms" | "email" | "voicemail";
  body: string;
  status: "queued" | "sent" | "delivered" | "failed" | "read";
  sentiment?: "positive" | "neutral" | "negative";
  timestamp: Date;
  sender?: string;
  attachments?: Array<{ name: string; url: string; type: string; size: string }>;
  offer?: OfferData;
}

interface Thread {
  id: string;
  leadId: string;
  leadName: string;
  leadAddress: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  channels: string[];
  sentiment?: "positive" | "neutral" | "negative";
  score: number;
  stage: string;
  tags: string[];
  phoneNumbers: string[];
  emails: string[];
  optInStatus: { sms: boolean; email: boolean };
}

// Mock data generator
const generateMockThreads = (): Thread[] => {
  const sentiments: Array<"positive" | "neutral" | "negative" | undefined> = ["positive", "neutral", "negative", undefined];
  const stages = ["New", "Contacted", "Engaged", "Negotiating", "Under Contract", "Won", "Lost"];
  const channels = [["sms"], ["email"], ["sms", "email"], ["voicemail"], ["sms", "email", "voicemail"]];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `thread-${i + 1}`,
    leadId: `L-${1000 + i}`,
    leadName: [
      "John Smith", "Jane Doe", "Mike Johnson", "Sarah Williams", "Robert Brown",
      "Emily Davis", "Chris Miller", "Amanda Wilson", "David Moore", "Lisa Taylor"
    ][i % 10],
    leadAddress: `${100 + i * 10} ${["Main", "Oak", "Pine", "Elm", "Maple"][i % 5]} St, Jacksonville, FL`,
    lastMessage: [
      "Yes, I'm interested in selling. What's your offer?",
      "Can you send me more information about the process?",
      "I need to think about it and discuss with my spouse",
      "The property needs some repairs, does that matter?",
      "What's the timeline for closing?",
      "I'm not ready to sell right now",
      "Can we schedule a time to view the property?",
      "Your offer seems low compared to market value",
      "I have a mortgage, how does that work?",
      "Thanks for reaching out, but I'm not interested"
    ][i % 10],
    lastMessageTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    unreadCount: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0,
    channels: channels[i % channels.length],
    sentiment: sentiments[i % 4],
    score: 60 + Math.floor(Math.random() * 40),
    stage: stages[i % stages.length],
    tags: [
      ["Distressed", "High Equity"],
      ["Pre-foreclosure"],
      ["Vacant", "Tax Delinquent"],
      ["Inherited"],
      ["Absentee Owner"],
    ][i % 5],
    phoneNumbers: [`(904) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`],
    emails: [`${["john", "jane", "mike", "sarah", "robert"][i % 5]}@example.com`],
    optInStatus: { sms: Math.random() > 0.2, email: Math.random() > 0.3 }
  }));
};

const generateMockMessages = (threadId: string): Message[] => {
  // Get thread info from the mock threads
  const threadIndex = parseInt(threadId.split('-')[1]) - 1;
  const addresses = [
    "123 Main St, Jacksonville, FL",
    "456 Oak Ave, Miami, FL", 
    "789 Pine Rd, Orlando, FL",
    "321 Elm Dr, Tampa, FL",
    "654 Maple Ct, St. Petersburg, FL"
  ];
  const names = ["John", "Jane", "Mike", "Sarah", "Robert"];
  const address = addresses[threadIndex % 5];
  const firstName = names[threadIndex % 5];
  
  // Create realistic conversation threads based on thread ID
  const conversations: { [key: string]: Message[] } = {
    "thread-1": [
      {
        id: "msg-1-1",
        threadId: "thread-1",
        direction: "out",
        channel: "sms",
        body: `Hi ${firstName}, I noticed your property at ${address} and I'm interested in making a cash offer. Are you still considering selling?`,
        status: "delivered",
        timestamp: new Date(Date.now() - 7200000),
        sender: "You"
      },
      {
        id: "msg-1-2",
        threadId: "thread-1",
        direction: "in",
        channel: "sms",
        body: "Yes, we've been thinking about it. The house needs a lot of work though. What kind of offer are you thinking?",
        status: "read",
        timestamp: new Date(Date.now() - 6900000),
        sender: firstName,
        sentiment: "neutral"
      },
      {
        id: "msg-1-3",
        threadId: "thread-1",
        direction: "out",
        channel: "sms",
        body: "We specialize in properties that need work and can close quickly with cash. Based on comparable sales in your area, I can offer around $285,000. We handle all closing costs and you pick the closing date.",
        status: "delivered",
        timestamp: new Date(Date.now() - 6600000),
        sender: "You"
      },
      {
        id: "msg-1-4",
        threadId: "thread-1",
        direction: "in",
        channel: "sms",
        body: "That's lower than I was hoping for. We owe about $220,000 on the mortgage. Can you do $300,000?",
        status: "read",
        timestamp: new Date(Date.now() - 6300000),
        sender: firstName,
        sentiment: "negative"
      },
      {
        id: "msg-1-5",
        threadId: "thread-1",
        direction: "out",
        channel: "sms",
        body: "I understand your position. Let me review the numbers again. Could we schedule a quick walkthrough tomorrow? Sometimes seeing the property in person helps me make a better offer.",
        status: "delivered",
        timestamp: new Date(Date.now() - 6000000),
        sender: "You"
      },
      {
        id: "msg-1-6",
        threadId: "thread-1",
        direction: "in",
        channel: "sms",
        body: "Sure, I'm available after 3pm tomorrow. The roof does leak in one spot and the AC doesn't work, just so you know.",
        status: "read",
        timestamp: new Date(Date.now() - 5700000),
        sender: firstName,
        sentiment: "positive"
      },
      {
        id: "msg-1-7",
        threadId: "thread-1",
        direction: "out",
        channel: "sms",
        body: "Perfect! How does 4pm work? And thanks for letting me know about those issues - we work with contractors regularly so those repairs aren't a problem for us.",
        status: "delivered",
        timestamp: new Date(Date.now() - 5400000),
        sender: "You"
      },
      {
        id: "msg-1-8",
        threadId: "thread-1",
        direction: "in",
        channel: "sms",
        body: "4pm works great. See you then!",
        status: "read",
        timestamp: new Date(Date.now() - 5100000),
        sender: firstName,
        sentiment: "positive"
      }
    ],
    "thread-2": [
      {
        id: "msg-2-1",
        threadId: "thread-2",
        direction: "out",
        channel: "email",
        body: `Subject: Cash Offer for ${address}\n\nDear ${firstName},\n\nI hope this email finds you well. I'm a local real estate investor and noticed your property might be a good fit for our investment portfolio.\n\nWe can offer:\n• Quick cash sale (close in 7-14 days)\n• No repairs needed - we buy as-is\n• No realtor fees or commissions\n• Flexible closing date\n\nWould you be interested in discussing this further?\n\nBest regards,\nFlipOps Investment Team`,
        status: "delivered",
        timestamp: new Date(Date.now() - 86400000),
        sender: "You",
        attachments: [{ name: "Company-Info.pdf", url: "#", type: "application/pdf", size: "1.5 MB" }]
      },
      {
        id: "msg-2-2",
        threadId: "thread-2",
        direction: "in",
        channel: "email",
        body: "I received your email. I might be interested but I'm not in a rush to sell. What's your process and how do you determine your offer price?",
        status: "read",
        timestamp: new Date(Date.now() - 82800000),
        sender: firstName,
        sentiment: "neutral"
      },
      {
        id: "msg-2-3",
        threadId: "thread-2",
        direction: "out",
        channel: "email",
        body: `Great to hear from you! Our process is straightforward:\n\n1. Property Assessment: We'll schedule a brief walkthrough at your convenience\n2. Market Analysis: We analyze recent sales of similar properties in your neighborhood\n3. Offer Presentation: Within 24 hours, we present a fair cash offer\n4. Your Decision: No pressure - take your time to consider\n5. Quick Closing: If accepted, we can close in as little as 7 days\n\nOur offers are based on the property's current condition, local market values, and needed repairs. We're typically able to offer 70-85% of after-repair value.\n\nWould you like to schedule a no-obligation property assessment?`,
        status: "delivered",
        timestamp: new Date(Date.now() - 79200000),
        sender: "You"
      },
      {
        id: "msg-2-4",
        threadId: "thread-2",
        direction: "in",
        channel: "email",
        body: "That sounds reasonable. I'm curious what you think the property is worth. Can we set up a time next week? I'm available Tuesday or Thursday afternoon.",
        status: "read",
        timestamp: new Date(Date.now() - 75600000),
        sender: firstName,
        sentiment: "positive"
      }
    ],
    "thread-3": [
      {
        id: "msg-3-1",
        threadId: "thread-3",
        direction: "in",
        channel: "voicemail",
        body: `Hi, this is ${firstName}. I got your letter about buying my house at ${address}. I'm going through a divorce and really need to sell quickly. The house is in decent shape but I just need to get out from under it. Please call me back as soon as you can. Thanks.`,
        status: "read",
        timestamp: new Date(Date.now() - 10800000),
        sender: firstName,
        sentiment: "negative",
        attachments: [{ name: "voicemail.mp3", url: "#", type: "audio/mp3", size: "1.2 MB" }]
      },
      {
        id: "msg-3-2",
        threadId: "thread-3",
        direction: "out",
        channel: "sms",
        body: `Hi ${firstName}, I just got your voicemail about ${address}. I understand you're in a difficult situation and need to sell quickly. I can definitely help with a fast cash sale. When would be a good time to talk today?`,
        status: "delivered",
        timestamp: new Date(Date.now() - 9000000),
        sender: "You"
      },
      {
        id: "msg-3-3",
        threadId: "thread-3",
        direction: "in",
        channel: "sms",
        body: "Thank you for getting back to me so quickly. Can you call me now? I really need to get this handled ASAP. My ex wants to list with a realtor but that will take too long.",
        status: "read",
        timestamp: new Date(Date.now() - 8700000),
        sender: firstName,
        sentiment: "negative"
      },
      {
        id: "msg-3-4",
        threadId: "thread-3",
        direction: "out",
        channel: "sms",
        body: "Absolutely, I'll call you right now. We can potentially close in 7-10 days if that helps with your timeline. We handle all the paperwork and can work with both parties to ensure a smooth transaction.",
        status: "delivered",
        timestamp: new Date(Date.now() - 8400000),
        sender: "You"
      },
      {
        id: "msg-3-5",
        threadId: "thread-3",
        direction: "in",
        channel: "sms",
        body: "That would be perfect. 7 days would be ideal. Thank you!",
        status: "read",
        timestamp: new Date(Date.now() - 8100000),
        sender: firstName,
        sentiment: "positive"
      }
    ]
  };
  
  // Return conversation for specific thread or generate a default one
  if (conversations[threadId]) {
    return conversations[threadId];
  }
  
  // Default conversation for other threads
  return [
    {
      id: `msg-${threadId}-1`,
      threadId,
      direction: "out",
      channel: "sms",
      body: `Hi, is this the owner of ${address}? I'm a local real estate investor interested in purchasing your property for cash.`,
      status: "delivered",
      timestamp: new Date(Date.now() - 3600000),
      sender: "You"
    },
    {
      id: `msg-${threadId}-2`,
      threadId,
      direction: "in",
      channel: "sms",
      body: "Yes, this is the owner. Who is this exactly and how did you get my number?",
      status: "read",
      timestamp: new Date(Date.now() - 3300000),
      sender: firstName,
      sentiment: "neutral"
    },
    {
      id: `msg-${threadId}-3`,
      threadId,
      direction: "out",
      channel: "sms",
      body: "I'm with FlipOps Investment Group. We work with local homeowners who are looking to sell quickly for cash. We use public records to identify properties that might be a good fit. Would you be interested in getting a no-obligation cash offer?",
      status: "delivered",
      timestamp: new Date(Date.now() - 3000000),
      sender: "You"
    },
    {
      id: `msg-${threadId}-4`,
      threadId,
      direction: "in",
      channel: "sms",
      body: "Maybe. What kind of offer are we talking about? The house needs some work.",
      status: "read",
      timestamp: new Date(Date.now() - 2700000),
      sender: firstName,
      sentiment: "neutral"
    },
    {
      id: `msg-${threadId}-5`,
      threadId,
      direction: "out",
      channel: "sms",
      body: "We buy houses as-is, so repairs aren't a problem. To give you an accurate offer, I'd need to see the property. We typically offer 70-85% of market value but can close in 7-14 days with no fees or commissions. Would you like to schedule a quick walkthrough?",
      status: "delivered",
      timestamp: new Date(Date.now() - 2400000),
      sender: "You"
    }
  ];
};

// Message templates
const messageTemplates = [
  { id: "1", name: "Initial Outreach", body: "Hi {{firstName}}, I noticed your property at {{address}}. We're local real estate investors and can make you a cash offer with a quick close. Would you be interested in learning more?" },
  { id: "2", name: "Follow Up", body: "Hi {{firstName}}, just following up on my previous message about {{address}}. We can close in as little as 7 days and handle all repairs. When would be a good time to discuss?" },
  { id: "3", name: "Offer Ready", body: "Hi {{firstName}}, great news! We've prepared a cash offer for {{address}}. We can close on your timeline and there are no agent fees or commissions. Can we review the details?" },
];

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageBody, setMessageBody] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<"sms" | "email" | "voicemail">("sms");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showComplianceWarning, setShowComplianceWarning] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  // Advanced filter states
  const [advancedFilters, setAdvancedFilters] = useState({
    channels: [] as string[],
    sentiment: [] as string[],
    stage: [] as string[],
    score: { min: 0, max: 100 },
    unreadOnly: false,
    optedOut: false,
    hasAttachments: false,
    dateRange: "all" as "all" | "today" | "week" | "month",
  });

  useEffect(() => {
    // Initialize with mock data
    setThreads(generateMockThreads());
  }, []);

  useEffect(() => {
    // Load messages when thread is selected
    if (selectedThread) {
      setMessages(generateMockMessages(selectedThread.id));
      // Mark as read
      setThreads(prev => prev.map(t => 
        t.id === selectedThread.id ? { ...t, unreadCount: 0 } : t
      ));
    }
  }, [selectedThread]);

  const sendMessage = () => {
    if ((!messageBody.trim() && attachments.length === 0) || !selectedThread) return;

    // Check compliance
    const currentHour = new Date().getHours();
    if (currentHour < 8 || currentHour > 21) {
      setShowComplianceWarning(true);
      return;
    }

    // Check opt-in status
    if (selectedChannel === "sms" && !selectedThread.optInStatus.sms) {
      toast.error("Contact has opted out of SMS messages");
      return;
    }

    // Create attachment objects if files are selected
    const messageAttachments = attachments.length > 0 
      ? attachments.map(file => ({
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        }))
      : undefined;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      threadId: selectedThread.id,
      direction: "out",
      channel: selectedChannel,
      body: messageBody,
      status: "queued",
      timestamp: new Date(),
      sender: "You",
      attachments: messageAttachments
    };

    setMessages([...messages, newMessage]);
    setMessageBody("");
    setAttachments([]); // Clear attachments after sending
    
    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === newMessage.id ? { ...m, status: "sent" } : m
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === newMessage.id ? { ...m, status: "delivered" } : m
      ));
      toast.success("Message delivered");
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const handleOfferGenerated = (offer: OfferData) => {
    if (!selectedThread) return;
    
    const offerMessage: Message = {
      id: `msg-${Date.now()}`,
      threadId: selectedThread.id,
      direction: "out",
      channel: selectedChannel,
      body: `Cash Offer: $${offer.offerPrice.toLocaleString()} - Closing in ${Math.ceil((offer.closingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`,
      status: "sent",
      timestamp: new Date(),
      sender: "You",
      offer: offer
    };
    
    setMessages([...messages, offerMessage]);
    setShowOfferModal(false);
    
    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === offerMessage.id ? { ...m, status: "delivered" } : m
      ));
    }, 1000);
  };

  const applyTemplate = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template && selectedThread) {
      let body = template.body;
      body = body.replace("{{firstName}}", selectedThread.leadName.split(" ")[0]);
      body = body.replace("{{address}}", selectedThread.leadAddress);
      setMessageBody(body);
      setShowTemplates(false);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return "text-green-500";
      case "negative": return "text-red-500";
      case "neutral": return "text-yellow-500";
      default: return "text-gray-400";
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return <TrendingUp className="h-4 w-4" />;
      case "negative": return <TrendingDown className="h-4 w-4" />;
      case "neutral": return <Minus className="h-4 w-4" />;
      default: return null;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "sms": return <MessageSquare className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "voicemail": return <Voicemail className="h-4 w-4" />;
      default: return null;
    }
  };

  const filteredThreads = threads.filter(thread => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!thread.leadName.toLowerCase().includes(query) &&
          !thread.leadAddress.toLowerCase().includes(query) &&
          !thread.leadId.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Quick filter (dropdown)
    if (filter !== "all") {
      switch (filter) {
        case "unread": 
          if (thread.unreadCount === 0) return false;
          break;
        case "sms": 
          if (!thread.channels.includes("sms")) return false;
          break;
        case "email": 
          if (!thread.channels.includes("email")) return false;
          break;
        case "voicemail": 
          if (!thread.channels.includes("voicemail")) return false;
          break;
        case "positive": 
          if (thread.sentiment !== "positive") return false;
          break;
        case "negative": 
          if (thread.sentiment !== "negative") return false;
          break;
      }
    }

    // Advanced filters
    // Channel filter
    if (advancedFilters.channels.length > 0) {
      const hasChannel = advancedFilters.channels.some(channel => 
        thread.channels.includes(channel)
      );
      if (!hasChannel) return false;
    }

    // Sentiment filter
    if (advancedFilters.sentiment.length > 0) {
      if (!thread.sentiment || !advancedFilters.sentiment.includes(thread.sentiment)) {
        return false;
      }
    }

    // Stage filter
    if (advancedFilters.stage.length > 0) {
      if (!advancedFilters.stage.includes(thread.stage)) {
        return false;
      }
    }

    // Score filter
    if (thread.score < advancedFilters.score.min || thread.score > advancedFilters.score.max) {
      return false;
    }

    // Unread only filter
    if (advancedFilters.unreadOnly && thread.unreadCount === 0) {
      return false;
    }

    // Opted out filter
    if (advancedFilters.optedOut) {
      if (thread.optInStatus.sms && thread.optInStatus.email) {
        return false;
      }
    }

    // Date range filter
    if (advancedFilters.dateRange !== "all") {
      const messageTime = thread.lastMessageTime.getTime();
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      
      switch (advancedFilters.dateRange) {
        case "today":
          if (now - messageTime > dayMs) return false;
          break;
        case "week":
          if (now - messageTime > 7 * dayMs) return false;
          break;
        case "month":
          if (now - messageTime > 30 * dayMs) return false;
          break;
      }
    }

    return true;
  });

  const getActiveFilterCount = () => {
    let count = 0;
    if (filter !== "all") count++;
    if (advancedFilters.channels.length > 0) count++;
    if (advancedFilters.sentiment.length > 0) count++;
    if (advancedFilters.stage.length > 0) count++;
    if (advancedFilters.score.min > 0 || advancedFilters.score.max < 100) count++;
    if (advancedFilters.unreadOnly) count++;
    if (advancedFilters.optedOut) count++;
    if (advancedFilters.dateRange !== "all") count++;
    return count;
  };

  const resetFilters = () => {
    setFilter("all");
    setAdvancedFilters({
      channels: [],
      sentiment: [],
      stage: [],
      score: { min: 0, max: 100 },
      unreadOnly: false,
      optedOut: false,
      hasAttachments: false,
      dateRange: "all",
    });
  };

  return (
    <PreviewModeWrapper
      title="Unified Inbox"
      description="AI-powered messaging hub with sentiment analysis, templates, and multi-channel communication. This feature is under active development."
      expectedRelease="Q1 2025"
    >
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Panel - Thread List */}
      <div className="w-96 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, phone, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-100 dark:bg-gray-900"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Needs Attention</SelectItem>
              </SelectContent>
            </Select>
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Filter className="h-4 w-4" />
                  {getActiveFilterCount() > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Advanced Filters</h4>
                    {getActiveFilterCount() > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="h-auto p-1 text-xs"
                      >
                        Reset all
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Channel Filters */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Channels</Label>
                    <div className="space-y-2">
                      {["sms", "email", "voicemail"].map((channel) => (
                        <div key={channel} className="flex items-center space-x-2">
                          <Checkbox
                            id={`channel-${channel}`}
                            checked={advancedFilters.channels.includes(channel)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  channels: [...prev.channels, channel]
                                }));
                              } else {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  channels: prev.channels.filter(c => c !== channel)
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`channel-${channel}`}
                            className="text-sm font-normal capitalize cursor-pointer"
                          >
                            {channel === "sms" ? "SMS" : channel}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Sentiment Filters */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Sentiment</Label>
                    <div className="space-y-2">
                      {["positive", "neutral", "negative"].map((sentiment) => (
                        <div key={sentiment} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sentiment-${sentiment}`}
                            checked={advancedFilters.sentiment.includes(sentiment)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  sentiment: [...prev.sentiment, sentiment]
                                }));
                              } else {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  sentiment: prev.sentiment.filter(s => s !== sentiment)
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`sentiment-${sentiment}`}
                            className="text-sm font-normal capitalize cursor-pointer"
                          >
                            {sentiment}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Stage Filters */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Lead Stage</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {["New", "Contacted", "Engaged", "Negotiating", "Under Contract", "Won", "Lost"].map((stage) => (
                        <div key={stage} className="flex items-center space-x-2">
                          <Checkbox
                            id={`stage-${stage}`}
                            checked={advancedFilters.stage.includes(stage)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  stage: [...prev.stage, stage]
                                }));
                              } else {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  stage: prev.stage.filter(s => s !== stage)
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`stage-${stage}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {stage}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Score Range */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Lead Score Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={advancedFilters.score.min}
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          score: { ...prev.score, min: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-20 h-8"
                      />
                      <span className="text-sm">to</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={advancedFilters.score.max}
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          score: { ...prev.score, max: parseInt(e.target.value) || 100 }
                        }))}
                        className="w-20 h-8"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Date Range</Label>
                    <Select
                      value={advancedFilters.dateRange}
                      onValueChange={(value: any) => setAdvancedFilters(prev => ({
                        ...prev,
                        dateRange: value
                      }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Other Filters */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Other</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="unread-only"
                          checked={advancedFilters.unreadOnly}
                          onCheckedChange={(checked) => 
                            setAdvancedFilters(prev => ({
                              ...prev,
                              unreadOnly: checked as boolean
                            }))
                          }
                        />
                        <Label
                          htmlFor="unread-only"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Unread messages only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="opted-out"
                          checked={advancedFilters.optedOut}
                          onCheckedChange={(checked) => 
                            setAdvancedFilters(prev => ({
                              ...prev,
                              optedOut: checked as boolean
                            }))
                          }
                        />
                        <Label
                          htmlFor="opted-out"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Show opted-out only
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      {filteredThreads.length} of {threads.length} conversations shown
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Thread List */}
        <ScrollArea className="flex-1 overflow-y-auto">
          {filteredThreads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className={cn(
                "p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors",
                selectedThread?.id === thread.id && "bg-gray-50 dark:bg-gray-750"
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {thread.leadName}
                    </span>
                    {thread.unreadCount > 0 && (
                      <Badge variant="default" className="bg-blue-500 text-white text-xs">
                        {thread.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {thread.leadAddress}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {thread.sentiment && (
                    <span className={getSentimentColor(thread.sentiment)}>
                      {getSentimentIcon(thread.sentiment)}
                    </span>
                  )}
                  {thread.channels.map(channel => (
                    <span key={channel} className="text-gray-400">
                      {getChannelIcon(channel)}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {thread.lastMessage}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {new Date(thread.lastMessageTime).toLocaleString()}
              </p>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Center Panel - Conversation */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedThread.leadName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedThread.leadAddress} • Lead {selectedThread.leadId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedThread.stage}</Badge>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.direction === "out" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        message.direction === "out"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs opacity-75">
                          {getChannelIcon(message.channel)}
                        </span>
                        <span className="text-xs opacity-75">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.direction === "out" && (
                          <span className="text-xs opacity-75">
                            {message.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                            {message.status === "sent" && <Check className="h-3 w-3" />}
                            {message.status === "failed" && <AlertCircle className="h-3 w-3" />}
                          </span>
                        )}
                        {message.sentiment && (
                          <span className={cn("text-xs", getSentimentColor(message.sentiment))}>
                            {getSentimentIcon(message.sentiment)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{message.body}</p>
                      {message.offer && (
                        <div className="mt-3">
                          <OfferWidget 
                            offer={message.offer}
                            onViewDetails={() => {
                              console.log('View offer details:', message.offer);
                            }}
                            onAccept={() => {
                              console.log('Accept offer:', message.offer);
                            }}
                            onReject={() => {
                              console.log('Reject offer:', message.offer);
                            }}
                            onCounter={() => {
                              console.log('Counter offer:', message.offer);
                            }}
                          />
                        </div>
                      )}
                      {message.attachments && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs opacity-75">
                              <Paperclip className="h-3 w-3" />
                              <span>{attachment.name}</span>
                              <span>({attachment.size})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Composer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              {/* Compliance Warning */}
              {showComplianceWarning && (
                <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        Outside Business Hours
                      </p>
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                        It's currently outside of business hours (8 AM - 9 PM). Are you sure you want to send this message?
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowComplianceWarning(false);
                            sendMessage();
                          }}
                        >
                          Send Anyway
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowScheduler(true)}
                        >
                          Schedule for Later
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowComplianceWarning(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <Select value={selectedChannel} onValueChange={(v: any) => setSelectedChannel(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        SMS
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="voicemail">
                      <div className="flex items-center gap-2">
                        <Voicemail className="h-4 w-4" />
                        Voicemail
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowScheduler(!showScheduler)}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
                />
              </div>

              {/* Template Picker */}
              {showTemplates && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Templates</p>
                  <div className="space-y-2">
                    {messageTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template.id)}
                        className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {template.body}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachment Preview */}
              {attachments.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Attachments ({attachments.length})
                  </p>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-gray-500 dark:text-gray-400">
                            {getFileIcon(file)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="flex-1 min-h-[80px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) {
                      sendMessage();
                    }
                  }}
                />
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={sendMessage}
                    disabled={!messageBody.trim() && attachments.length === 0}
                    className="h-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Press Cmd+Enter to send
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* Right Panel - Lead Context */}
      {selectedThread && (
        <div className="w-80 flex flex-col gap-4">
          {/* Lead Summary */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-900 dark:text-white">Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-bold",
                    selectedThread.score >= 80 ? "text-green-500" :
                    selectedThread.score >= 60 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {selectedThread.score}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {selectedThread.stage}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tags & Signals</p>
                <div className="flex flex-wrap gap-1">
                  {selectedThread.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedThread.phoneNumbers[0]}
                  </span>
                  <Badge 
                    variant={selectedThread.optInStatus.sms ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {selectedThread.optInStatus.sms ? "Opted In" : "Opted Out"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedThread.emails[0]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedThread.leadAddress}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-900 dark:text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">SMS sent</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">Positive response</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">3 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-2 w-2 bg-gray-400 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">Lead created</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Actions */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-900 dark:text-white">Next Actions</CardTitle>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Schedule Follow-up Call
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setShowOfferModal(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Offer
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Enroll in Cadence
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Generate Offer Modal */}
      <GenerateOfferModal
        open={showOfferModal}
        onOpenChange={setShowOfferModal}
        leadInfo={selectedThread ? {
          name: selectedThread.leadName,
          address: selectedThread.leadAddress,
          leadId: selectedThread.leadId
        } : null}
        onOfferGenerated={handleOfferGenerated}
      />
    </div>
    </PreviewModeWrapper>
  );
}