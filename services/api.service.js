"use strict";

const ApiGateway = require("moleculer-web");

module.exports = {
  name: "api",
  mixins: [ApiGateway],

  settings: {
    // Exposed port
    port: process.env.PORT || 3500,

    // Exposed IP
    ip: "0.0.0.0",

    routes: [
      {
        path: "/api",

        whitelist: ["**"],

        use: [],

        mergeParams: true,

        authentication: false,

        authorization: false,

        autoAliases: true,

        bodyParsers: {
          json: {
            strict: false,
            limit: "1MB",
          },
          urlencoded: {
            extended: true,
            limit: "1MB",
          },
        },

        mappingPolicy: "all",

        logging: true,
      },
    ],

    log4XXResponses: false,
    logRequestParams: null,
    logResponseData: null,

    assets: {
      folder: "public",

      options: {},
    },
  },
};
