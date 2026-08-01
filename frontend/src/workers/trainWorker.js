import { createAgent, runEpisode } from '../ai/qlearning.js';

let agent = null;
let cancelled = false;

self.onmessage = (e) => {
  const { type, episodes, batchSize } = e.data;
  if (type === 'start') {
    cancelled = false;
    agent = createAgent();
    runBatches(episodes, batchSize);
  } else if (type === 'cancel') {
    cancelled = true;
  }
};

function runBatches(episodes, batchSize) {
  const history = [];
  let done = 0;

  function runBatch() {
    if (cancelled) {
      self.postMessage({ type: 'cancelled' });
      return;
    }
    const end = Math.min(done + batchSize, episodes);
    for (let i = done; i < end; i++) {
      history.push(runEpisode(agent));
    }
    done = end;

    self.postMessage({ type: 'progress', done, total: episodes });

    if (done < episodes && !cancelled) {
      setTimeout(runBatch, 0);
    } else {
      self.postMessage({
        type: 'done',
        history,
        qTable: Array.from(agent.qTable.entries()),
        epsilon: agent.epsilon,
      });
    }
  }

  runBatch();
}
