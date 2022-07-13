"use strict";

const API = require("kucoin-node-sdk");
const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const mongodb = require("mongodb");

API.init(require("../config/kucoin.config"));

const datafeed = new API.websocket.Datafeed();

const subscribedTopics = [];

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
    null,
    "Kucoin"
  ),
  collection: "candles",

  actions: {
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
          const callbackId = datafeed.subscribe(topic, async (message) => {
            if (
              message.topic === topic &&
              message.subject === "trade.candles.add"
            ) {
              const newCandle = message.data.candles;
              const candle = await this.adapter.insert({
                symbol: `${ctx.params.symbol}`,
                type: `${ctx.params.type}`,
                startTime: newCandle[0],
                openPrice: newCandle[1],
                closePrice: newCandle[2],
                highPrice: newCandle[3],
                lowPrice: newCandle[4],
                volume: newCandle[5],
                amount: newCandle[6],
              });
              console.log(`[i]: new candle saved in DB > `, {
                symbol: `${ctx.params.symbol}`,
                type: `${ctx.params.type}`,
                ...candle,
              });
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
        const targetCandles = await API.rest.Market.Histories.getMarketCandles(
          ctx.params.symbol,
          ctx.params.type,
          Number(ctx.params.startAt),
          Number(ctx.params.endAt)
        );

        console.log(
          `[i]: nummber of found candles > ${targetCandles.data.length}`
        );

        targetCandles.data.forEach(async (candle) => {
          // const candles = await this.adapter.insert({
          //   symbol: `${ctx.params.symbol}`,
          //   type: `${ctx.params.type}`,
          //   startTime: candle[0],
          //   openPrice: candle[1],
          //   closePrice: candle[2],
          //   highPrice: candle[3],
          //   lowPrice: candle[4],
          //   volume: candle[5],
          //   amount: candle[6],
          // });

          const query = {
            symbol: `${ctx.params.symbol}`,
            type: `${ctx.params.type}`,
            startTime: candle[0],
          };

          const update = {
            $set: {
              symbol: `${ctx.params.symbol}`,
              type: `${ctx.params.type}`,
              startTime: candle[0],
              openPrice: candle[1],
              closePrice: candle[2],
              highPrice: candle[3],
              lowPrice: candle[4],
              volume: candle[5],
              amount: candle[6],
            },
          };

          const options = { upsert: true };

          const candles = await this.adapter.collection.updateOne(
            query,
            update,
            options
          );
        });

        return {
          status: "success",
          message: "data successfully stored in database",
          data: targetCandles,
        };
      },
    },
  },
};
