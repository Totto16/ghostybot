import { users } from "@prisma/client";
import sharp from "sharp";
import * as DJS from "discord.js";

const CONSTANTS = {
  base: 100,
  percent: 10,
  places: [":first_place:", ":second_place:", ":third_place:"],
};

export function isInValidTriviaChannel(channelId: string): boolean {
  const triviaChannelId = process.env["TRIVIA_CHANNEL_ID"] as string;
  return triviaChannelId === channelId;
}

export function getProgressInt(user: users) {
  return (getExistingPoints(user).level * 100) / getPointsToLevelUp(user.trivia?.level ?? 0);
}

export function getPointsToLevelUp(lvl: number): number {
  return Math.round(CONSTANTS.base * Math.pow(1 + CONSTANTS.percent / 100, lvl - 1));
}

export function getExistingPoints(user: users) {
  let level = 1;
  let currentXp = user.trivia?.xp ?? 0;
  let canAdvance = true;
  do {
    const pointsToLevelUp = getPointsToLevelUp(user.trivia?.level ?? 0);
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

  const wo = Math.floor(width * (progress / 100));

  const image = await sharp({
    create: {
      width: wo,
      height,
      channels: 3,
      background: { r: color[0], g: color[1], b: color[2] },
    },
  })
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: width - wo,
      background: { r: 54, g: 57, b: 63 },
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

async function getPlaceOfUser(users: UserInformation, allUsers: users[]) {
  return allUsers
    .map((user) => user.trivia?.xp)
    .sort()
    .indexOf(users.dbUser.trivia?.xp);
}

export async function getProfileEmbed(baseEmbed: DJS.EmbedBuilder, users: UserInformation) {
  const allUsers: users[] = [];
  const place = await getPlaceOfUser(users, allUsers);
  const color = getRankColor(place, allUsers.length);
  const { attachment, attachmentUrl } = await getProgressImage(users, color);

  const embed = baseEmbed
    .setTitle(`Trivia Profile of ${users.discordUser.username} `)
    .setColor(color)
    .addFields(
      {
        name: "Points",
        value: (users.dbUser.trivia?.xp ?? 0).toString(),
        inline: true,
      },
      {
        name: "Level",
        value: (users.dbUser.trivia?.level ?? 0).toString(),
        inline: true,
      },
      {
        name: "Rank",
        value: `${place + 1}.${place < 3 ? ` ${CONSTANTS.places[place] ?? ""}` : ""}`,
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
