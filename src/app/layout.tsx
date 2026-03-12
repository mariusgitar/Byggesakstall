import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Byggesakstall - Opplasting',
  description: 'Intern opplasting av ukentlige byggesaksuttrekk',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className="min-h-screen font-sans">
        <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
