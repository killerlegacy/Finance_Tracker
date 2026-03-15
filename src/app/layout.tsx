import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinanceFlow — Personal Finance Tracker',
  description: 'Track income, expenses, budgets and subscriptions. Free, private, works offline.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
