import type { Metadata } from 'next';
import './globals.css';
import { PreferencesProvider, preferenceBootstrap } from '@/components/preferences';
export const metadata: Metadata = {
  title: 'Контур ТЗ — проверка закупочной документации',
  description: 'Проверка технических заданий: от фрагмента документа к обоснованному замечанию.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-theme="light" data-text-size="standard" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceBootstrap }} />
      </head>
      <body>
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
