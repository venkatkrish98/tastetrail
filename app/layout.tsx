import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'TasteTrail | Cultural Outing Agent with Qloo Cultural Intelligence',
  description:
    'TasteTrail turns your favorite cultural anchors (films, music, literature, culinary craft) into practical, beautifully paced city outings using Qloo cultural intelligence and deterministic mobility constraints.',
  keywords: [
    'Qloo',
    'Qloo Hackathon',
    'Taste AI',
    'Cultural Intelligence',
    'Itinerary Planner',
    'Cultural Discovery',
    'Agentic AI',
  ],
  authors: [{ name: 'TasteTrail Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
