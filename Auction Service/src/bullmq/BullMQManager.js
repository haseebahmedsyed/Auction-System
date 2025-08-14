const { Queue, Worker } = require('bullmq');

class BullMQManager {
  constructor() {
    if (BullMQManager.instance) return BullMQManager.instance;

    this.connection = { host: '127.0.0.1', port: 6379 };
    this.queues = {};
    this.workers = {}; // Stores workers for each queue

    BullMQManager.instance = this;
  }

  /**
   * Create a queue with the given name
   * @param {string} queueName - The name of the queue
   */
  createQueue(queueName) {
    if (!this.queues[queueName]) {
      this.queues[queueName] = new Queue(queueName, { connection: this.connection });
      console.log(`Queue "${queueName}" created.`);
    }
  }

  /**
   * Add a job to the specified queue
   * @param {string} queueName - Name of the queue
   * @param {string} jobName - Name of the job
   * @param {object} data - Job data
   * @param {object} options - Job options (e.g., delay)
   */
  async addJob(queueName, jobName, data, options = {}) {
    if (!this.queues[queueName]) {
      throw new Error(`Queue "${queueName}" does not exist. Create it first.`);
    }
    await this.queues[queueName].add(jobName, data, options);
    console.log(`Job "${jobName}" added to queue "${queueName}" with options:`, options);
  }

  /**
 * Check if a job with the given ID exists in the queue
 * @param {string} queueName - The name of the queue
 * @param {string} jobId - The ID of the job to check
 * @returns {Promise<boolean>} - True if job exists, false otherwise
 */
  async jobExists(queueName, jobId) {
    if (!this.queues[queueName]) {
      return false;
    }

    const job = await this.queues[queueName].getJob(jobId);
    return !!job; // returns true if job exists, false otherwise
  }

  /**
   * Start multiple workers for the same queue
   * @param {string} queueName - Name of the queue
   * @param {Function} processor - Function to process jobs
   * @param {number} numWorkers - Number of workers to start
   */
  startMultipleWorkers(queueName, processor, numWorkers = 1) {
    if (!this.queues[queueName]) {
      throw new Error(`Queue "${queueName}" does not exist. Create it first.`);
    }

    if (!this.workers[queueName]) {
      this.workers[queueName] = [];
    }

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(
        queueName,
        async (job) => {
          try {
            console.log(`Worker ${i + 1} processing job ${job.id} in queue "${queueName}" with data:`, job.data);
            await processor(job);
            console.log(`Worker ${i + 1} completed job ${job.id} in queue "${queueName}".`);
          } catch (err) {
            console.error(`Worker ${i + 1} failed to process job ${job.id}:`, err);
          }
        },
        { connection: this.connection }
      );

      worker.on('completed', (job) => {
        console.log(`Job ${job.id} in queue "${queueName}" completed successfully.`);
      });

      worker.on('failed', (job, err) => {
        console.error(`Job ${job.id} in queue "${queueName}" failed with error: ${err.message}`);
      });

      worker.on('error', (err) => {
        console.error(`Worker ${i + 1} encountered an error:`, err);
      });

      this.workers[queueName].push(worker);
      console.log(`Worker ${i + 1} started for queue "${queueName}".`);
    }
  }

  /**
   * Gracefully shuts down all workers and queues
   */
  async close() {
    console.log("Shutting down all queues and workers...");

    for (const queueName in this.workers) {
      if (this.workers[queueName]) {
        for (const worker of this.workers[queueName]) {
          await worker.close();
          console.log(`Worker for queue "${queueName}" shut down.`);
        }
      }
    }

    for (const queueName in this.queues) {
      if (this.queues[queueName]) {
        await this.queues[queueName].close();
        console.log(`Queue "${queueName}" closed.`);
      }
    }
  }
}

// Ensure cleanup before exit
const instance = new BullMQManager();
process.on("SIGINT", async () => {
  await instance.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await instance.close();
  process.exit(0);
});

module.exports = instance;
