-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('GROUP_TOUR', 'PRIVATE_TOUR', 'UMRAH', 'HAJJ');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('INQUIRY', 'QUOTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'ONLINE_BANKING', 'CREDIT_CARD', 'CHEQUE');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'INSTALMENT', 'FULL_PAYMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "icNumber" TEXT,
    "passportNumber" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Malaysian',
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PackageType" NOT NULL,
    "destination" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "departureDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "pricePerPax" DECIMAL(10,2) NOT NULL,
    "maxCapacity" INTEGER,
    "description" TEXT,
    "inclusions" TEXT,
    "exclusions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'INQUIRY',
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "specialRequests" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "totalPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_travelers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT,
    "fullName" TEXT NOT NULL,
    "icNumber" TEXT,
    "passportNumber" TEXT,
    "nationality" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT,
    "passportExpiry" TIMESTAMP(3),
    "mahramRelation" TEXT,
    "roomType" TEXT,
    "seatNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_travelers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "referenceNumber" TEXT,
    "receiptNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_icNumber_key" ON "customers"("icNumber");

-- CreateIndex
CREATE INDEX "customers_fullName_idx" ON "customers"("fullName");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_deletedAt_idx" ON "customers"("deletedAt");

-- CreateIndex
CREATE INDEX "bookings_customerId_status_idx" ON "bookings"("customerId", "status");

-- CreateIndex
CREATE INDEX "bookings_packageId_idx" ON "bookings"("packageId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_deletedAt_idx" ON "bookings"("deletedAt");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_travelers" ADD CONSTRAINT "booking_travelers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_travelers" ADD CONSTRAINT "booking_travelers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
