// hana-fastify-plugin.ts
import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import * as hana from "@sap/hana-client";
import { HanaOptions } from "./types";

export default fp<HanaOptions>(
  async (fastify: FastifyInstance, opts: HanaOptions) => {
    const connectionParameters = {
      serverNode: `${opts.host}:${opts.port}`,
      uid: opts.user,
      pwd: opts.password,
      poolMax: opts.poolMax ?? 10,
      poolMin: opts.poolMin ?? 0,
    };

    const pool = hana.createPool(connectionParameters);
    fastify.decorate("hanaPool", pool);

    fastify.decorate(
      "executeQuery",
      async (query: string, parameters: any[] = []) => {
        const conn = await pool.getConnection();
        try {
          const result = await conn.exec(query, parameters);
          return result;
        } finally {
          conn.disconnect();
        }
      }
    );

    fastify.decorate(
      "executeInTransaction",
      async (actions: (conn: hana.Connection) => Promise<void>) => {
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
    );

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
