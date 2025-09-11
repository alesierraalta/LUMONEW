import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {AuthProvider} from '@/lib/auth/auth-context';
import {ThemeProvider} from '@/lib/contexts/theme-context';
import {ProtectedLayout} from '@/components/layout/protected-layout';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import ErrorBoundary from '@/components/error-boundary';
import { getServerAuth } from '@/lib/auth/server-auth';

export default async function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  // Validate that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Get server-side auth state for better synchronization
  const serverAuth = await getServerAuth();
  
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider initialAuth={serverAuth}>
            <ProtectedLayout>
              {children}
            </ProtectedLayout>
          </AuthProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}