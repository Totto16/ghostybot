const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "roleCreate",
  async execute(bot, role) {
    if (!role.guild.me.hasPermission("MANAGE_WEBHOOKS")) {
      return;
    }
    const w = await role.guild.fetchWebhooks();
    const webhook = w.find((w) => w.name === "GhostyBot");

    const embed = new MessageEmbed()
      .setTitle("New role Created")
      .setDescription(`Role: **${role}** was created`)
      .setColor("GREEN")
      .setTimestamp();

    webhook.send(embed);
  },
};
