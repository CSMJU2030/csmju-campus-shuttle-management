-- CreateEnum
CREATE TYPE "BusServiceStatus" AS ENUM ('RUNNING', 'BREAK', 'OFF_DUTY');

-- CreateEnum
CREATE TYPE "RideRequestStatus" AS ENUM ('WAITING', 'PICKED_UP', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LostItemType" AS ENUM ('LOST', 'FOUND');

-- CreateEnum
CREATE TYPE "LostItemStatus" AS ENUM ('OPEN', 'RETURNED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProblemCategory" AS ENUM ('LATE', 'DRIVER', 'VEHICLE', 'SAFETY', 'OTHER');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterTable
ALTER TABLE "bus_locations" ADD COLUMN     "passenger_count" INTEGER,
ADD COLUMN     "service_status" "BusServiceStatus" NOT NULL DEFAULT 'RUNNING';

-- CreateTable
CREATE TABLE "ride_requests" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "stop_id" TEXT NOT NULL,
    "requested_by_core_user_id" TEXT NOT NULL,
    "status" "RideRequestStatus" NOT NULL DEFAULT 'WAITING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lost_items" (
    "id" TEXT NOT NULL,
    "route_id" TEXT,
    "type" "LostItemType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "LostItemStatus" NOT NULL DEFAULT 'OPEN',
    "reported_by_core_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lost_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_reviews" (
    "id" TEXT NOT NULL,
    "route_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reviewed_by_core_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "route_id" TEXT,
    "message" TEXT NOT NULL,
    "created_by_core_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_reports" (
    "id" TEXT NOT NULL,
    "route_id" TEXT,
    "category" "ProblemCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ProblemStatus" NOT NULL DEFAULT 'OPEN',
    "reported_by_core_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ride_requests_stop_id_status_idx" ON "ride_requests"("stop_id", "status");

-- AddForeignKey
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "shuttle_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "shuttle_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_items" ADD CONSTRAINT "lost_items_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "shuttle_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "shuttle_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "shuttle_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "shuttle_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
