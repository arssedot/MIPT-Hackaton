CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "data" JSONB NOT NULL,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");
