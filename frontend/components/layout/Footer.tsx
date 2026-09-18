'use client';

import Link from 'next/link';
import { BRAND, FOOTER_LINKS } from '@/lib/constants';

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-forest text-white pb-20 lg:pb-0" role="contentinfo">
      {/* Gold line separator */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="container-main py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="font-heading font-bold text-2xl mb-3">
              <span className="text-white">KSN</span>{' '}
              <span className="text-gold">AAHAAR</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4 font-body italic">
              {BRAND.tagline}
            </p>
            <p className="text-white/50 text-xs leading-relaxed">
              Home Cloud Kitchen — Authentic home-style food prepared with love, care, and the finest ingredients, delivered fresh to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gold mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-gold text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gold mb-4">
              Policies
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-gold text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gold mb-4">
              Contact Us
            </h3>
            <div className="space-y-3">
              <a
                href={`tel:${BRAND.phone}`}
                className="flex items-center gap-3 text-white/70 hover:text-gold text-sm transition-colors"
              >
                <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                {BRAND.phone}
              </a>
              <a
                href={`mailto:${BRAND.email}`}
                className="flex items-center gap-3 text-white/70 hover:text-gold text-sm transition-colors"
              >
                <MailIcon className="w-4 h-4 flex-shrink-0" />
                {BRAND.email}
              </a>
              <div className="flex items-start gap-3 text-white/70 text-sm">
                <MapPinIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{BRAND.location}</span>
              </div>
            </div>

            {/* Social Placeholders */}
            <div className="flex gap-3 mt-6">
              {['Instagram', 'Facebook', 'WhatsApp'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold/20 flex items-center justify-center text-white/70 hover:text-gold transition-all text-xs font-bold"
                  aria-label={social}
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} KSN AAHAAR. All rights reserved.
          </p>
          <p className="text-white/40 text-xs">
            Created by{' '}
            <a
              href="https://gdc-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold/80 font-semibold transition-colors duration-200 underline underline-offset-2"
            >
              GORANTLA DURGA CHAND
            </a>
          </p>
          <p className="text-white/30 text-xs">
            Miyapur, Hyderabad, Telangana
          </p>
        </div>
      </div>
    </footer>
  );
}
