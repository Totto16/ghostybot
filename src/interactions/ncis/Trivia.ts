import * as DJS from "discord.js";
import { Bot } from "structures/Bot";
import { SubCommand } from "structures/Command/SubCommand";
import process from "node:process";
import { prisma } from "utils/prisma";
import { ValidateReturn } from "structures/Command/BaseCommand";
import {
  createTriviaForUser,
  defaultTriviaObject,
  getQuestionEmbed,
  getRandomFromArray,
  isInValidTriviaChannel,
} from "utils/triviaHelper";
import { setTimeout, clearTimeout } from "node:timers";
import { QuizDetails, quizzes } from "@prisma/client";

export const TRIVIA_PLAY_TIME = 2 * 60 * 1000;

export default class ProfileCommand extends SubCommand {
  constructor(bot: Bot) {
    super(bot, {
      commandName: "ncis",
      name: "trivia",
      description: "Play the Trivia game with the bot",
      options: [
        {
          type: DJS.ApplicationCommandOptionType.Boolean,
          required: false,
          name: "invisible",
          description: "Wether to play invisible for other users or not",
        },
      ],
    });
  }

  async validate(): Promise<ValidateReturn> {
    if (!process.env["TRIVIA_CHANNEL_ID"]) {
      return {
        ok: false,
        error: {
          ephemeral: true,
          content:
            "Developer: This action cannot be performed since there's no channel defined (TRIVIA_CHANNEL_ID)",
        },
      };
    }

    return { ok: true };
  }

  async execute(
    interaction: DJS.ChatInputCommandInteraction<"cached" | "raw">,
    lang: typeof import("@locales/english").default,
  ) {
    const user = interaction.user;
    const ephemeral = interaction.options.getBoolean("invisible") ?? false;
    if (user.bot) {
      return interaction.reply({ ephemeral, content: lang.MEMBER.BOT_DATA });
    }

    let dbUser = await this.bot.utils.getUserById(user.id, interaction.guildId!);
    if (!dbUser) {
      return interaction.reply({ ephemeral, content: lang.GLOBAL.ERROR });
    }

    if (!dbUser.trivia) {
      dbUser = await createTriviaForUser(dbUser);
    }

    if ((dbUser.trivia?.playing ?? 0) > 0) {
      return interaction.reply({
        ephemeral,
        content: `You are already playing a trivia game, finish that first: Playing ${
          dbUser.trivia?.playing ?? 0
        } games at the moment!`,
      });
    }

    if (interaction.channel === null || !isInValidTriviaChannel(interaction.channelId)) {
      return interaction.reply({
        ephemeral,
        content: `Channel <#${interaction.channelId}> is not the valid trivia channel, for that visit: <#${process.env["TRIVIA_CHANNEL_ID"]}>`,
      });
    }

    prisma.users.update({
      where: { id: user.id },
      data: {
        trivia: { upsert: { set: defaultTriviaObject, update: { playing: { increment: 1 } } } },
      },
    });

    let timeoutID: NodeJS.Timeout | null = null;

    const end = () => {
      prisma.users.update({
        where: { id: user.id },
        data: {
          trivia: { upsert: { set: defaultTriviaObject, update: { playing: { decrement: 1 } } } },
        },
      });

      clearTimeout(timeoutID ?? -1);
    };

    timeoutID = setTimeout(end, TRIVIA_PLAY_TIME);

    const [rawRandomQuiz] = (await prisma.quizzes.aggregateRaw({
      pipeline: [
        {
          $sample: {
            size: 1,
          },
        },
      ],
    })) as unknown as [quizzes];

    const randomQuiz = await prisma.quizzes.findFirst({
      where: {
        id: rawRandomQuiz.id,
      },
    });

    if (!randomQuiz) {
      return interaction.reply({ ephemeral, content: lang.GLOBAL.ERROR });
    }

    const { element: question, index: questionIndex } = getRandomFromArray<QuizDetails>(
      randomQuiz.questions,
    );

    const baseEmbed = this.bot.utils.baseEmbed(interaction);

    const { embed, components } = await getQuestionEmbed(
      baseEmbed,
      {
        discordUser: user,
        dbUser,
      },
      randomQuiz,
      question,
      questionIndex,
    );

    await interaction.reply({ ephemeral, embeds: [embed], components });

    end();

    // get random quiz, get random question, setup timeout, setup embed, run

    // await interaction.reply({ ephemeral, content: "TODO" });
  }
}
