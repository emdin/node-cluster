var util = require('util');

// Setup child a child (worker) process
exports.setup = function() {
  // Handle incomming messages from master
  process.on('message', handleMessage);

  util.log('NOTICE: A child now runs pid#'+process.pid);
  return true;
}


// Got message from master
//
// @param {Object} Message with key `key`
function handleMessage(msg) {
  if (msg && typeof msg === 'object' && 'key' in msg) {
    switch (msg.key) {
      case 'fetch-health':
        // Handle next time there's free resources.
        // This is also a speed indicator.
        process.nextTick(function() {
          process.send(fetchHealth(msg.startBench));
        });
        break;
    }
  }
}

// Reports current process health
// Includes benchmark start time if given by master
//
// @params {Array} benchmark start object (or will be created now)
function fetchHealth(startBench) {
  return {
    key: 'health-report',
    id: process.getgid(),
    pid: process.pid,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    startBench: startBench || process.hrtime()
  }
}
