import { test } from "tap";
import Fastify from "fastify";
import { namedParameterBindingSupport } from "../src/namedParametersSupport";
import { FASTIFY_HANA_OPTS, MOCK_DATA, fastifyHana } from "./mocksAndConsts";

/**
 * This test ensures that the plugin loads correctly with Fastify.
 * It does not perform any actions, just loads the plugin.
 */
async function loadTest(t) {
  const fastify = Fastify();
  fastify.register(fastifyHana, FASTIFY_HANA_OPTS);

  await fastify.ready();

  t.ok(fastify.hana);
  t.ok(fastify.hanaPool);
  t.ok(fastify.executeQuery);
  t.ok(fastify.executeInTransaction);

  await fastify.close();
}

/**
 * This test would normally run a query against a real or mock HANA database to check that executeQuery is working as expected.
 * This may involve setting up the database, inserting some test data, running the query, and then checking the results.
 * Note that for this test, we'll use a mock
 */
async function executeQueryTest(t) {
  const fastify = Fastify();
  fastify.register(fastifyHana, FASTIFY_HANA_OPTS);

  await fastify.ready();

  const result = await fastify.executeQuery(
    'SELECT * FROM "test_module.test_folder::TestTable" WHERE id = :id',
    { id: 1 }
  );
  t.same(result, MOCK_DATA);

  await fastify.close();
}

/**
 * This test would normally run a query against a real or mock HANA database to check that executeQuery is working as expected.
 * This may involve setting up the database, inserting some test data, running the query, and then checking the results.
 * Note that for this test, we'll use a mock
 */
async function executeQueryFailTest(t) {
  const fastify = Fastify();
  fastify.register(fastifyHana, FASTIFY_HANA_OPTS);

  await fastify.ready();

  try {
    await fastify.executeQuery('SELECT * FROM "test_module.test_folder::TestTable" WHERE id = ?', []);
    t.fail("Should have thrown an error");
  } catch (error) {
    t.type(error, Error);
  }

  await fastify.close();
}

/**
 * This test would normally run a set of actions within a transaction against a real or mock HANA database to check that executeInTransaction is working as expected.
 * This may involve setting up the database, inserting some test data, running the query, and then checking the results.
 * Note that for this sample, we'll use a mock
 */
async function executeInTransactionTest(t) {
  const fastify = Fastify();
  fastify.register(fastifyHana, FASTIFY_HANA_OPTS);

  await fastify.ready();

  // This function was created in order to avoid tap's to-do mesage
  async function validExecuteInTransaction() {
    await fastify.executeInTransaction(async (conn) => {
      await conn.exec('INSERT INTO "my_module.my_folder::MY_TABLE" (ID, NAME) VALUES (:id, :name)', {
        id: 1,
        name: "test",
      });
      await conn.exec('INSERT INTO "my_module.my_folder::MY_TABLE" (ID, NAME) VALUES (?, ?)', [
        2,
        "name2",
      ]);
    });
  }

  t.doesNotThrow(await validExecuteInTransaction);

  await fastify.close();
}

/**
 * This test would normally run a set of actions within a transaction against a real or mock HANA database to check that executeInTransaction is working as expected.
 * This may involve setting up the database, inserting some test data, running the query, and then checking the results.
 * Note that for this sample, we'll use a mock
 */
async function executeInTransactionFailTest(t) {
  const fastify = Fastify();
  fastify.register(fastifyHana, FASTIFY_HANA_OPTS);

  await fastify.ready();

  try {
    await fastify.executeInTransaction(async (conn) => {
      await conn.exec('INSERT INTO "my_module.my_folder::MY_TABLE" (ID, NAME) VALUES (:id, :name)', {
        id: 1,
        name: "test",
      });
      await conn.exec('INSERT INTO "my_module.my_folder::MY_TABLE" (ID, NAME) VALUES (?, ?)', [2]);
    });
    t.fail("Should have thrown an error");
  } catch (error) {
    t.type(error, Error);
  }

  await fastify.close();
}

/**
 * Unit tests for the namedParameterBindingSupport method
 */
function namedParameterBindingTest(t) {
  const [query, parameters] = namedParameterBindingSupport(
    'SELECT * FROM "test_module.test_folder::TestTable" WHERE id = :id AND value = :value',
    { id: 1, value: "test" }
  );

  t.equal(query, 'SELECT * FROM "test_module.test_folder::TestTable" WHERE id = ? AND value = ?');
  t.same(parameters, [1, "test"]);
  t.end();
}

/**
 * Unit tests for the namedParameterBindingSupport method
 */
function namedParameterBindingErrorTest(t) {
  t.throws(
    () =>
      namedParameterBindingSupport(
        'SELECT * FROM "test_module.test_folder::TestTable" WHERE id = :id AND value = :value',
        { id: 1 }
      ),
    new Error("value is missing")
  );
  t.end();
}

test("fastify-hana loads correctly", loadTest);

test("fastify.executeQuery works correctly", executeQueryTest);

test("fastify.executeQuery throws on error", executeQueryFailTest);

test("fastify.executeInTransaction works correctly", executeInTransactionTest);

test(
  "fastify.executeInTransaction throws on error",
  executeInTransactionFailTest
);

test("namedParameterBindingSupport works correctly", namedParameterBindingTest);

test(
  "namedParameterBindingSupport throws for missing parameters",
  namedParameterBindingErrorTest
);
