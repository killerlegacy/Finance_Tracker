export const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Housing: '🏠',
  Utilities: '💡',
  Shopping: '🛍️',
  Health: '💊',
  Entertainment: '🎬',
  Education: '📚',
  Family: '👨‍👩‍👧',
  Miscellaneous: '📦',
  Salary: '💼',
  Freelance: '💻',
  Business: '🏢',
  Investment: '📈',
  Rental: '🏘️',
  'Side Hustle': '🎯',
  Gift: '🎁',
  Other: '📦',
};

export const ACCOUNT_ICONS: Record<string, string> = {
  Cash: '💵',
  Bank: '🏦',
  'Credit Card': '💳',
  'Digital Wallet': '📱',
  Savings: '🐷',
  'Investment Account': '📈',
};

export const CURRENCIES = [
  { value: '₨', label: 'Pakistan (₨)' },
  { value: '$', label: 'United States ($)' },
  { value: '€', label: 'Euro (€)' },
  { value: '£', label: 'British Pound (£)' },
  { value: '₹', label: 'India (₹)' },
  { value: '৳', label: 'Bangladesh (৳)' },
  { value: '¥', label: 'Japan/China (¥)' },
  { value: '₪', label: 'Israel (₪)' },
  { value: '₩', label: 'South Korea (₩)' },
  { value: '฿', label: 'Thailand (฿)' },
  { value: '₱', label: 'Philippines (₱)' },
  { value: '₦', label: 'Nigeria (₦)' },
  { value: 'R$', label: 'Brazil (R$)' },
  { value: 'CAD', label: 'Canada (CAD)' },
  { value: 'AUD', label: 'Australia (AUD)' },
  { value: 'SGD', label: 'Singapore (SGD)' },
  { value: 'SAR', label: 'Saudi Arabia (SAR)' },
];

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Shopping',
  'Health',
  'Entertainment',
  'Education',
  'Family',
  'Miscellaneous',
];

export const INCOME_SOURCES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Rental',
  'Side Hustle',
  'Gift',
  'Other',
];

export const ACCOUNT_TYPES = ['Cash', 'Bank', 'Credit Card', 'Digital Wallet', 'Savings', 'Investment Account'];

export const COUNTRIES = [
  { value: 'Pakistan', label: '🇵🇰 Pakistan' },
  { value: 'United States', label: '🇺🇸 United States' },
  { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
  { value: 'India', label: '🇮🇳 India' },
  { value: 'Bangladesh', label: '🇧🇩 Bangladesh' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Australia', label: '🇦🇺 Australia' },
  { value: 'Germany', label: '🇩🇪 Germany' },
  { value: 'France', label: '🇫🇷 France' },
  { value: 'Japan', label: '🇯🇵 Japan' },
  { value: 'Singapore', label: '🇸🇬 Singapore' },
  { value: 'United Arab Emirates', label: '🇦🇪 United Arab Emirates' },
  { value: 'Saudi Arabia', label: '🇸🇦 Saudi Arabia' },
  { value: 'Brazil', label: '🇧🇷 Brazil' },
  { value: 'Mexico', label: '🇲🇽 Mexico' },
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatCurrency(amount: number, currency: string): string {
  return currency + Math.abs(amount).toLocaleString();
}

export function getCurrentMonthYear(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
