-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('STRONG_CONTEXT', 'WEAK_CONTEXT', 'GENERIC', 'RITUAL');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('EDITORIAL', 'TABLOID', 'NEWS', 'SOCIAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PersonaId" AS ENUM ('RIN', 'SOL', 'VEE', 'ECHO');

-- CreateEnum
CREATE TYPE "Stance" AS ENUM ('AGREE', 'DISAGREE', 'MOCK', 'EMPATHY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "birthday" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuestion" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "tags" TEXT[],
    "triggerRule" JSONB,
    "cooldown" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "DailyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "impactTag" TEXT NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCalibration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCalibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroFeedItem" (
    "id" TEXT NOT NULL,
    "type" "FeedType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "visualConfig" JSONB,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroFeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentConfig" (
    "id" TEXT NOT NULL,
    "feedItemId" TEXT NOT NULL,
    "personaId" "PersonaId" NOT NULL,
    "stance" "Stance" NOT NULL,
    "prompt" TEXT,
    "cachedContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DailyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCalibration" ADD CONSTRAINT "UserCalibration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCalibration" ADD CONSTRAINT "UserCalibration_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DailyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentConfig" ADD CONSTRAINT "CommentConfig_feedItemId_fkey" FOREIGN KEY ("feedItemId") REFERENCES "HeroFeedItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
