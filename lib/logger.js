import { Logger } from "tslog";
import { z } from "zod";

import { Common } from "./typings/index.js";

export const LOG_LEVEL = Object.freeze({
  silly: 0,
  SILLY: 0,
  trace: 1,
  TRACE: 1,
  debug: 2,
  DEBUG: 2,
  info: 3,
  INFO: 3,
  warn: 4,
  WARN: 4,
  error: 5,
  ERROR: 5,
  fatal: 6,
  FATAL: 6,
});

const LOG_LEVEL_NAMES = /** @type {Common.UnionToTuple<keyof typeof LOG_LEVEL>} */ (
  Object.keys(LOG_LEVEL)
);

const LOG_LEVEL_NAME = z
  .enum(LOG_LEVEL_NAMES)
  .default("INFO")
  .catch("INFO")
  .parse(process.env.LOG_LEVEL);

export const logger = new Logger({
  type: "pretty",
  minLevel: LOG_LEVEL[LOG_LEVEL_NAME],
  overwrite: {
    mask(args) {
      return args;
    },
  },
});
