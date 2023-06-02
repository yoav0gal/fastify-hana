import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import * as hana from "@sap/hana-client";
import { HanaOptions, ExecuteQueryParameters } from "./types";
import { namedParameterBindingSupport } from "./namedParametersSupport";

/**
 * Formats the connection parameters for a HANA database connection and makes sure the poolSize is valid.
 * @param {HanaOptions} opts - The options object containing the connection parameters.
 * @returns {Object} The formatted connection parameters.
 */
function formatConnectionParameters(opts: HanaOptions) {
  const { poolMax = 10, poolMin = 0 } = opts;

  const connectionParameters = {
    serverNode: `${opts.host}:${opts.port}`,
    uid: opts.user,
    pwd: opts.password,
    poolMax: Math.max(poolMax, poolMin),
    poolMin: Math.min(poolMin, poolMax),
  };
  console.log(
    `The connection pool size will vary between ${connectionParameters.poolMin}-${connectionParameters.poolMax}`
  );
  return connectionParameters;
}

export default fp<HanaOptions>(
  async (fastify: FastifyInstance, opts: HanaOptions) => {
    const pool = hana.createPool(formatConnectionParameters(opts));

    /**
     * Executes a database query with optional parameters.
     * @param {string} query - The query string to be executed.
     * @param {ExecuteQueryParameters} parameters - The parameters for the query.
     * @returns {Promise<any>} A promise resolving to the query result.
     * @throws {Error} If an error occurs during query execution.
     */
    async function executeQuery(
      query: string,
      parameters: ExecuteQueryParameters
    ) {
      //Convert named parameter binding format to the hana client index based binding format
      if (!Array.isArray(parameters)) {
        [query, parameters] = namedParameterBindingSupport(query, parameters);
      }

      const conn = await pool.getConnection();
      try {
        const result = await conn.exec(query, parameters);
        return result;
      } catch (err) {
        throw err;
      } finally {
        conn.disconnect();
      }
    }

    /**
     * Executes a series of actions within a database transaction.
     * @param {Function} actions - The actions to be executed within the transaction.
     * @returns {Promise<void>} A promise indicating the completion of the transaction.
     * @throws {Error} If an error occurs during transaction execution.
     */
    async function executeInTransaction(
      actions: (conn: hana.Connection) => Promise<void>
    ) {
      const conn = await pool.getConnection();
      try {
        await conn.setAutoCommit(false);
        await actions(conn);
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.disconnect();
      }
    }

    fastify.decorate("hana", hana);
    fastify.decorate("hanaPool", pool);
    fastify.decorate("executeQuery", executeQuery);
    fastify.decorate("executeInTransaction", executeInTransaction);

    // Clear the pool on application close
    fastify.addHook("onClose", async (_instance, done) => {
      await pool.clear();
      done();
    });
  },
  {
    fastify: "4.x",
    name: "fastify-hana",
  }
);
