import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Контур ТЗ — проверка закупочной документации',
  description: 'Проверка технических заданий: от фрагмента документа к обоснованному замечанию.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
