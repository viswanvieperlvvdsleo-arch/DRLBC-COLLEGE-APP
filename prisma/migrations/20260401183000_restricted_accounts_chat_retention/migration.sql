ALTER TABLE "User"
ADD COLUMN "restrictedAt" TIMESTAMP(3),
ADD COLUMN "chatRetentionUntil" TIMESTAMP(3);

CREATE INDEX "User_restrictedAt_chatRetentionUntil_idx" ON "User"("restrictedAt", "chatRetentionUntil");
