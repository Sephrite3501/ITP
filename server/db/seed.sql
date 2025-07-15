

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

INSERT INTO users (
  name, email, password_hash, contact, address, user_role, role, account_status, email_verified, created_at, updated_at
) VALUES (
  'shawn',
  'sscoconut123@gmail.com',
  '$2b$12$wTjVsyFgQiX9/hJ1s5fTxe0LQx3EFw7FvlIJV05pxg7QDGZDT/QeW', -- hash of P@ssw0rd
  '+65',
  '',
  'admin',
  'Committee Member',
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
INSERT INTO site_content (
  carousel,
  intro,
  vision,
  mission,
  community,
  updated_at
) VALUES (
  -- 1) Carousel image paths (must match your /assets proxy paths)
  '["/assets/SIT1.jpg","/assets/SIT2.jpg","/assets/SIT3.jpg","/assets/SIT4.jpeg"]'::jsonb,

  -- 2) Intro block (title + HTML body)
  '{
     "title": "Welcome! 欢迎!",
     "body": "International Researchers Club (IRC) was established in 2001 with the vision to create a vibrant and innovative research community for Singapore. IRC also organizes the IRC-SET conference, an annual event which provides a platform for young and talented researchers to share fresh results, obtain comments, and exchange innovative ideas in multi-disciplinary areas."
   }'::jsonb,

  -- 3) Vision text
  'To create a vibrant and innovative researcher community for Singapore',

  -- 4) Mission text
  'To organize events and provide a platform for young researchers to share, learn, and collaborate across disciplines',

  -- 5) Community cards (array of title/body objects)
  '[
     { "title": "NETWORKING",       "body": "Build network with young and senior researchers in various research areas." },
     { "title": "INTEREST SHARING", "body": "Share your interest in research with a community who knows how to appreciate." },
     { "title": "IDEAS EXCHANGING", "body": "Expose and learn latest and new research studies, innovations at our research conference." }
   ]'::jsonb,

  -- updated_at timestamp (optional—will default to NOW() if omitted)
  NOW()
);
