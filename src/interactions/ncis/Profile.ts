import * as DJS from "discord.js";
import { bold } from "@discordjs/builders";
import { Bot } from "structures/Bot";
import { SubCommand } from "structures/Command/SubCommand";

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
      ],
    });
  }

  async execute(
    interaction: DJS.ChatInputCommandInteraction<"cached" | "raw">,
    lang: typeof import("@locales/english").default,
  ) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    if (user.bot) {
      return interaction.reply({ ephemeral: true, content: lang.MEMBER.BOT_DATA });
    }

    const dbUser = await this.bot.utils.getUserById(user.id, interaction.guildId!);
    if (!dbUser) {
      return interaction.reply({ ephemeral: true, content: lang.GLOBAL.ERROR });
    }

    const { trivia } = dbUser;
    if (!trivia) {
      return interaction.reply({ ephemeral: true, content: lang.GLOBAL.ERROR });
    }

    const { xp, level } = trivia;

    const embed = this.bot.utils
      .baseEmbed(interaction)
      .setTitle(`${user.username} Trivia Profile`)
      .setDescription(
        `
  ${bold(lang.LEVELS.XP)}: ${this.bot.utils.formatNumber(xp)}
  ${bold(lang.LEVELS.LEVEL)}: ${level}
      `,
      );

    await interaction.reply({ embeds: [embed] });
  }
}
