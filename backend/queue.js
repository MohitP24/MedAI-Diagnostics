/**
 * Simple FIFO Queue for serializing Python inference tasks
 * Ensures only one Python process runs at a time to avoid memory spikes
 */

class InferenceQueue {
    constructor(maxConcurrency = 1) {
        this.queue = [];
        this.running = 0;
        this.maxConcurrency = maxConcurrency;
    }

    /**
     * Enqueue a task and wait for it to complete
     * @param {Function} task - Async function to execute
     * @returns {Promise} - Resolves when task completes
     */
    async enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Process the next task in the queue if capacity available
     */
    async processQueue() {
        if (this.running >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }

        this.running++;
        const { task, resolve, reject } = this.queue.shift();

        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.running--;
            this.processQueue(); // Process next task
        }
    }

    /**
     * Get current queue status
     */
    getStatus() {
        return {
            queueLength: this.queue.length,
            running: this.running,
            maxConcurrency: this.maxConcurrency
        };
    }
}

module.exports = InferenceQueue;
