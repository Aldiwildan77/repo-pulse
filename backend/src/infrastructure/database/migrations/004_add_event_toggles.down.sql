ALTER TABLE repo_configs
  DROP COLUMN notify_pr_opened,
  DROP COLUMN notify_pr_merged,
  DROP COLUMN notify_pr_label,
  DROP COLUMN notify_comment,
  DROP COLUMN notify_issue_opened,
  DROP COLUMN notify_issue_closed;
