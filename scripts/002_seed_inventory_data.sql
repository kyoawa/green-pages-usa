-- Seed initial inventory data for all states and ad types
INSERT INTO public.ad_inventory (state_code, state_name, ad_type, price, total_quantity, remaining_quantity) VALUES
-- Montana
('MT', 'Montana', 'Single Slot Listing', 30000, 50, 47), -- $300.00
('MT', 'Montana', '1/4 Page Advertorial', 100000, 20, 18), -- $1000.00
('MT', 'Montana', '1/2 Page Advertorial', 180000, 15, 13), -- $1800.00
('MT', 'Montana', 'Full Page Ad', 250000, 10, 8), -- $2500.00

-- California
('CA', 'California', 'Single Slot Listing', 30000, 100, 89),
('CA', 'California', '1/4 Page Advertorial', 100000, 50, 42),
('CA', 'California', '1/2 Page Advertorial', 180000, 30, 26),
('CA', 'California', 'Full Page Ad', 250000, 20, 17),

-- Oklahoma
('OK', 'Oklahoma', 'Single Slot Listing', 30000, 40, 38),
('OK', 'Oklahoma', '1/4 Page Advertorial', 100000, 15, 12),
('OK', 'Oklahoma', '1/2 Page Advertorial', 180000, 10, 9),
('OK', 'Oklahoma', 'Full Page Ad', 250000, 8, 6),

-- Missouri
('MO', 'Missouri', 'Single Slot Listing', 30000, 60, 55),
('MO', 'Missouri', '1/4 Page Advertorial', 100000, 25, 21),
('MO', 'Missouri', '1/2 Page Advertorial', 180000, 18, 15),
('MO', 'Missouri', 'Full Page Ad', 250000, 12, 10),

-- Illinois
('IL', 'Illinois', 'Single Slot Listing', 30000, 80, 73),
('IL', 'Illinois', '1/4 Page Advertorial', 100000, 35, 29),
('IL', 'Illinois', '1/2 Page Advertorial', 180000, 25, 22),
('IL', 'Illinois', 'Full Page Ad', 250000, 15, 12),

-- New York
('NY', 'New York', 'Single Slot Listing', 30000, 120, 98),
('NY', 'New York', '1/4 Page Advertorial', 100000, 60, 48),
('NY', 'New York', '1/2 Page Advertorial', 180000, 40, 33),
('NY', 'New York', 'Full Page Ad', 250000, 25, 19);
