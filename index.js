import { Kafka, Partitioners } from "kafkajs";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

app.use(express.static(__dirname + "/public"));
const port = 3000;

const kafka = new Kafka({
  brokers: ["localhost:9092"],
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});
const topic = "new-events";
const sendToProducer = async (json) => {
  await producer.connect();
  await producer.send({
    topic,
    messages: [json],
  });

  await producer.disconnect();
};

app.post("/event", function (req, res) {
  res.statusCode = 200;
  const { body } = req;
  const _time = body.time;
  delete body.time;
  sendToProducer({ key: _time, value: JSON.stringify(body) });
  res.send({ ...body });
});

app.get("/game", function (_, res) {
  res.sendFile(path.join(__dirname, "public", "minesweeper", "game.html"));
});

const getJSON = (dataSource) => {
  return {
    query: `WITH s AS (SELECT\n"segment_id",\n"datasource",\n"start",\n"end",\n"version",\n"shard_spec",\n"partition_num",\n"size",\n"num_rows",\nCASE WHEN "num_rows" <> 0 THEN ("size" / "num_rows") ELSE 0 END AS "avg_row_size",\n"num_replicas",\n"replication_factor",\n"is_available",\n"is_active",\n"is_realtime"\nFROM sys.segments)\nSELECT *\nFROM s\nWHERE "datasource" = \'${dataSource}\'\nORDER BY "start" DESC, "version" DESC\nLIMIT 50`,
  };
};

app.get("/get-events", async function (req, res) {
  const { start, end, version } = req.query;
  const response = await fetch("http://localhost:8888/druid/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      queryType: "scan",
      dataSource: "new-events",
      intervals: {
        type: "segments",
        segments: [
          {
            itvl: `${start}/${end}`, // "2024-11-20T00:00:00.000Z/2024-11-21T00:00:00.000Z",
            ver: version, //"2024-11-20T19:04:38.425Z",
            part: 1,
          },
        ],
      },
      resultFormat: "compactedList",
      limit: 1001,
      columns: [],
      granularity: "all",
      context: { sqlOuterLimit: 100 },
    }),
  });
  const data = await response.json();

  res.send({ data });
});

app.get("/get-segments", async function (req, res) {
  const { dataSource } = req.query;
  if (!dataSource) throw new Error("Expected dataSource to be defined");
  const response = await fetch("http://localhost:8888/druid/v2/sql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(getJSON(dataSource)),
  });
  const data = await response.json();

  res.send({ data });
});

app.get("/graph", function (_, res) {
  res.sendFile(path.join(__dirname, "public", "graph.html"));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
