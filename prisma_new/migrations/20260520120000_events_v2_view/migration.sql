-- Event spreadsheet rows are stored in `opportunity_venues_v2` with `opportunity_type = 'event'`.
-- This view is for SQL clients / reporting that expect a dedicated "events v2" relation.

DROP VIEW IF EXISTS "events_v2";

CREATE VIEW "events_v2" AS
SELECT *
FROM "opportunity_venues_v2"
WHERE "opportunity_type" = 'event';
