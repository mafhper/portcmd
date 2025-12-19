/**
 * AI Queue - Sequential job processing
 * Prevents concurrent heavy operations (IA + Lighthouse)
 */
const queue = [];
let running = false;

async function runNext() {
    if (running || queue.length === 0) return;

    running = true;
    const job = queue.shift();

    try {
        const result = await job.fn();
        job.resolve(result);
    } catch (e) {
        job.reject(e);
    } finally {
        running = false;
        runNext();
    }
}

function enqueue(fn) {
    return new Promise((resolve, reject) => {
        queue.push({ fn, resolve, reject });
        runNext();
    });
}

function getQueueLength() {
    return queue.length;
}

function isRunning() {
    return running;
}

module.exports = { enqueue, getQueueLength, isRunning };
