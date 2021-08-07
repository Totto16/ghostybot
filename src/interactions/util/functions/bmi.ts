import { Bot } from "structures/Bot";
import * as DJS from "discord.js";

export async function bmi(
  bot: Bot,
  interaction: DJS.CommandInteraction,
  lang: typeof import("@locales/english").default,
) {
  const height = interaction.options.getNumber("height", true);
  const weight = interaction.options.getNumber("weight", true);

  const bmi = (+weight / ((+height * +height) / 10000)).toFixed(2);

  const embed = bot.utils
    .baseEmbed(interaction)
    .setTitle(`${interaction.user.username} ${lang.UTIL.BMI}`)
    .addField(`${lang.UTIL.BMI_WEIGHT}`, `${weight}kg`, true)
    .addField(`${lang.UTIL.BMI_HEIGHT}`, `${height}cm`, true)
    .addField(`${lang.UTIL.BMI}`, bmi);

  await interaction.reply({ embeds: [embed] });
}
