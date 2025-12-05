import Link from 'next/link';
import { Mail, Phone, Linkedin, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'FlipOps';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-900 border-t border-zinc-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              {brandName}
            </h3>
            <p className="text-gray-400 mb-4">
              Automation for Flippers & Investors — more deals in, less cash burned during rehab.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#deal-flow" className="text-gray-400 hover:text-white transition-colors">
                  Deal Flow
                </Link>
              </li>
              <li>
                <Link href="#operations" className="text-gray-400 hover:text-white transition-colors">
                  Operations
                </Link>
              </li>
              <li>
                <Link href="#roi-calculator" className="text-gray-400 hover:text-white transition-colors">
                  ROI Calculator
                </Link>
              </li>
              <li>
                <Link href="#case-study" className="text-gray-400 hover:text-white transition-colors">
                  Case Studies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:hello@flipops.io"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  hello@flipops.io
                </a>
              </li>
              <li>
                <a
                  href="tel:+15555551234"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  (555) 555-1234
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} {brandName}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}