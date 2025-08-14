const bullMQ = require('./BullMQManager.js');
const os = require('os');
const Constants = require('./../utils/constants.js')
const { auctionExpiryProcessor, emailSenderProcessor } = require('./helper.js');
const cpuCount = os.cpus().length;

(async () => {
  try {
    // Define queues and their processors
    const queuesData = [
      {
        name: Constants.QueueNames.AUCTION_EXPIRE,
        processor: auctionExpiryProcessor,
      },
      {
        name: Constants.QueueNames.EMAIL_SENDER,
        processor: emailSenderProcessor,
      },
    ];

    // Function to create a queue and its workers
    const createQueue = (queueName, queueProcessor) => {
      console.log(`Creating queue "${queueName}"...`);

      // Create the queue
      bullMQ.createQueue(queueName);

      // Calculate number of workers per queue
      const workersPerQueue = Math.ceil(cpuCount / queuesData.length);

      // Start multiple workers for the queue
      console.log(`Starting ${workersPerQueue} workers for queue "${queueName}"...`);
      bullMQ.startMultipleWorkers(queueName, queueProcessor, workersPerQueue);
    };

    // Iterate over queue definitions and create them
    queuesData.forEach((queue) => {
      createQueue(queue.name, queue.processor);
    });

    console.log('All queues and workers started successfully!');
  } catch (err) {
    console.error('Error starting queues or workers:', err.message);
  }
})();
