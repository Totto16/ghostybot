import { PrismaClient, Prisma } from "@prisma/client";
import process from "node:process";

const prisma = new PrismaClient();

import allQuestions from "../questions.json";

const quizzes: Prisma.quizzesCreateInput[] = allQuestions.quizzes;

// run this with ts-node:

// `DATABASE_URL="..." ts-node addToDatabase.ts`

async function main() {
  console.log("Start adding the data to the database ...");
  for (let i = 0; i < quizzes.length; ++i) {
    const quiz: Prisma.quizzesCreateInput = Prisma.validator<Prisma.quizzesCreateInput>()(
      quizzes[i],
    );

    quiz.info.updated = quiz?.info?.updated ? new Date(quiz?.info?.updated) : undefined;
    quiz.info.parsed = quiz?.info?.parsed ? new Date(quiz?.info?.parsed) : undefined;
    const generatedQuiz = await prisma.quizzes.create({
      data: quiz,
    });
    console.log(`Created quiz with id: ${generatedQuiz.id} ${i + 1} / ${quizzes.length}`);
  }
  console.log(`Adding of ${quizzes.length} finished`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma
      .$disconnect()
      .catch(console.error)
      .then(() => console.log("Successfully disconnected from the database!"));
  });
