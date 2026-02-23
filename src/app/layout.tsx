import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppContextProvider } from '@/context/AppContext';
import Navbar from '@/components/layout/Navbar';
import DevTierSwitcher from '@/components/shared/DevTierSwitcher';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'keySkillset',
  description: 'Gamified exam-prep assessment platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppContextProvider>
          <Navbar />
          {children}
          <DevTierSwitcher />
        </AppContextProvider>
      </body>
    </html>
  );
}
