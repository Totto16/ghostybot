const allQuestions = require("../questions.json");

const categoriesToCheck = ["main", "characters", "episodes", "quotes"];

const cats = [];

for (const cat of categoriesToCheck) {
  cats.push(...allQuestions.categories[cat].questions);
}

const availableQuestions = allQuestions.quizzes;

const duplicateQuestions = availableQuestions
  .map(({ info: { id } }) => id)
  .filter((id, _, all) => {
    return all.filter((id2) => id2 === id).length > 1;
  });

const missingQuestions = [];

for (const question of cats) {
  if (availableQuestions.map(({ info: { id } }) => id).indexOf(question.id) < 0) {
    missingQuestions.push(question);
  }
}

const wrongDefinitions = [];

function validateQuiz(quiz) {
  if (!quiz?.info?.description) {
    return false;
  }

  return true;
}

for (const question of availableQuestions) {
  if (!validateQuiz(question)) {
    wrongDefinitions.push(question);
  }
}

console.log("duplicates:", duplicateQuestions, duplicateQuestions.length);

console.log("missingQuestions:", missingQuestions, missingQuestions.length);

console.log("wrongDefinitions:", wrongDefinitions, wrongDefinitions.length);

const failed = missingQuestions.length + duplicateQuestions.length + wrongDefinitions.length;

if (failed == 0) {
  console.log("Everything is VALID!");
} else {
  console.error(`${failed} errors happened!`);
  process.exit(1);
}
