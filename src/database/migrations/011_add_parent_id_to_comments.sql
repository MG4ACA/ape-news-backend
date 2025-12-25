-- Add parent_id column to comments table for nested/threaded comments
ALTER TABLE comments
ADD COLUMN parent_id INT DEFAULT NULL AFTER user_id,
ADD FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
ADD INDEX idx_parent_id (parent_id);
