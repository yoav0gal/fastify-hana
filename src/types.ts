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

export type HanaClientExplicitPoolParams = {
  /** Maximum number of open connections created by the pool. defaults. @default 0 - no limit */
  maxConnectedOrPooled?: number;
  /** Maximum time, in seconds, that connections are allowed to remain in the pool. @default - 0 no limit */
  maxPooledIdleTime?: number;
  /** Whether or not the pooled connection should be tested for viability before being reused. @default false */
  pingCheck?: boolean;
  /** Maximum number of connections allowed to be in the pool, waiting to be reused.@default 0 - no limit */
  poolCapacity?: number;
};

export interface HanaOptions {
  host: string;
  port: string;
  user: string;
  password: string;
  poolOptions?: HanaClientExplicitPoolParams;
}
