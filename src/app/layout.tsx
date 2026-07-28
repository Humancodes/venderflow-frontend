import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { AppChrome } from '@/components/AppChrome';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'VendorFlow',
  description: 'Multi-tenant vendor onboarding',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>
            <AppChrome>{children}</AppChrome>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
