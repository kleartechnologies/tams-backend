-- CreateTable
CREATE TABLE "package_itineraries" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_itineraries_packageId_idx" ON "package_itineraries"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "package_itineraries_packageId_dayNumber_key" ON "package_itineraries"("packageId", "dayNumber");

-- AddForeignKey
ALTER TABLE "package_itineraries" ADD CONSTRAINT "package_itineraries_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
