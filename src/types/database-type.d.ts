export interface User {
  user_id: number;
  full_name: string;
  business_name: string;
  phone: string;
  email: string | null;
  password_hash: string;
  created_at: string;
}

export interface Category {
  category_id: number;
  user_id: number;
  name: string;
}

export interface Product {
  product_id: number;
  user_id: number;
  category_id: number | null;
  name: string;
  unit_price: number;
  is_active: boolean;
  created_at: string;
}

export interface DailySession {
  session_id: number;
  user_id: number;
  session_date: string;
  opening_capital: number;
  total_revenue: number;
  transaction_count: number;
  status: string;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
}

export interface SalesTransaction {
  transaction_id: number;
  session_id: number;
  created_at: string;
  payment_method: string;
  total_amount: number;
  note: string | null;
}

export interface SaleItem {
  sale_item_id: number;
  transaction_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number | null;
}
