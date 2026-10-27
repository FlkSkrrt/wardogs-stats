import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WARDOGS Stats',
  description: 'Historical combat tracking platform for WARDOGS communities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
