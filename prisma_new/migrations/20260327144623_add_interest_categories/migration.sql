-- CreateTable
CREATE TABLE "interest_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interest_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_sub_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "interest_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interest_categories_name_key" ON "interest_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "interest_sub_categories_slug_key" ON "interest_sub_categories"("slug");

-- AddForeignKey
ALTER TABLE "interest_sub_categories" ADD CONSTRAINT "interest_sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "interest_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
