"use strict";

const API = require("kucoin-node-sdk");
const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");

API.init(require("../config/kucoin.config"));

module.exports = {
  name: "candles",
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    "mongodb+srv://mtnaskari:askari@cluster0.uh0bj.mongodb.net/?retryWrites=true&w=majority"
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
        const datafeed = new API.websocket.Datafeed();

        datafeed.onClose(() => {
          console.log("ws closed, status ", datafeed.trustConnected);
        });

        datafeed.connectSocket();

        const topic = `/market/candles:${ctx.params.symbol}_${ctx.params.type}`;
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

        return {
          status: "success",
          message: "candles are being stored in the database",
        };
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
          `[i]: nummber of saved candles > ${targetCandles.data.length}`
        );

        targetCandles.data.forEach(async (candle) => {
          const candles = await this.adapter.insert({
            startTime: candle[0],
            openPrice: candle[1],
            closePrice: candle[2],
            highPrice: candle[3],
            lowPrice: candle[4],
            volume: candle[5],
            amount: candle[6],
          });
        });

        return {
          status: "success",
          message: "data stored in database",
          data: targetCandles,
        };
      },
    },
  },
};
