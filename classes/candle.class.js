class Candle {
  constructor(
    symbol,
    type,
    startTime,
    endTime,
    openPrice,
    closePrice,
    highPrice,
    lowPrice,
    volume,
    amount
  ) {
    this.symbol = symbol;
    this.type = type;
    this.startTime = startTime;
    this.endTime = endTime;
    this.openPrice = openPrice;
    this.closePrice = closePrice;
    this.highPrice = highPrice;
    this.lowPrice = lowPrice;
    this.volume = volume;
    this.amount = amount;
  }
}

module.exports.Candle = Candle;
