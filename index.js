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
const TOPIC = "quickstart-events";
const sendToProducer = async (json) => {
  await producer.connect();
  await producer.send({
    topic: TOPIC,
    messages: json,
  });

  await producer.disconnect();
};

const waitForConsumer = async () => {
  const consumer = kafka.consumer({ groupId: "test-group" });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        value: message.value.toString(),
      });
    },
  });
};
waitForConsumer();

app.post("/event", function (req, res) {
  res.statusCode = 200;
  // json
  const { body } = req;
  const arr = Object.keys(body).map((k) => {
    return { key: k, value: body[k] };
  });
  console.log(arr);

  sendToProducer(arr);
  res.send({ ...body });
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "minesweeper", "index.html"));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
