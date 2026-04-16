-- CreateTable
CREATE TABLE IF NOT EXISTS "AuthorizedUser" (
    "id" TEXT NOT NULL DEFAULT 'owner',
    "googleUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorizedUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AuthorizedUser_googleUid_key" ON "AuthorizedUser"("googleUid");
