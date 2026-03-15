export type RecordType = 'expense' | 'income' | 'account' | 'budget' | 'subscription' | 'profile';

export interface BaseRecord {
  id: string;
  type: RecordType;
  created_at: string;
}

export interface Transaction extends BaseRecord {
  type: 'expense' | 'income';
  date: string;
  amount: number;
  category: string;
  source: string;
  account: string;
  notes: string;
}

export interface Account extends BaseRecord {
  type: 'account';
  service_name: string;
  category: string;
  amount: number;
}

export interface Budget extends BaseRecord {
  type: 'budget';
  category: string;
  amount: number;
}

export interface Subscription extends BaseRecord {
  type: 'subscription';
  service_name: string;
  amount: number;
  billing_cycle: 'Monthly' | 'Yearly' | 'Weekly';
  next_billing_date: string;
  category: string;
}

export interface Profile extends BaseRecord {
  type: 'profile';
  full_name: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  monthly_income: string;
  financial_goal: string;
  onboarding_complete: boolean;
}

export type AnyRecord = Transaction | Account | Budget | Subscription | Profile;

export type TabType = 'dashboard' | 'transactions' | 'accounts' | 'budgets' | 'subscriptions' | 'profile';

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  created_at: string;
}

export interface AuthSession {
  user_id: string;
  email: string;
  full_name: string;
  expires_at: string;
}
