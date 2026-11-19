-- Default test users
-- username: test
-- password: password
--
-- email: test@example.com

-- To connect to the db while Docker is running, do:
-- `docker compose exec db psql -U postgres -d study_sprout`
INSERT INTO users (username, email, password_hash) VALUES
('test', 'test@example.com', '$argon2id$v=19$m=65536,t=3,p=4$YrOCcKksCcExxDhW/Uue6g$8Wfp28hZQ+dxaGM6mVN5UHqYzYsMpiNatW5F3nAKGlc');