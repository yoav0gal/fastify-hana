import { HanaOptions, ExecuteQueryParameters } from "../src/types";
import { namedParameterBindingSupport } from "../src/namedParametersSupport";
import * as proxyquire from "proxyquire";

/** Configs for the hana connection*/
export const FASTIFY_HANA_OPTS = {
  host: "localhost",
  port: "39015",
  user: "system",
  password: "manager",
} as HanaOptions;

/** Mock data for db */
export const MOCK_DATA = [{ id: 1, value: "test" }];

/**
 * Mocks the execution of a database query.
 * @param {string} query - The query string to be executed.
 * @param {ExecuteQueryParameters} params - The parameters for the query.
 * @returns {Promise<any>} A promise resolving to the mocked query result.
 * @throws {Error} If the number of parameters in the query does not match the provided parameters.
 */
async function mockExec(query: string, params: ExecuteQueryParameters) {
  if (!Array.isArray(params)) {
    [query, params] = namedParameterBindingSupport(query, params);
  }

  const paramUsesInQuery = countSubstringOccurrences(query, "?");

  if (paramUsesInQuery === params.length) return MOCK_DATA;

  throw new Error("Missing parameters !");
}

/**
 * Counts the number of occurrences of a substring within a string.
 * @param {string} str - The string to search in.
 * @param {string} substring - The substring to search for.
 * @returns {number} The count of substring occurrences.
 */
function countSubstringOccurrences(str: string, substring: string) {
  let count = 0;
  let startIndex = 0;

  while (true) {
    const index = str.indexOf(substring, startIndex);
    if (index === -1) {
      break;
    }
    count++;
    startIndex = index + substring.length;
  }

  return count;
}

const hanaClientMock = {
  createPool: () => ({
    getConnection: async () => ({
      exec: mockExec, // Mocking the exec function
      disconnect: async () => {},
      setAutoCommit: async () => {},
      commit: async () => {},
      rollback: async () => {},
    }),
    clear: async () => {},
  }),
};

export const fastifyHana = proxyquire("../src", {
  "@sap/hana-client": hanaClientMock,
});
