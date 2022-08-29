import * as DJS from "discord.js";
import { Bot } from "structures/Bot";
import { SubCommand } from "structures/Command/SubCommand";
import process from "node:process";
import { ValidateReturn } from "structures/Command/BaseCommand";
import { isInValidTriviaChannel, getProfileEmbed } from "utils/triviaHelper";

export default class ProfileCommand extends SubCommand {
  constructor(bot: Bot) {
    super(bot, {
      commandName: "ncis",
      name: "profile",
      description: "See the NCIS trivia profile of a user",
      options: [
        {
          type: DJS.ApplicationCommandOptionType.User,
          required: false,
          name: "user",
          description: "The user you want to see their profile of",
        },
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
    const user = interaction.options.getUser("user") ?? interaction.user;
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

    const baseEmbed = this.bot.utils.baseEmbed(interaction);

    const { embed, attachment } = await getProfileEmbed(baseEmbed, {
      discordUser: interaction.user,
      dbUser,
    });
    await interaction.reply({ ephemeral, embeds: [embed], files: [attachment] });
  }
}
