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

This plugin integrates [SAP HANA client](https://help.sap.com/docs/HANA_SERVICE_CF/1efad1691c1f496b8b580064a6536c2d/a5c332936d9f47d8b820a4ecc427352c.html) with Fastify. It manages a connection pool, provides a utility to execute queries, and handles transactions on the SAP HANA database.

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

## Decorators

The plugin adds the following decorators to the Fastify instance:

### `executeQuery`

Executes a query on the HANA database:

```ts
server.get("/runQuery", async (request, reply) => {
  const result = await server.executeQuery("SELECT * FROM DUMMY");
  return result;
});
```

You can also pass parameters to your query:

```ts
server.get("/runQuery", async (request, reply) => {
  const result = await server.executeQuery(
    "SELECT * FROM MY_TABLE WHERE ID = ?",
    [1]
  );
  return result;
});
```

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

In this example, if either of the INSERT statements fails, both will be rolled back.

### `hanaPool`

This decorator returns the pool instance thus giving full control and responsibility over the connections.
**use with caution!**

Using hanaPool to execute a batch operation:

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

Using hanaPool to manage connections directly:

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

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](https://choosealicense.com/licenses/mit/)
