import * as hana from "@sap/hana-client";

declare module "fastify" {
  interface FastifyInstance {
    hanaPool: hana.ConnectionPool;
    executeQuery: (query: string, parameters?: any[]) => Promise<any>;
    executeInTransaction: (
      actions: (conn: hana.Connection) => Promise<void>
    ) => Promise<void>;
  }
}

export interface HanaOptions {
  host: string;
  port: string;
  user: string;
  password: string;
  poolMax?: number;
  poolMin?: number;
}
