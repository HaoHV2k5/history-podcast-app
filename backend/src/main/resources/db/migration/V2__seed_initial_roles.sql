-- ==============================================================================
-- V2__seed_initial_roles.sql
-- Seed standard roles for identity domain
-- ==============================================================================

INSERT INTO roles (name, description)
SELECT 'VIEWER', 'Default viewer and listener role'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'VIEWER');

INSERT INTO roles (name, description)
SELECT 'CREATOR', 'Content creator role'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'CREATOR');

INSERT INTO roles (name, description)
SELECT 'NARRATOR', 'Voice narrator and voice actor role'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'NARRATOR');

INSERT INTO roles (name, description)
SELECT 'ADMIN', 'System administrator role'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN');
