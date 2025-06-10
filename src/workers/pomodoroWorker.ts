let timerInterval: number | null = null;
let remainingTime: number = 0;
let isRunning: boolean = false;

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'START':
      if (!isRunning) {
        remainingTime = payload.duration;
        isRunning = true;
        startTimer();
      }
      break;

    case 'PAUSE':
      if (isRunning) {
        isRunning = false;
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }
      break;

    case 'RESET':
      isRunning = false;
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      remainingTime = payload.duration;
      self.postMessage({ type: 'TICK', payload: { remainingTime } });
      break;

    case 'STOP':
      isRunning = false;
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      break;
  }
};

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = self.setInterval(() => {
    if (remainingTime > 0) {
      remainingTime -= 1;
      self.postMessage({ type: 'TICK', payload: { remainingTime } });
    } else {
      isRunning = false;
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      self.postMessage({ type: 'COMPLETE' });
    }
  }, 1000);
} 