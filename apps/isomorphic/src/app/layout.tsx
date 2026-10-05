import { Toaster } from 'react-hot-toast';
import { Toaster as SonnerToaster } from 'sonner';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import EnhancedAuthProvider from '@/providers/auth-provider';
import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { SessionWarningModal } from '@/components/auth/SessionWarningModal';
import GlobalDrawer from '@/app/shared/drawer-views/container';
import GlobalModal from '@/app/shared/modal-views/container';
import { JotaiProvider } from '@/app/shared/jotai-provider';
import { siteConfig } from '@/config/site.config';
import { inter, lexendDeca } from '@/app/fonts';
import cn from '@core/utils/class-names';
import NextProgress from '@core/components/next-progress';

// styles
import 'swiper/css';
import 'swiper/css/navigation';
import '@/app/globals.css';
// import 'react-calendar/dist/Calendar.css';

export const metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/logo-short-light.png', type: 'image/png' },
    ],
    shortcut: [{ url: '/logo-short-light.png', type: 'image/png' }],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html
      lang="en"
      dir="ltr"
      // required this one for next-themes, remove it if you are not using next-theme
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend+Deca:wght@400;500;600;700&family=Russo+One&family=Instrument+Serif&family=Playfair+Display:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        // to prevent any warning that is caused by third party extensions like Grammarly
        suppressHydrationWarning
        className={cn(inter.variable, lexendDeca.variable, 'font-inter')}
      >
        <AuthErrorBoundary>
          <EnhancedAuthProvider session={session}>
            <NextProgress />
            <JotaiProvider>
              {children}
              <Toaster />
              <SonnerToaster position="top-right" richColors />
              <SessionWarningModal />
              <GlobalDrawer />
              <GlobalModal />
            </JotaiProvider>
          </EnhancedAuthProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
