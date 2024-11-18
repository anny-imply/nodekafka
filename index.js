const { Kafka, Partitioners } = require("kafkajs");

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
