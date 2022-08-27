import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const allQuestions = require("../questions.json");

const quizzes = allQuestions.questions;

async function main() {
  console.log(`Start adding the data to the database ...`);
  for (const quiz of quizzes) {
    const generatedQuiz = await prisma.quizzes.create({
      data: quiz,
    });
    console.log(`Created quiz with id: ${generatedQuiz.id}`);
  }
  console.log(`Adding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
