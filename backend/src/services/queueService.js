const EventEmitter = require('events');
const { logger } = require('../utils/logger');

class QueueService extends EventEmitter {
    constructor(maxConcurrency = 1) {
        super();
        this.queue = [];
        this.running = 0;
        this.maxConcurrency = maxConcurrency;
        this.totalProcessed = 0;
        this.isDraining = false;
    }

    /**
     * Enqueue a task and wait for it to complete
     */
    async enqueue(task, metadata = {}) {
        if (this.isDraining) {
            throw new Error('Queue is draining, accepting no new tasks');
        }

        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject, metadata, queuedAt: Date.now() });
            this.emit('task_queued', { queueDepth: this.queue.length });
            this.processQueue();
        });
    }

    /**
     * Process the next task if capacity available
     */
    async processQueue() {
        if (this.running >= this.maxConcurrency || this.queue.length === 0) {
            if (this.isDraining && this.running === 0 && this.queue.length === 0) {
                this.emit('drain_complete');
            }
            return;
        }

        this.running++;
        const { task, resolve, reject, queuedAt } = this.queue.shift();
        
        const waitTime = Date.now() - queuedAt;
        if (waitTime > 1000) {
            logger.warn(`Task waited in queue for ${waitTime}ms`);
        }

        try {
            this.emit('task_started', { running: this.running });
            const result = await task();
            resolve(result);
            this.totalProcessed++;
            this.emit('task_completed', { totalProcessed: this.totalProcessed });
        } catch (error) {
            reject(error);
            this.emit('task_failed', { error: error.message });
        } finally {
            this.running--;
            this.processQueue();
        }
    }

    /**
     * Get queue metrics
     */
    getStatus() {
        return {
            queueDepth: this.queue.length,
            running: this.running,
            maxConcurrency: this.maxConcurrency,
            totalProcessed: this.totalProcessed,
            isDraining: this.isDraining
        };
    }

    /**
     * Stop accepting new tasks and wait for existing ones to finish
     */
    async drain() {
        logger.info('Queue draining started');
        this.isDraining = true;
        
        if (this.running === 0 && this.queue.length === 0) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.once('drain_complete', () => {
                logger.info('Queue draining complete');
                resolve();
            });
        });
    }
}

// Singleton instance
const queueService = new QueueService(1); // Keep concurrency at 1 for Render Free Tier

module.exports = queueService;
