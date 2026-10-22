export interface User {
  user_id: number; // int8, NOT NULL
  full_name: string; // varchar, NOT NULL
  business_name: string; // varchar, NOT NULL
  phone: string; // varchar, NOT NULL
  email: string | null; // varchar, NULLABLE
  password_hash: string; // text, NOT NULL
  created_at: string; // timestamptz, NOT NULL
}

export interface Product {
  product_id: number; // int8, NOT NULL
  user_id: number; // int8, NOT NULL
  category_id: number | null; // int4, NULLABLE
  name: string; // varchar, NOT NULL
  created_at: string; // timestamptz, NOT NULL
}

export interface DailySession {
  session_id: number; // int8, NOT NULL
  user_id: number; // int8, NOT NULL
  session_date: string; // date, NOT NULL
  opening_capital: number; // numeric, NOT NULL
  total_revenue: number; // numeric, NOT NULL
  transaction_count: number; // int4, NOT NULL
  status: string; // varchar, NOT NULL
  opened_at: string; // timestamptz, NOT NULL
  closed_at: string | null; // timestamptz, NULLABLE
  notes: string | null; // text, NULLABLE
}

export interface SaleItem {
  sale_item_id: number; // int8, NOT NULL
  product_id: number; // int8, NOT NULL
  session_id: number; // int8, NOT NULL
  unit_price: number; // numeric, NOT NULL
}
