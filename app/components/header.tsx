'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/app/components/theme-toggle';

const navItems = [
  { href: '#deal-flow', label: 'Deal Flow' },
  { href: '#operations', label: 'Operations' },
  { href: '#roi-calculator', label: 'ROI Calculator' },
  { href: '#case-study', label: 'Case Study' },
  { href: '#process', label: 'Process' },
  { href: '#faqs', label: 'FAQs' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-zinc-800/95 backdrop-blur-md border-b border-zinc-700'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FlipOps
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className={`text-sm font-medium transition-colors ${
                  isScrolled
                    ? 'text-gray-300 hover:text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="outline" className={`ml-4 ${isScrolled ? 'border-zinc-600 text-white hover:bg-zinc-700' : ''}`} size="sm">
                Login
              </Button>
            </Link>
            <Button className="ml-2" size="sm">
              Book Audit
            </Button>
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => scrollToSection(e, item.href)}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link href="/sign-in" className="w-full">
                  <Button variant="outline" className="mt-4 w-full">Login</Button>
                </Link>
                <Button className="mt-2 w-full">Book Audit</Button>
              </nav>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}