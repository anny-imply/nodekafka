const { Kafka, Partitioners } = require("kafkajs");
const express = require("express");
const path = require("path");
var bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

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

app.get("/get-events", function (req, res) {
  console.log(req.query.dataSource);
  res.send({});
});

app.get("/graph", function (_, res) {
  res.sendFile(path.join(__dirname, "public", "graph.html"));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
