<div disply="flex"> <a href="https://fastify.io/">
    <img
      src="https://github.com/fastify/graphics/raw/HEAD/fastify-landscape-outlined.svg"
      width="400"
      height="auto"
    />
      <img
      src="https://www.vision33.com/hs-fs/hubfs/ARedesign%202018/SAP%20Business%20One%20Pages/SAP-HANA-logo_160330_154207.png?width=600&name=SAP-HANA-logo_160330_154207.png"
      width="400"
      height="auto"
    />
   
  </a>
</div>

# fastify-hana

[![Beta](https://img.shields.io/badge/status-beta-orange.svg)](https://github.com/yoav0gal/fastify-hana)
[![npm version](https://img.shields.io/npm/v/fastify-hana.svg?style=flat-square)](https://www.npmjs.com/package/fastify-hana)
[![License](https://img.shields.io/npm/l/fastify-hana.svg?style=flat-square)](https://github.com/example-user/fastify-hana/blob/main/LICENSE)

SAP HANA integration plugin for Fastify

The fastify-hana plugin provides seamless integration between [Fastify](https://www.fastify.io/) and SAP HANA, allowing you to easily connect and interact with your SAP HANA database within your Fastify application.

Under the hood, this plugin utilizes the official [@sap/hana-client](https://www.npmjs.com/package/@sap/hana-client) library to ensure reliable and high-performance connectivity to HANA databases.
Read more about the hana client [here!](https://help.sap.com/docs/HANA_SERVICE_CF/1efad1691c1f496b8b580064a6536c2d/a5c332936d9f47d8b820a4ecc427352c.html)

## Features

- Establishes a connection pool to efficiently manage database connections.
- Provides decorators to execute queries and transactions with ease.
- Supports named parameter binding for convenient and secure query execution.
- Handles connection pooling and connection lifecycle management automatically.
- Offers flexibility to directly access the underlying HANA Client API if needed.

---

## Installation

```shell
npm install --save @yoav0gal/fastify-hana
```

---

## Usage

Firstly, register the plugin:

```ts
import fastify from "fastify";
import hanaFastifyPlugin, { HanaOptions } from "@yoav0gal/fastify-hana";

const server = fastify();

const hanaOpts: HanaOptions = {
  host: "myHanaHost",
  port: "30015",
  user: "myUser",
  password: "myPassword",
  poolMax: 10, // Optional. Default: 10
  poolMin: 0, // Optional. Default: 0
};

server.register(hanaFastifyPlugin, hanaOpts);
```

---

## HanaOptions

When registering the plugin, you need to provide `HanaOptions`:

| **Option** | **Type** |                                                             **Description** |
| :--------- | :------: | --------------------------------------------------------------------------: |
| `host`     |  string  |                           The hostname or IP address of the SAP HANA server |
| `port`     |  string  |                     The port number where the SAP HANA server is listening. |
| `user`     |  string  |                      The username to authenticate with the SAP HANA server. |
| `password` |  string  |                      The password to authenticate with the SAP HANA server. |
| `poolMax`  |  number  | (optional) The maximum number of connections in the pool. `Defaults to 10`. |
| `poolMin`  |  number  |  (optional) The minimum number of connections in the pool. `Defaults to 0`. |

---

## API

## fatify decorators

The plugin adds the following decorators to the Fastify instance:

- [executeQuery](#executeQuery)
- [executeInTransaction](#executeInTransaction)
- [hanaPool](#hanaPool)
- [hana](#hana)

## utill functions

- [namedParameterBindingSupport](#namedParameterBindingSupport)

---

### `executeQuery`

Executes a query on the HANA database.

**Example 1: Basic Query**

```ts
server.get("/runQuery", async (request, reply) => {
  const result = await server.executeQuery("SELECT * FROM DUMMY");
  return result;
});
```

**Example 2: Query with Index-Based Parameter Binding**

```ts
server.get("/index-based-paramters-bining", async (request, reply) => {
  const result = await server.executeQuery(
    "SELECT * FROM MY_TABLE WHERE ID = ?",
    [1]
  );
  return result;
});
```

**Example 3: Query with Named Parameters Binding**

```ts
server.post("/named-parameters-binding", async (request, reply) => {
  try {
    const { id, name, age } = request.body;

    const query =
      "INSERT INTO myTable (id, name, age) VALUES (:id, :name, :age)";
    const parameters = { id, name, age };

    const result = await fastify.executeQuery(query, parameters);
    console.log(result); // Process the query result

    reply.send({ success: true, message: "Record inserted successfully" });
  } catch (error) {
    console.error(error); // Handle any errors
    reply
      .status(500)
      .send({ success: false, message: "Error inserting record" });
  }
});
```

---

### `executeInTransaction`

Executes a set of actions in a transaction:

```ts
server.get("/runTransaction", async (request, reply) => {
  await server.executeInTransaction(async (conn) => {
    await conn.exec("INSERT INTO MY_TABLE (ID, NAME) VALUES (?, ?)", [
      1,
      "name1",
    ]);
    await conn.exec("INSERT INTO MY_TABLE (ID, NAME) VALUES (?, ?)", [
      2,
      "name2",
    ]);
  });

  return { status: "ok" };
});
```

> **NOTE:** If the transaction function fail a roll back to the transaction begining will take place.

> In this example, if either of the INSERT statements fails, both will be rolled back.

---

### `hanaPool`

This decorator returns the pool instance, giving you full control and responsibility over the connections. **Use with caution!**

#### Using `hanaPool` to execute a batch operation:

```ts
server.post("/batchInsert", async (request, reply) => {
  const data = request.body; // Assume this is an array of arrays, where each sub-array contains field values
  const conn = await server.hanaPool.getConnection();
  try {
    const stmt = conn.prepare(
      "INSERT INTO MY_TABLE (FIELD1, FIELD2) VALUES(?, ?)"
    );
    for (const row of data) {
      stmt.add(row);
    }
    stmt.execBatch((err, results) => {
      if (err) throw err;
      // handle results
    });
  } finally {
    conn.disconnect();
  }
});
```

#### Using `hanaPool` to manage connections directly:

```ts
server.get("/directConnectionManagement", async (request, reply) => {
  const conn = await server.hanaPool.getConnection();
  try {
    await conn.setAutoCommit(false);
    await conn.exec("INSERT INTO MY_TABLE (ID, NAME) VALUES (?, ?)", [
      1,
      "name1",
    ]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.disconnect();
  }
});
```

---

### `hana`

In some cases, you might need to establish a custom connection to the HANA database that uses different connection parameters than the default pool. For example, you might need to connect to a different database, or use different credentials. In this case, you could use `hana` decorator to create a new, custom connection.

```ts
import Fastify from "fastify";
import fastifyHana, { namedParameterBindingSupport } from "fastify-hana";

const fastify = Fastify();

fastify.register(fastifyHana, {
  host: "defaultHost", // Default values, these would ideally come from environment variables or config
  port: "defaultPort",
  user: "defaultUser",
  password: "defaultPassword",
});

fastify.post("/customConnection", async (request, reply) => {
  const { host, port, user, password, query, params } = request.body as any;

  const connectionParameters = {
    serverNode: `${host}:${port}`,
    uid: user,
    pwd: password,
  };

  const connection = fastify.hana.createConnection();

  connection.connect(connectionParameters, (err) => {
    if (err) {
      reply
        .code(500)
        .send({ error: "Failed to connect to HANA database", details: err });
    } else {
      // Convert named parameters to index-based binding
      const [formattedQuery, queryParameters] = namedParameterBindingSupport(
        query,
        params
      );

      connection.exec(formattedQuery, queryParameters, (error, results) => {
        if (error) {
          reply
            .code(500)
            .send({ error: "Query execution failed", details: error });
        } else {
          reply.send(results);
        }

        // Always disconnect after you're done.
        connection.disconnect();
      });
    }
  });
});

fastify.listen(3000, (err) => {
  if (err) throw err;
  console.log("Server is running on port 3000");
});
```

> **NOTE:** Connections created via the `hana` decorator would not be managed by the plugin's connection pool. This means that connections created this way would not be reused, and the pooling mechanisms provided by the plugin would not be effective. Each connection created using the decorated `hana` would be separate and not part of the connection pool.

> If your use case requires users to create their own connections manually and bypass the connection pooling provided by the plugin, use the `hana` decorator. However, it's important to carefully manage and handle the lifecycle of these connections to ensure efficient resource utilization.

---

### `namedParameterBindingSupport`

Enables named parametes binding.

```ts
import fastify from "fastify";
import fastifyHana, { namedParameterBindingSupport } from "./fastify-hana"; // Replace with the path to your plugin file

// Create a Fastify server instance
const app = fastify();

// Register the HANA plugin
app.register(fastifyHana, {
  host: "your-host",
  port: "your-port",
  user: "your-username",
  password: "your-password",
  poolMax: 10,
  poolMin: 0,
});

// Define a route that uses `executeInTransaction` and `namedParameterBindingSupport`
app.post("/transaction-route", async (request, reply) => {
  try {
    const { id, name, age } = request.body;

    const actions = async (conn) => {
      const query1 =
        "INSERT INTO myTable (id, name, age) VALUES (:id, :name, :age)";
      const parameters1 = { id, name, age };

      const [formattedQuery1, paramValues1] = namedParameterBindingSupport(
        query1,
        parameters1
      );

      await conn.exec(formattedQuery1, paramValues1);

      const query2 = "UPDATE myTable SET name = :newName WHERE id = :id";
      const parameters2 = { id, newName: "John Doe" };

      const [formattedQuery2, paramValues2] = namedParameterBindingSupport(
        query2,
        parameters2
      );

      await conn.exec(formattedQuery2, paramValues2);
    };

    await app.executeInTransaction(actions);

    reply.send({ success: true, message: "Transaction executed successfully" });
  } catch (error) {
    console.error(error); // Handle any errors
    reply
      .status(500)
      .send({ success: false, message: "Error executing transaction" });
  }
});

// Start the server
app.listen(3000, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Server is running on port 3000");
});
```

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](https://choosealicense.com/licenses/mit/)
