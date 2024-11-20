import { Kafka, Partitioners } from "kafkajs";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { getJSON } from "./utils";

const app = express();
app.use(bodyParser.json());
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

app.use(express.static(__dirname + "/public"));
const port = 3000;

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});
const TOPIC = "new-events";
const sendToProducer = async (json) => {
  await producer.connect();
  await producer.send({
    topic: TOPIC,
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

app.get("/get-events", async function (req, res) {
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
