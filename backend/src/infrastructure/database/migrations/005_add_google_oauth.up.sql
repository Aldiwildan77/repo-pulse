CREATE TABLE user_identities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user_bindings(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_username VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

-- Migrate existing GitHub data from user_bindings into user_identities
INSERT INTO user_identities (user_id, provider, provider_user_id, provider_username)
SELECT id, 'github', provider_user_id, provider_username
FROM user_bindings
WHERE provider_user_id IS NOT NULL;

CREATE INDEX idx_user_identities_user_id ON user_identities (user_id);
CREATE INDEX idx_user_identities_provider_username ON user_identities (provider, provider_username);

-- Make old columns nullable (kept for backward compat, canonical data now in user_identities)
ALTER TABLE user_bindings
  ALTER COLUMN provider_user_id DROP NOT NULL,
  ALTER COLUMN provider_username DROP NOT NULL;
