import * as hana from "@sap/hana-client";

declare module "fastify" {
  interface FastifyInstance {
    hana: typeof hana;
    hanaPool: hana.ConnectionPool;
    executeQuery: (
      query: string,
      parameters?: ExecuteQueryParameters
    ) => Promise<any>;
    executeInTransaction: (
      actions: (conn: hana.Connection) => Promise<void>
    ) => Promise<void>;
  }
}

export type ExecuteQueryParameters = { [key: string]: any } | any[];

export interface HanaOptions {
  host: string;
  port: string;
  user: string;
  password: string;
  poolMax?: number;
  poolMin?: number;
}
