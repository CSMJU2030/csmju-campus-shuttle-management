-- CreateEnum
CREATE TYPE "PassengerLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'FULL');

-- CreateTable
CREATE TABLE "shuttle_routes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departure_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shuttle_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shuttle_stops" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shuttle_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_locations" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "current_stop_id" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "passenger_level" "PassengerLevel" NOT NULL DEFAULT 'LOW',
    "reported_by_core_user_id" TEXT NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bus_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shuttle_stops_route_id_sequence_key" ON "shuttle_stops"("route_id", "sequence");

-- CreateIndex
CREATE INDEX "bus_locations_route_id_reported_at_idx" ON "bus_locations"("route_id", "reported_at");

-- AddForeignKey
ALTER TABLE "shuttle_stops" ADD CONSTRAINT "shuttle_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "shuttle_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_locations" ADD CONSTRAINT "bus_locations_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "shuttle_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_locations" ADD CONSTRAINT "bus_locations_current_stop_id_fkey" FOREIGN KEY ("current_stop_id") REFERENCES "shuttle_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
