-- Initialize authorization roles only. Public/demo credentials must never be seeded.
INSERT INTO role (name)
SELECT 'ROLE_USER' WHERE NOT EXISTS (SELECT 1 FROM role WHERE name = 'ROLE_USER');
INSERT INTO role (name)
SELECT 'ROLE_APPROVER' WHERE NOT EXISTS (SELECT 1 FROM role WHERE name = 'ROLE_APPROVER');
INSERT INTO role (name)
SELECT 'ROLE_FINANCE' WHERE NOT EXISTS (SELECT 1 FROM role WHERE name = 'ROLE_FINANCE');
