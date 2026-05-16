-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "defaultAddress" TEXT,
    "city" TEXT,
    "zone" TEXT,
    "floor" TEXT,
    "apartment" TEXT,
    "intercom" TEXT,
    "propertyType" TEXT,
    "hasPets" BOOLEAN NOT NULL DEFAULT false,
    "petNotes" TEXT,
    "preferredTimeWindows" TEXT,
    "preferredFrequency" TEXT NOT NULL DEFAULT 'ONE_TIME',
    "accessNotes" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CleanerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Beograd',
    "yearsExperience" INTEGER,
    "offeredServices" TEXT,
    "bringsSupplies" BOOLEAN NOT NULL DEFAULT false,
    "bringsEquipment" BOOLEAN NOT NULL DEFAULT false,
    "equipmentNote" TEXT,
    "minHours" INTEGER NOT NULL DEFAULT 3,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "backgroundCheckStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "ratingAverage" REAL NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "payoutMethodNote" TEXT,
    "internalRiskNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CleanerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CleanerZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cleanerId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CleanerZone_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "CleanerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverageZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isComingSoon" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hourlyRateRsd" INTEGER NOT NULL,
    "minHours" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AddOn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceRsd" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "cleanerId" TEXT,
    "serviceTypeId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "squareMeters" INTEGER NOT NULL,
    "rooms" INTEGER,
    "bathrooms" INTEGER,
    "preferredDate" DATETIME NOT NULL,
    "preferredStartTime" TEXT NOT NULL,
    "estimatedHours" INTEGER NOT NULL,
    "customerNotes" TEXT,
    "accessNotes" TEXT,
    "suppliesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "subtotalRsd" INTEGER NOT NULL,
    "bookingFeeRsd" INTEGER NOT NULL,
    "totalPriceRsd" INTEGER NOT NULL,
    "cleanerPayoutRsd" INTEGER NOT NULL,
    "platformRevenueRsd" INTEGER NOT NULL,
    "recurrencePreference" TEXT NOT NULL DEFAULT 'ONE_TIME',
    "requiresAdminConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "cancellationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingAddOn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceRsd" INTEGER NOT NULL,
    CONSTRAINT "BookingAddOn_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookingAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CleanerAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cleanerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CleanerAvailability_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "CleanerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "reportedByUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "refundAmountRsd" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IncidentReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IncidentReport_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminNote_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CleanerProfile_userId_key" ON "CleanerProfile"("userId");

-- CreateIndex
CREATE INDEX "CleanerZone_city_zone_idx" ON "CleanerZone"("city", "zone");

-- CreateIndex
CREATE UNIQUE INDEX "CleanerZone_cleanerId_city_zone_key" ON "CleanerZone"("cleanerId", "city", "zone");

-- CreateIndex
CREATE UNIQUE INDEX "CoverageZone_city_zone_key" ON "CoverageZone"("city", "zone");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_code_key" ON "ServiceType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AddOn_code_key" ON "AddOn"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_cleanerId_idx" ON "Booking"("cleanerId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");

-- CreateIndex
CREATE INDEX "Booking_city_zone_idx" ON "Booking"("city", "zone");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAddOn_bookingId_addOnId_key" ON "BookingAddOn"("bookingId", "addOnId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_customerId_key" ON "Review"("bookingId", "customerId");

-- CreateIndex
CREATE INDEX "IncidentReport_status_idx" ON "IncidentReport"("status");

-- CreateIndex
CREATE INDEX "IncidentReport_severity_idx" ON "IncidentReport"("severity");

-- CreateIndex
CREATE INDEX "Message_bookingId_idx" ON "Message"("bookingId");

-- CreateIndex
CREATE INDEX "AdminNote_entityType_entityId_idx" ON "AdminNote"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
