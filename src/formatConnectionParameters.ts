import { HanaOptions, HanaClientExplicitPoolParams } from "./types";

/** Holds the default hana pool param */
const DEFAULT_POOL_PARAMS: HanaClientExplicitPoolParams = {
  maxConnectedOrPooled: 0,
  maxPooledIdleTime: 0,
  pingCheck: false,
  poolCapacity: 0,
};

/**
 * Formats the connection parameters for a HANA database connection and makes sure the poolSize is valid.
 * @param {HanaOptions} opts - The options object containing the connection parameters.
 * @returns {Object} The formatted connection parameters.
 */
export function formatConnectionParameters(opts: HanaOptions) {
  const { poolOptions } = opts;

  const connectionParameters = {
    serverNode: `${opts.host}:${opts.port}`,
    uid: opts.user,
    pwd: opts.password,
    ...DEFAULT_POOL_PARAMS,
    ...poolOptions, // Overrides the defaul pool params
  };

  return connectionParameters;
}
