"use strict";

const API = require("kucoin-node-sdk");
API.init(require("../config/kucoin.config"));

const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { Candle } = require("../classes/candle.class");
const mongodb = require("mongodb");

const subscribedTopics = [];

const datafeed = new API.websocket.Datafeed();
datafeed.onClose(() => {
  console.log("ws closed, status ", datafeed.trustConnected);
});
datafeed.connectSocket().then(() => {
  console.log("connected to web socket succesfully");
});

module.exports = {
  name: "candles",

  mixins: [DbService],

  adapter: new MongoDBAdapter(
    "mongodb+srv://mtnaskari:askari@cluster0.uh0bj.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true },
    "Kucoin"
  ),

  collection: "candles",

  settings: {
    fields: [
      "_id",
      "symbol",
      "type",
      "startTime",
      "endTime",
      "openPrice",
      "closePrice",
      "highPrice",
      "lowPrice",
      "volume",
      "amount",
    ],
  },

  actions: {
    list: false,
    create: false,
    get: false,
    update: false,
    remove: false,

    saveInDB_ws: {
      rest: {
        method: "GET",
        path: "/save-in-db-ws",
      },
      params: {
        type: "string",
        symbol: "string",
      },

      async handler(ctx) {
        const topic = `/market/candles:${ctx.params.symbol}_${ctx.params.type}`;
        if (subscribedTopics.find((element) => element === topic)) {
          return {
            code: 2,
            status: "success",
            message: "candles are being stored in the database",
          };
        } else {
          datafeed.subscribe(topic, async (message) => {
            if (
              message.topic === topic &&
              message.subject === "trade.candles.add"
            ) {
              const data = message.data.candles;

              const candle = new Candle();
              candle.symbol = ctx.params.symbol;
              candle.type = ctx.params.type;
              candle.startTime = data[0];
              candle.openPrice = data[1];
              candle.closePrice = data[2];
              candle.highPrice = data[3];
              candle.lowPrice = data[4];
              candle.volume = data[5];
              candle.amount = data[6];

              await this.adapter
                .insert(candle)
                .then((candle) =>
                  console.log("[i]: new candle saved in DB > ", candle)
                )
                .catch((error) =>
                  console.error("[-]: error saving candle in DB > ", error)
                );
            }
          });

          subscribedTopics.push(topic);

          return {
            code: 1,
            status: "success",
            message: "candles are being stored in the database",
          };
        }
      },
    },

    saveInDB: {
      rest: {
        method: "GET",
        path: "/save-in-db",
      },
      params: {
        type: "string",
        symbol: "string",
        startAt: "string",
        endAt: "string",
      },

      async handler(ctx) {
        try {
          const targetCandles =
            await API.rest.Market.Histories.getMarketCandles(
              ctx.params.symbol,
              ctx.params.type,
              Number(ctx.params.startAt),
              Number(ctx.params.endAt)
            );

          const data = targetCandles.data;

          console.log(`[i]: nummber of found candles > ${data.length}`);

          data.forEach((data) => {
            const filter = {
              symbol: `${ctx.params.symbol}`,
              type: `${ctx.params.type}`,
              startTime: data[0],
            };

            const candle = new Candle();
            candle.symbol = ctx.params.symbol;
            candle.type = ctx.params.type;
            candle.startTime = data[0];
            candle.openPrice = data[1];
            candle.closePrice = data[2];
            candle.highPrice = data[3];
            candle.lowPrice = data[4];
            candle.volume = data[5];
            candle.amount = data[6];

            const update = { $set: candle };

            const options = { upsert: true };

            this.adapter.collection
              .updateOne(filter, update, options)
              .catch((error) =>
                console.error("[-]: error saving candle in DB > ", error)
              );
          });

          return {
            status: "success",
            message: "data successfully stored in database",
            data: data,
          };
        } catch (error) {
          console.error("[-]: kucoin sdk error >", error);

          return {
            status: "failed",
            message: error.message,
          };
        }
      },
    },
  },
};
