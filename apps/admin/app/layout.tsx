import type { Metadata } from 'next';
import { I18nProvider } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'TourGuide Admin',
  description: 'Certified tour guide marketplace — admin portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // lang/dir are switched on the client by I18nProvider once the saved locale is known.
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
