const { Kafka, Partitioners } = require("kafkajs");
const express = require("express");
const path = require("path");

const app = express();
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
const waitForProducer = async () => {
  await producer.connect();
  await producer.send({
    topic: TOPIC,
    messages: [{ value: "Hello KafkaJS user!" }],
  });

  await producer.disconnect();
};
waitForProducer();

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

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "minesweeper", "index.html"));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
