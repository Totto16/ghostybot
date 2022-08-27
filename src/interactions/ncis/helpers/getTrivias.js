(() => {
  print = console.log;

  function getRated(input) {
    groups = [...input.matchAll(/.*((well)|(top\s(\d{1,2}%))).*/gi)][0];
    const [, rating] = groups;
    if (!rating) {
      throw new Error(`Rating couldn't be parsed: ${input}`);
    }
    return rating.toLowerCase();
  }

  function getCategory() {
    const all = document.querySelectorAll("article.container");

    const questions = [];

    for (let i = 0; i < all.length; ++i) {
      let quizElement = all[i];

      let element = quizElement.querySelector("[property='itemListElement']");

      if (element === null) {
        continue;
      }

      let middleElement = element.querySelector(".col-12");

      const [, box, rawDescription] = middleElement.childNodes;

      let qldesc = box.querySelector(".qldesc");

      let rateElement = box.querySelector("img");
      let rating = rateElement === null ? "not rated" : getRated(rateElement.getAttribute("title"));

      let name = qldesc.querySelector("[property='name']").textContent;

      let href = qldesc.getAttribute("href");

      let link = `${location.toString().replace(location.pathname, "")}${href}`;

      let rawQuestions = box.querySelector(".hidden-sm-down").textContent;

      let questionsAmount = [...rawQuestions.matchAll(/(\d{1,3})/gi)][0][1];

      let questionsNumber = parseInt(questionsAmount);

      if (isNaN(questionsNumber)) {
        throw new Error(`questions Number is not an int: ${questionsAmount}`);
      }

      let description = rawDescription.textContent.replaceAll("\n", "").trim();

      let id = [...href.matchAll(/\w*\/\w*\/[\w\-]*(\d{6})\.html/gi)][0][1];

      if (!id) {
        throw new Error(`id is not in url: ${href}`);
      }

      let info = element.querySelector(".columninfo");

      const [, rawDifficulty, , rawAuthor, , ...rest] = info.childNodes;

      const rawPlays = rest.length == 1 ? rest[0] : rest[2];

      const difficulty = rawDifficulty.textContent.trim();

      const author = rawAuthor.textContent.replaceAll("\n", "").trim();

      const plays = rawPlays.textContent.replaceAll("\n", "").trim();

      const amountOfPlays = parseInt(plays);

      if (isNaN(amountOfPlays)) {
        throw new Error(`amount of plays is not an int: ${plays}`);
      }

      let quiz = {
        description,
        name,
        id,
        link,
        difficulty,
        author,
        questionsNumber,
        amountOfPlays,
        rating,
        parsed: new Date().toISOString(),
      };

      questions.push(quiz);
    }

    const categoryBox = Array.from(document.querySelectorAll("div.container")).at(-2);

    const infoBoxChildren = categoryBox.querySelector(".col-sm-12").childNodes;

    if (infoBoxChildren.length != 3) {
      throw new Error(
        `Category: not right amount of info elements: ${infoBoxChildren.length} -> ${3}`,
      );
    }

    const rawCategoryId = infoBoxChildren[0].textContent.trim();

    let categoryId = [...rawCategoryId.matchAll(/This is category (\d{1,6})/gi)][0][1];

    if (!categoryId) {
      throw new Error(`Category: id is not in string: ${categoryId}`);
    }

    const rawUpdated = infoBoxChildren[2].textContent.trim();

    const rawUpdateString = [...rawUpdated.matchAll(/Last Updated (.*)/gi)][0][1];
    const updated = parseDateFromString(rawUpdateString);

    if (updated === undefined || !(updated instanceof Date)) {
      throw new Error(
        `Category: updated date is not present or incorrect: ${rawUpdateString} -> ${updated}`,
      );
    }

    return { questions, link: location.toString(), id: categoryId, updated: updated.toISOString() };
  }

  function parseDateFromString(string) {
    try {
      const date = new Date(string);
      if (date.toString() === "Invalid Date") {
        throw new Error(date);
      }
      return date;
    } catch (e) {
      return undefined;
    }
  }

  function getSingleQuestion(box) {
    const textBox = box.querySelector(".playquiz_qntxtbox > b");

    const numberToParse = textBox.querySelector("span").textContent.trim().replace(".", "");

    const number = parseInt(numberToParse);

    if (isNaN(number)) {
      throw new Error(`Single: question Number is not an int: ${numberToParse}`);
    }
    const text = textBox.childNodes[1].textContent.trim();

    const answersBox = box.querySelector(".playquiz_anslist");

    const allSingleAnswerBoxes = answersBox.querySelectorAll("div");

    let type;
    if (answersBox.querySelector(".playindent") !== null) {
      type = "textfield";
    } else if (
      answersBox.querySelectorAll("div > input") !== null &&
      answersBox.querySelectorAll("input").length == allSingleAnswerBoxes.length
    ) {
      type = "select";
    } else {
      console.error(`Single Answer: didn't detect question type:`, answerBox);
      type = "undetected";
    }

    const answers = Array.from(allSingleAnswerBoxes).map((singleBox, index) => {
      if (type === "select") {
        const textBox =
          singleBox.querySelector("span") != null
            ? singleBox.querySelector("span")
            : singleBox.childNodes[singleBox.childNodes.length - 1];

        const text = textBox.textContent.trim();

        const value = singleBox.querySelector("input").attributes.value.value.trim();

        return { text, value, index };
      } else if (type == "textfield") {
        const hint =
          answersBox.querySelector(".playindent").querySelector("small")?.textContent.trim() ??
          null;
        // TODO type , hint can be null
        return { hint, index };
      } else {
        return undefined;
      }
    });

    return { number, text, answers, type };
  }

  function getSolutions(solutionBox, unsolvedQuestions) {
    const solutionBoxes = Array.from(solutionBox.querySelector(".col-12").children).filter((a) => {
      if (a.attributes?.class?.value?.includes("quizheading")) {
        return false;
      }

      return a.querySelector(".extrainfo") !== null;
    });

    if (solutionBoxes.length != unsolvedQuestions.length) {
      throw new Error(
        `Solutions: not right amount of unsolved questions boxes: ${solutionBoxes.length} -> ${unsolvedQuestions.length}`,
      );
    }

    solutionBoxes.forEach((box, i) => {
      const infoBox = box.querySelector(".extrainfo");

      const correct = infoBox.querySelector("span > b").textContent.trim();

      // todo: type, can be null
      const rawInfo =
        infoBox.childNodes.length >= 3
          ? infoBox.childNodes[infoBox.childNodes.length - 1].textContent.trim()
          : null;

      const info = rawInfo === "" ? null : rawInfo;

      const { type } = unsolvedQuestions[i];

      if (type === "select") {
        unsolvedQuestions[i].answers = unsolvedQuestions[i].answers.map((answer) => {
          const { text, value } = answer;

          answer.isCorrect =
            [value, text].includes(correct) ||
            [value.toLowerCase(), text.toLowerCase()].includes(correct.toLowerCase());

          return answer;
        });

        const correctOnes = unsolvedQuestions[i].answers.filter(({ isCorrect }) => isCorrect);

        if (correctOnes.length != 1) {
          throw new Error(
            `Solutions: exactly one of the answers has to be correct: ${correctOnes.length}`,
          );
        }
      } else if (type == "textfield") {
        // noop
      } else {
        console.error(`Solutions: didn't detect question type previously:`, type);
      }

      unsolvedQuestions[i].response = { correct, info };
    });

    return unsolvedQuestions;
  }

  function getScore(input) {
    if (input === undefined) {
      return [undefined, "score is undefined"];
    }

    try {
      groups = [...input.matchAll(/(\d{1,3})\s\/\s(\d{1,3})/gi)][0];
      const [, stringReached, stringMax] = groups;

      const reached = parseInt(stringReached);

      if (isNaN(reached)) {
        throw new Error(`reached is not an int: ${stringReached}`);
      }

      const max = parseInt(stringMax);

      if (isNaN(max)) {
        throw new Error(`max is not an int: ${stringMax}`);
      }

      const score = {
        reached,
        max,
      };
      return [score, undefined];
    } catch (e) {
      return [undefined, e];
    }
  }

  function getSingleQuiz() {
    const allBoxes = document.querySelectorAll(".row.box");

    if (allBoxes.length < 2) {
      throw new Error(`too less rows even for basic information: ${allBoxes.length}`);
    }

    const [descriptionBox, dataBox, ...rest] = allBoxes;

    const [, rawTitle, rawDescription, authorBox] =
      descriptionBox.querySelector(".col-12").children;

    const name = rawTitle.textContent.trim();

    let description = rawDescription.textContent.replaceAll("\n", "").trim();

    const author = authorBox.querySelector("a").textContent.replaceAll("\n", "").trim();

    const [
      rawAuthorCheck,
      rawQuizType,
      rawQuizId,
      rawUpdated,
      rawQuestionLength,
      rawDifficulty,
      rawScore,
      rawPlays,
      optionalRawRating,
    ] = dataBox.querySelectorAll(".statbox");

    const authorCheck = rawAuthorCheck.querySelector("a").textContent.trim();

    if (author != authorCheck) {
      throw new Error(`Author isn't equal: ${author} != ${authorCheck}`);
    }

    const quizType = rawQuizType.querySelector("b").textContent.trim();

    if (!["Multiple Choice"].includes(quizType)) {
      throw new Error(`quizType ${quizType} not implemented`);
    }

    const id = rawQuizId.querySelector("b").textContent.trim().replaceAll(",", "");

    const urlId = [...location.toString().matchAll(/\w*\/\w*\/[\w\-]*(\d{6})\.html/gi)][0][1];

    if (!urlId || id != urlId) {
      throw new Error(`id is not in url or not the same as the one in the url: ${id}  -> ${urlId}`);
    }

    const rawUpdateString = rawUpdated.querySelector("b").textContent.trim();
    const updated = parseDateFromString(rawUpdateString);

    if (updated === undefined || !(updated instanceof Date)) {
      throw new Error(`updated date is not present or incorrect: ${rawUpdateString} -> ${updated}`);
    }

    const rawQuestionNumber = rawQuestionLength.querySelector("b").textContent.trim();
    const questionsNumber = parseInt(rawQuestionNumber);

    if (isNaN(questionsNumber)) {
      throw new Error(`questions Number is not an int: ${rawQuestionNumber}`);
    }

    const desiredAmounts = [8, 9].map((a) => a + questionsNumber);

    if (!desiredAmounts.includes(allBoxes.length)) {
      throw new Error(`not right amount of rows: ${allBoxes.length} -> ${desiredAmounts}`);
    }

    const difficulty = rawDifficulty.querySelector("span").textContent.trim();

    const [score, scoreError] = getScore(rawScore.querySelector("b").textContent.trim());

    if (score == undefined || scoreError !== undefined) {
      throw new Error(`score couldn't be parsed: ${scoreError}`);
    }

    const rawAmountOfPlays = rawPlays.querySelector("b").textContent.trim();
    const amountOfPlays = parseInt(rawAmountOfPlays);

    if (isNaN(amountOfPlays)) {
      throw new Error(`amount of plays is not an int: ${rawAmountOfPlays}`);
    }

    let rating = "not rated";
    if (optionalRawRating !== undefined) {
      const rawRatingNodes = optionalRawRating.childNodes;

      let ratingIndex = rawRatingNodes.length - 1;
      if (rawRatingNodes.length == 5) {
        ratingIndex = 3;
      }

      const rawRatingText = rawRatingNodes[ratingIndex].textContent.trim();

      rating = getRated(rawRatingText);
    }

    const questionsBoxes = Array.from(rest).filter((a) =>
      a.attributes.class.value.includes("playquiz"),
    );

    if (questionsBoxes.length != questionsNumber) {
      throw new Error(
        `not right amount of filtered question boxes: ${questionsBoxes.length} -> ${questionsNumber}`,
      );
    }

    const solutionBoxes = Array.from(rest).filter(
      (a) => a.querySelector(".col-12 > .quizheading") !== null,
    );

    if (solutionBoxes.length != 1) {
      throw new Error(`solution boxes length is incorrect: ${solutionBoxes.length}`);
    }

    const solutionBox = solutionBoxes[0];

    const unsolvedQuestions = questionsBoxes.map(getSingleQuestion);

    const questions = getSolutions(solutionBox, unsolvedQuestions);

    return {
      info: {
        description,
        name,
        id,
        link: location.toString(),
        difficulty,
        author,
        questionsNumber,
        amountOfPlays,
        rating,

        updated: updated.toISOString(),
        score,

        parsed: new Date().toISOString(),
      },

      questions,
    };
  }

  const isValidSite = document.querySelectorAll(".container").length != 0;
  if (!isValidSite) {
    throw new Error("Not a valid site!");
  }

  const isSingle = document.querySelectorAll(".container")[2].querySelector(".statbox") !== null;
  try {
    if (isSingle) {
      return getSingleQuiz();
    }
    return getCategory();
  } catch (err) {
    console.warn(`Failed to parse ${isSingle ? "single question" : "question list"} :`, err);
  }
})();
