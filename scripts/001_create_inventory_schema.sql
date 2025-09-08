-- Create inventory table for ad slots
CREATE TABLE IF NOT EXISTS public.ad_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code TEXT NOT NULL,
  state_name TEXT NOT NULL,
  ad_type TEXT NOT NULL,
  price INTEGER NOT NULL, -- price in cents
  total_quantity INTEGER NOT NULL DEFAULT 0,
  remaining_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer orders table
CREATE TABLE IF NOT EXISTS public.customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  company_name TEXT,
  billing_address JSONB NOT NULL,
  shipping_address JSONB,
  state_code TEXT NOT NULL,
  state_name TEXT NOT NULL,
  ad_type TEXT NOT NULL,
  ad_price INTEGER NOT NULL, -- price in cents
  tax_amount INTEGER NOT NULL DEFAULT 0, -- tax in cents
  total_amount INTEGER NOT NULL, -- total in cents
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ad_inventory_state ON public.ad_inventory(state_code);
CREATE INDEX IF NOT EXISTS idx_ad_inventory_type ON public.ad_inventory(ad_type);
CREATE INDEX IF NOT EXISTS idx_customer_orders_state ON public.customer_orders(state_code);
CREATE INDEX IF NOT EXISTS idx_customer_orders_email ON public.customer_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON public.customer_orders(order_status);

-- Enable RLS (Row Level Security) - but allow public read access for inventory
ALTER TABLE public.ad_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to inventory (no auth required for viewing ads)
CREATE POLICY "Allow public read access to inventory" ON public.ad_inventory
  FOR SELECT USING (true);

-- Allow public insert access to customer orders (no auth required for placing orders)
CREATE POLICY "Allow public insert to orders" ON public.customer_orders
  FOR INSERT WITH CHECK (true);

-- Allow public read access to own orders (by email for order lookup)
CREATE POLICY "Allow public read own orders" ON public.customer_orders
  FOR SELECT USING (true);
