/*
  Warnings:

  - You are about to drop the column `cachedContent` on the `CommentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `feedItemId` on the `CommentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `personaId` on the `CommentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `CommentConfig` table. All the data in the column will be lost.
  - Added the required column `content` to the `CommentConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `heroFeedItemId` to the `CommentConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `personaName` to the `CommentConfig` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `stance` on the `CommentConfig` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "CommentConfig" DROP CONSTRAINT "CommentConfig_feedItemId_fkey";

-- AlterTable
ALTER TABLE "CommentConfig" DROP COLUMN "cachedContent",
DROP COLUMN "feedItemId",
DROP COLUMN "personaId",
DROP COLUMN "prompt",
ADD COLUMN     "actionLink" TEXT,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "heroFeedItemId" TEXT NOT NULL,
ADD COLUMN     "personaName" TEXT NOT NULL,
DROP COLUMN "stance",
ADD COLUMN     "stance" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "CommentConfig" ADD CONSTRAINT "CommentConfig_heroFeedItemId_fkey" FOREIGN KEY ("heroFeedItemId") REFERENCES "HeroFeedItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
