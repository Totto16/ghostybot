import * as DJS from "discord.js";
import { Bot } from "structures/Bot";
import { SubCommand } from "structures/Command/SubCommand";

export default class ProfileCommand extends SubCommand {
  constructor(bot: Bot) {
    super(bot, {
      commandName: "ncis",
      name: "trivia",
      description: "Play the Trivia game with the bot",
    });
  }

  async execute(
    interaction: DJS.ChatInputCommandInteraction<"cached" | "raw">,
    lang: typeof import("@locales/english").default,
  ) {
    const user = interaction.user;
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

    // is in correct channel ?!?!?

    // already playing=???!!

    // then play!!!

    await interaction.reply({ content: "TODO" });
  }
}
