

-- Insert admin user
INSERT INTO users (
  name, email, password_hash, contact, address, user_role, account_status, email_verified, created_at, updated_at
) VALUES (
  'Ryan Koo',
  'weifeng2604@gmail.com',
  '$2b$10$oPGNfpkffhwXrBTWQMYVtuWhIb9TOe6KxVhOIuZh.nLZe2QdG2J1y', -- hash of P@ssw0rd
  '+6598009800',
  'Blk 567 Street 52, #10-152',
  'admin',
  'active',
  false,
  NOW(),
  NOW()
);

-- Insert deleted normal user
INSERT INTO users (
  name, email, password_hash, address, user_role, account_status, email_verified, created_at, updated_at
) VALUES (
  'Ryan Koo',
  'weifeng2699@gmail.com',
  '$2b$10$rBVNo09lwIsVtFDnIQL.c.RHIwct2gf9P4X6LxPlAGNtmySOBdF9K', -- hash of P@ssw0rd
  '+6598009800',
  'Blk 567 Street 52, #10-152',
  'user',
  'inactive',
  false,
  NOW(),
  NOW()
);
