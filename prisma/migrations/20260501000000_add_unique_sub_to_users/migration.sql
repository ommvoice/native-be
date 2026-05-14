-- AlterTable: add unique constraint on users.sub
CREATE UNIQUE INDEX IF NOT EXISTS "users_sub_key" ON "users"("sub");
