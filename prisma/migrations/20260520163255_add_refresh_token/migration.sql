/*
  Warnings:

  - You are about to drop the `PropertyCalculation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScoreBreakdown` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "BookCondition" AS ENUM ('NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR', 'DAMAGED');

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD');

-- DropForeignKey
ALTER TABLE "PropertyCalculation" DROP CONSTRAINT "PropertyCalculation_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScoreBreakdown" DROP CONSTRAINT "ScoreBreakdown_propertyId_fkey";

-- DropTable
DROP TABLE "PropertyCalculation";

-- DropTable
DROP TABLE "ScoreBreakdown";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "ExpenseType";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "StrategyType";

-- DropEnum
DROP TYPE "verifidStatus";

-- CreateTable
CREATE TABLE "User" (
    "userId" UUID NOT NULL,
    "profilePhotoUrl" TEXT,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT,
    "password" TEXT NOT NULL,
    "refreshToken" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Book" (
    "bookId" UUID NOT NULL,
    "bookCategoryId" UUID NOT NULL,
    "bookName" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "authorName" TEXT NOT NULL,
    "condition" "BookCondition" NOT NULL,
    "status" "BookStatus" NOT NULL DEFAULT 'AVAILABLE',
    "copyOwner" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("bookId")
);

-- CreateTable
CREATE TABLE "BookCategory" (
    "bookCategoryId" UUID NOT NULL,
    "categoryName" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookCategory_pkey" PRIMARY KEY ("bookCategoryId")
);

-- CreateTable
CREATE TABLE "BookImage" (
    "previewId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookImage_pkey" PRIMARY KEY ("previewId")
);

-- CreateTable
CREATE TABLE "UserFavourite" (
    "favId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFavourite_pkey" PRIMARY KEY ("favId")
);

-- CreateTable
CREATE TABLE "UserPurchase" (
    "purchaseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPurchase_pkey" PRIMARY KEY ("purchaseId")
);

-- CreateTable
CREATE TABLE "Chat" (
    "chatId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "roomId" UUID,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("chatId")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "roomId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("roomId")
);

-- CreateTable
CREATE TABLE "ChatRoomMember" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoomMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_contactNumber_key" ON "User"("contactNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BookCategory_categoryName_key" ON "BookCategory"("categoryName");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavourite_userId_bookId_key" ON "UserFavourite"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_userId_bookId_key" ON "UserPurchase"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoomMember_roomId_userId_key" ON "ChatRoomMember"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_copyOwner_fkey" FOREIGN KEY ("copyOwner") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_bookCategoryId_fkey" FOREIGN KEY ("bookCategoryId") REFERENCES "BookCategory"("bookCategoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookImage" ADD CONSTRAINT "BookImage_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("bookId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavourite" ADD CONSTRAINT "UserFavourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavourite" ADD CONSTRAINT "UserFavourite_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("bookId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("bookId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("roomId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMember" ADD CONSTRAINT "ChatRoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("roomId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMember" ADD CONSTRAINT "ChatRoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
