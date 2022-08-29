import * as DJS from "discord.js";
import { Bot } from "structures/Bot";
import { SubCommand } from "structures/Command/SubCommand";
import process from "node:process";
import { ValidateReturn } from "structures/Command/BaseCommand";
import { isInValidTriviaChannel } from "utils/triviaHelper";

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

    const dbUser = await this.bot.utils.getUserById(user.id, interaction.guildId!);
    if (!dbUser) {
      return interaction.reply({ ephemeral, content: lang.GLOBAL.ERROR });
    }

    const { trivia } = dbUser;
    if (!trivia) {
      dbUser.trivia = { xp: 0, level: 1 };
    }

    if (interaction.channel === null || !isInValidTriviaChannel(interaction.channelId)) {
      return interaction.reply({
        ephemeral,
        content: `Channel <#${interaction.channelId}> is not the valid trivia channel, for that visit: <#${process.env["TRIVIA_CHANNEL_ID"]}>`,
      });
    }

    // is in correct channel ?!?!?

    // already playing=???!!

    // then play!!!

    await interaction.reply({ ephemeral, content: "TODO" });
  }
}
