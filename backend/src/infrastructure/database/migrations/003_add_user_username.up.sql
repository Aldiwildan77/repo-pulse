ALTER TABLE users ADD COLUMN username varchar(255);

-- Backfill from existing identities (pick first non-null provider_username)
UPDATE users SET username = sub.provider_username
FROM (
  SELECT DISTINCT ON (user_id) user_id, provider_username
  FROM user_identities
  WHERE provider_username IS NOT NULL
  ORDER BY user_id, created_at ASC
) sub
WHERE users.id = sub.user_id AND users.username IS NULL;
