import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import CustomerShell from '@/components/layout/CustomerShell';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'KSN AAHAAR — Taste the Warmth of Home, Delivered Fresh',
    template: '%s | KSN AAHAAR',
  },
  description:
    'Order authentic homemade food from KSN AAHAAR, a home cloud kitchen in Miyapur, Hyderabad. Biriyanis, curries, sweets, and snacks — prepared with love, delivered fresh.',
  keywords: [
    'KSN AAHAAR',
    'cloud kitchen Miyapur',
    'home food Miyapur',
    'biryani Miyapur',
    'homemade food Hyderabad',
    'Andhra food Miyapur',
    'traditional Indian food Hyderabad',
    'home cloud kitchen',
    'online food order Miyapur',
  ],
  authors: [{ name: 'KSN AAHAAR' }],
  openGraph: {
    title: 'KSN AAHAAR — Taste the Warmth of Home, Delivered Fresh',
    description:
      'Authentic homemade food from Miyapur, Hyderabad. Biriyanis, curries, sweets, and snacks prepared with love.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'KSN AAHAAR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KSN AAHAAR — Taste the Warmth of Home',
    description:
      'Authentic homemade food delivered fresh from Miyapur, Hyderabad.',
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ksnaahaar.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <head>
        {/* Local Business Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              name: 'KSN AAHAAR',
              description: 'Home Cloud Kitchen serving authentic homemade Indian food in Miyapur, Hyderabad.',
              url: 'https://ksnaahaar.com',
              telephone: '+91 79938 77507',
              email: 'order@ksnaahaar.com',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Miyapur',
                addressRegion: 'Telangana',
                addressCountry: 'IN',
              },
              servesCuisine: ['Indian', 'Andhra', 'Hyderabadi', 'South Indian'],
              priceRange: '₹₹',
              hasMenu: 'https://ksnaahaar.com/menu',
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-body bg-cream text-neutral-800">
        <AuthProvider>
          <CartProvider>
            <CustomerShell>{children}</CustomerShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
