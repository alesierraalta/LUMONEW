import {cookies} from 'next/headers';

const defaultLocale = 'es';
const locales = ['en', 'es'] as const;

export type Locale = typeof locales[number];

export async function getUserLocale(): Promise<Locale> {
  // Get locale from cookies
  const cookieStore = cookies();
  const locale = cookieStore.get('locale')?.value;
  
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  
  return defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  const cookieStore = cookies();
  cookieStore.set('locale', locale);
}