import { QuizDetails, QuizDifficulty, quizzes, users } from "@prisma/client";
import sharp from "sharp";
import * as DJS from "discord.js";
import { prisma } from "./prisma";
import crypto from "node:crypto";
import { bold } from "discord.js";

const CONSTANTS = {
  base: 100,
  percent: 10,
  places: [":first_place:", ":second_place:", ":third_place:"],
  discordColor: { r: 54, g: 57, b: 63 },
  ONLINE_PARSED_TEXT: "This question is parsed online, if any Errors occur feel free to contact me",
  FATAL_ERROR: "THIS IS AN ERROR; PLEASE REPORT THIS!",
};

export function isInValidTriviaChannel(channelId: string): boolean {
  const triviaChannelId = process.env["TRIVIA_CHANNEL_ID"] as string;
  return triviaChannelId === channelId;
}

export function getProgressInt(user: users) {
  return (getExistingPoints(user).xp * 100) / getPointsToLevelUp(user.trivia?.level ?? 1);
}

export function getPointsToLevelUp(lvl: number): number {
  return Math.round(CONSTANTS.base * Math.pow(1 + CONSTANTS.percent / 100, lvl - 1));
}

export function getExistingPoints(user: users) {
  let level = 1;
  let currentXp = user.trivia?.xp ?? 0;
  let canAdvance = true;
  do {
    const pointsToLevelUp = getPointsToLevelUp(user.trivia?.level ?? 1);
    if (currentXp >= pointsToLevelUp) {
      ++level;
      currentXp -= pointsToLevelUp;
    } else {
      canAdvance = false;
    }
  } while (canAdvance);
  return { xp: currentXp, level };
}

export interface UserInformation {
  discordUser: DJS.User;
  dbUser: users;
}

export async function getProgressImage(users: UserInformation, color: ColorArray) {
  const width = 250;
  const height = 25;
  const progress = getProgressInt(users.dbUser);

  let widthOffset = Math.floor(width * (progress / 100));

  if (widthOffset === 0) {
    widthOffset = 1;
    color = colorObjectToArray(CONSTANTS.discordColor);
  }

  const image = await sharp({
    create: {
      width: widthOffset,
      height,
      channels: 3,
      background: colorArrayToObject(color),
    },
  })
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: width - widthOffset,
      background: CONSTANTS.discordColor,
    })
    .png()
    .toBuffer();

  const name = `${users.discordUser.username}-progress.png`;

  const attachment = new DJS.AttachmentBuilder(image, {
    name,
  });
  return { attachment, attachmentUrl: `attachment://${name}` };
}

export type ColorArray = [number, number, number];

export function getRankColor(place: number, total: number): ColorArray {
  let color: ColorArray = [0, 0, 0];
  switch (place) {
    case 1:
      color = [218, 165, 32];
      break;
    case 2:
      color = [192, 192, 192];
      break;
    case 3:
      color = [205, 127, 50];
      break;
    default: {
      const p = place / total;
      if (p < 1.0 && p >= 0.8) {
        color = [0, 0, 0];
      } else if (p < 0.8 && p >= 0.6) {
        color = [255, 0, 0];
      } else if (p < 0.6 && p >= 0.4) {
        color = [255, 165, 0];
      } else if (p < 0.4 && p >= 0.2) {
        color = [255, 255, 0];
      } else if (p < 0.2 && p >= 0.0) {
        color = [0, 255, 0];
      }
      break;
    }
  }
  return color;
}

export interface UserWithRank extends users {
  rank: number;
}

async function getPlaceOfUser(users: UserInformation) {
  const aggregations: UserWithRank[] = (await prisma.users.aggregateRaw({
    pipeline: [
      {
        $setWindowFields: {
          sortBy: {
            "trivia.xp": -1,
          },
          output: {
            rank: {
              $rank: {},
            },
          },
        },
      },
    ],
  })) as unknown as UserWithRank[];

  const user_id = users.dbUser.user_id;

  // attention 1 indexed !!!!
  const rank = aggregations.filter((user) => user.user_id === user_id)[0].rank;

  return { rank, amount: aggregations.length };
}

export async function getProfileEmbed(baseEmbed: DJS.EmbedBuilder, users: UserInformation) {
  const { discordUser, dbUser } = users;
  const { rank, amount } = await getPlaceOfUser(users);
  const color = getRankColor(rank, amount);
  const { attachment, attachmentUrl } = await getProgressImage(users, color);

  const avatar = discordUser.displayAvatarURL();

  const embed = baseEmbed
    .setTitle(`Trivia Profile of ${users.discordUser.username} `)
    .setColor(color)
    .setThumbnail(avatar)
    .addFields(
      {
        name: "Points",
        value: (dbUser.trivia?.xp ?? 0).toString(),
        inline: true,
      },
      {
        name: "Level",
        value: (dbUser.trivia?.level ?? 1).toString(),
        inline: true,
      },
      {
        name: "Rank",
        value: `${rank}.${rank <= 3 ? ` ${CONSTANTS.places[rank - 1] ?? ""}` : ""}`,
        inline: true,
      },
    )
    .setImage(attachmentUrl);

  return { embed, attachment };
}

