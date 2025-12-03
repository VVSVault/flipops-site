"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { QuickAddLead } from "@/app/components/quick-add-lead";
import {
  Home,
  Users,
  Building,
  MessageSquare,
  Megaphone,
  Calculator,
  UserCheck,
  CheckSquare,
  Briefcase,
  FileText,
  BarChart,
  Database,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  LayoutDashboard,
  FileSignature,
  Hammer,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { ErrorBoundary } from "@/app/components/error-boundary";
import {
  filterNavigationByInvestorType,
  NAVIGATION_RULES,
  type InvestorType,
  type NavigationItem
} from "@/lib/navigation-config";

const PANELS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DATASOURCE_PANELS === "1";

const baseNavigation: NavigationItem[] = [
  { name: "Overview", href: "/app", icon: Home },
  { name: "Leads", href: "/app/leads", icon: Users },
  { name: "Inbox", href: "/app/inbox", icon: MessageSquare },
  { name: "Campaigns", href: "/app/campaigns", icon: Megaphone },
  { name: "Underwriting", href: "/app/underwriting", icon: Calculator },
  { name: "Contracts", href: "/app/contracts", icon: FileSignature },
  { name: "Buyers", href: "/app/buyers", icon: UserCheck, visibleTo: NAVIGATION_RULES['Buyers'] },
  { name: "Renovations", href: "/app/renovations", icon: Hammer, visibleTo: NAVIGATION_RULES['Renovations'] },
  { name: "Rentals", href: "/app/rentals", icon: Building2, visibleTo: NAVIGATION_RULES['Rentals'] },
  { name: "Tasks", href: "/app/tasks", icon: CheckSquare },
  { name: "Vendors", href: "/app/vendors", icon: Briefcase },
  { name: "Documents", href: "/app/documents", icon: FileText },
  { name: "Analytics", href: "/app/analytics", icon: BarChart },
  { name: "Data Sources", href: "/app/data-sources", icon: Database },
];

// Add panels link if feature flag is enabled
if (PANELS_ENABLED) {
  baseNavigation.push({
    name: "Panel APIs",
    href: "/app/data-sources/panels",
    icon: LayoutDashboard,
    indent: true
  });
}

baseNavigation.push({ name: "Settings", href: "/app/settings", icon: Settings });

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddLeadOpen, setQuickAddLeadOpen] = useState(false);
  const [investorType, setInvestorType] = useState<InvestorType>(null);
  const [navigation, setNavigation] = useState<NavigationItem[]>(baseNavigation);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent SSR of Clerk components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch user profile to get investor type
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          const userInvestorType = data.user?.investorType as InvestorType;
          setInvestorType(userInvestorType);

          // Filter navigation based on investor type
          const filteredNav = filterNavigationByInvestorType(baseNavigation, userInvestorType);
          setNavigation(filteredNav);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // On error, show all navigation items
        setNavigation(baseNavigation);
      }
    };

    fetchUserProfile();
  }, []);

  // Don't render layout until mounted to prevent Clerk SSR errors
  if (!isMounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transform transition-transform lg:transform-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
            <Link href="/app" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                FlipOps
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/app" && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    (item as any).indent && "ml-6",
                    isActive
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              {/* Temporarily disabled - debugging Clerk issues */}
              {/* {isMounted && <UserButton afterSignOutUrl="/" />} */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Account</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Manage your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="flex-1 flex items-center gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search leads, properties, owners..."
                className="pl-10 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-blue-500 rounded-full" />
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setQuickAddLeadOpen(true)}
            >
              Quick Add Lead
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 min-h-[calc(100vh-4rem)]">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6 px-6 mt-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <p>© 2025 FlipOps. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 text-center sm:text-left">
            FlipOps does not provide investment, legal, or financial advice.
            All calculations are estimates. Consult professionals before making investment decisions.
          </p>
        </footer>
      </div>

      {/* Quick Add Lead Modal */}
      <QuickAddLead
        open={quickAddLeadOpen}
        onOpenChange={setQuickAddLeadOpen}
      />
    </div>
  );
}