import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

import allQuestions from "../questions.json";

const quizzes: Prisma.quizzesCreateInput[] = allQuestions.quizzes;

// run this with ts-node:

// `DATABASE_URL="..." ts-node addToDatabase.ts`

async function main() {
  console.log("Start adding the data to the database ...");
  for (const quiz of quizzes) {
    quiz.info.updated = new Date(quiz.info.updated);
    quiz.info.parsed = new Date(quiz.info.parsed);
    const generatedQuiz = await prisma.quizzes.create({
      data: quiz,
    });
    console.log(`Created quiz with id: ${generatedQuiz.id}`);
  }
  console.log("Adding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