export function HSVtoRGB(h: number | HSVObject, s?: number, v?: number): DJS.HexColorString {
  if (typeof h === "object") {
    s = h.s;
    v = h.v;
    h = h.h;
  }

  if (s === undefined || v === undefined) {
    throw new Error("Invalid arguments for 'HSVtoRGB'");
  }

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r: number;
  let g: number;
  let b: number;

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
    default:
      throw new Error("Mathematical unreachable");
  }
  return RGBToHex({
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  });
}

export interface HSVObject {
  h: number;
  s: number;
  v: number;
}

export interface RGBObject {
  r: number;
  g: number;
  b: number;
}

function RGBToHex({ r, g, b }: RGBObject): DJS.HexColorString {
  const rString = r.toString(16).padStart(2, "0");
  const gString = g.toString(16).padStart(2, "0");
  const bString = b.toString(16).padStart(2, "0");

  return `#${rString}${gString}${bString}`;
}

export function colorArrayToObject([r, g, b]: ColorArray): RGBObject {
  return { r, g, b };
}

export function colorObjectToArray({ r, g, b }: RGBObject): ColorArray {
  return [r, g, b];
}

export async function createTriviaForUser(user: users): Promise<users> {
  return prisma.users.update({
    where: { id: user.id },
    data: { trivia: { set: defaultTriviaObject } },
  });
}

export const defaultTriviaObject = { xp: 0, level: 1, playing: 0 };

export function getRandomFromArray<T>(array: T[]): { index: number; element: T } {
  const index = crypto.randomInt(array.length);
  return { element: array[index], index };
}

export async function getQuestionEmbed(
  baseEmbed: DJS.EmbedBuilder,
  users: UserInformation,
  quiz: quizzes,
  question: QuizDetails,
  questionIndex: number,
) {
  const { discordUser } = users;
  const color = getDifficultyColor(quiz.info.difficulty);

  const avatar = discordUser.displayAvatarURL();

  // TODO: ATTENTION for limits of certain fields!!!!

  let fields: DJS.APIEmbedField[] = [];
  let rawComponents: DJS.ButtonBuilder[] = [];
  switch (question.type) {
    case "SELECT":
      {
        const answers = question.answers;
        fields = [];
        rawComponents = [];
        for (let i = 0; i < answers.length; ++i) {
          const { text } = answers[i];
          const letter = getIdentificationFromIndex(i);

          fields.push({
            name: `${bold(letter)}`,
            value: text ?? CONSTANTS.FATAL_ERROR,
            inline: false,
          });

          // TODO: don't get over 100 chars with the custom id!!! . make a separate function for that, to reuse it later

          const button = new DJS.ButtonBuilder()
            .setCustomId(`${discordUser.id}-${quiz.id}-${questionIndex}-${i}`)
            .setLabel(letter)
            .setStyle(DJS.ButtonStyle.Primary);

          rawComponents.push(button);
        }
      }
      break;
    case "TEXTFIELD":
      {
        const [singleAnswer] = question.answers;
        fields = singleAnswer.hint
          ? [{ name: "hint", inline: true, value: singleAnswer.hint }]
          : [];
        rawComponents = [];
      }
      break;
    default:
      throw new Error(`FATAL, type not known: ${question.type}`);
  }

  const embed = baseEmbed
    .setFooter({ text: CONSTANTS.ONLINE_PARSED_TEXT, iconURL: avatar })
    .setTitle(question.text)
    .setColor(color)
    .addFields(...fields);

  const components: DJS.ActionRowBuilder<DJS.ButtonBuilder>[] = [];

  for (let i = 0; i < rawComponents.length; i += 5) {
    const row = new DJS.ActionRowBuilder<DJS.ButtonBuilder>().addComponents(
      ...rawComponents.slice(i, Math.min(i + 5, rawComponents.length)),
    );
    components.push(row);
  }

  return { embed, components };
}

export type QuizDifficultyMap = {
  [key in QuizDifficulty]: DJS.HexColorString;
};

export const quizDifficultyMap: QuizDifficultyMap = {
  AVERAGE: "#000066",
  EASIER: "#009900",
  EASY: "#009900",
  TOUGH: "#990000",
  VERY_EASY: "#006600",
  DIFFICULT: "#CC0000",
  VERY_DIFFICULT: "#FF0000",
};

export function getDifficultyColor(difficulty: QuizDifficulty): DJS.HexColorString {
  return quizDifficultyMap[difficulty];
}

export function getIdentificationFromIndex(index: number, upperCase = true) {
  const temp = String.fromCharCode("a".charCodeAt(0) + index);
  return upperCase ? temp.toUpperCase() : temp;
}

export async function getTriviaQuestionAmount(): Promise<number> {
  const aggregations = (await prisma.quizzes.aggregateRaw({
    pipeline: [{ $unwind: "$questions" }],
  })) as unknown as QuizDetails[];

  return aggregations.length;
}
