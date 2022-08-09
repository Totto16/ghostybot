/* eslint-disable */
const { i18n } = require("./next-i18next.config");

module.exports = {
  images: {
    domains: ["cdn.discordapp.com"] /* KEEP THIS OTHERWISE IMAGES WILL NOT LOAD */,
  },
  async redirects() {
    return [
      {
        source: "/add",
        destination:
          "https://discord.com/oauth2/authorize?client_id=759395211713052724&scope=bot+applications.commands&permissions=8",
        permanent: true,
      },
      {
        source: "/support",
        destination: "https://discord.gg/wF4FK7me2P",
        permanent: true,
      },
      {
        source: "/logout",
        destination: "/api/auth/logout",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/api/auth/login",
        permanent: true,
      },
    ];
  },
  i18n,
};
