-- Restore NOT NULL constraints (only safe if no null values exist)
UPDATE user_bindings ub
SET provider_user_id = ui.provider_user_id,
    provider_username = ui.provider_username
FROM user_identities ui
WHERE ui.user_id = ub.id AND ui.provider = 'github'
  AND ub.provider_user_id IS NULL;

ALTER TABLE user_bindings
  ALTER COLUMN provider_user_id SET NOT NULL,
  ALTER COLUMN provider_username SET NOT NULL;

DROP TABLE IF EXISTS user_identities;
