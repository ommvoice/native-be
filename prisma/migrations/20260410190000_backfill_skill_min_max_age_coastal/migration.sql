-- Backfill ages for coastal demo skills (e.g. DBs seeded before Skill.minAge existed).
UPDATE "skills"
SET "minAge" = 6, "maxAge" = NULL
WHERE slug = 'coastal_adventures_sailing';

UPDATE "skills"
SET "minAge" = 8, "maxAge" = NULL
WHERE slug = 'coastal_adventures_coasteering';
