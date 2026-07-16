-- AlterTable
ALTER TABLE "TimeLog" ADD COLUMN     "clockInLatitude" DOUBLE PRECISION,
ADD COLUMN     "clockInLongitude" DOUBLE PRECISION,
ADD COLUMN     "clockInPhotoUrl" TEXT,
ADD COLUMN     "clockOutLatitude" DOUBLE PRECISION,
ADD COLUMN     "clockOutLongitude" DOUBLE PRECISION,
ADD COLUMN     "clockOutPhotoUrl" TEXT;
