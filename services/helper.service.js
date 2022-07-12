module.exports = {
  name: "helper",

  actions: {
    random() {
      return Math.round(Math.random() * 10);
    },
  },

  events: {
    "saveInDB.called"(payload) {
      // this.logger.info(`Helper Service Caught an Event`);
      console.log(`Helper Service Caught an Event`);
      this.logger.info(payload);
    },
  },
};
