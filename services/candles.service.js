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
        const number = await ctx.call("helper.random");

        const sentence = `Welcome, ${ctx.params.type} ${ctx.params.symbol}`;

        ctx.emit("saveInDB.called", { number });

        const targetCandles = await API.rest.Market.Histories.getMarketCandles(
          ctx.params.symbol,
          ctx.params.type,
          Number(ctx.params.startAt),
          Number(ctx.params.endAt)
        );

        console.log(
          `[i]: nummber of saved candles ${targetCandles.data.length}`
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

        return { number, sentence, targetCandles };
      },
    },
  },
};
