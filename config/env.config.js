const { join } = require("path");
const dotenv = require("dotenv");

const config = dotenv.config({ path: join(__dirname, "../.env") });

if (config.error) console.log("[-] dotenv config > " + config.error.message);

const checkEnv = (envVar) => {
  if (!process.env[envVar]) {
    console.log(
      `[-] .env > Please define the environment variable "${envVar}"`
    );
    process.exit(1);
  } else {
    return process.env[envVar];
  }
};

const PORT = Number(checkEnv("PORT"));

const DB_NAME = checkEnv("DB_NAME");
const DB_URL = checkEnv("DB_URL");

module.exports = {
  PORT,
  DB_NAME,
  DB_URL,
};
