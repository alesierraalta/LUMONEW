'use server';

import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';

export async function setLocale(locale: string) {
  cookies().set('locale', locale);
  redirect(`/${locale}`);
}