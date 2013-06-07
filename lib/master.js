var cluster = require('cluster')
  , util = require('util')
  , exitSignals = ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT']
  , healthCheckInterval = 60 * 100
  , numCPUs = require('os').cpus().length;

// Setup master process
exports.setup = function () {
  // Make sure everything get's shut down
  exitSignals.forEach(function(signal) {
    process.on(signal, function() { exit(signal) });
  });

  // Let's milk the CPU :)
  for(var i = 0; i < numCPUs; i++) spawnWorker();

  // Bind events
  cluster.on('exit', checkDeath);

  // Fetch health-report from clusters every `healthCheckInterval`
  setInterval(healthCheck, healthCheckInterval);

  util.log('NOTICE: Master now runs pid#'+process.pid);

  return true;
}

// Exit all spawned workers
//
// @param {String} Signal of death
function exit(signal) {
  forAllWorkers(function(worker) {
    util.log('  NOTICE: Killing worker pid#'+worker.process.pid+' with `'+signal+'`');
    worker.kill(signal);
  });
  process.exit();
}

// Check wether death was on purpose
// Respawn if it was accidential
//
// @param {Object} Worker
// @param {Object} Code
// @param {Object} Signal
function checkDeath(worker, code, signal) {
  util.log('  NOTICE: Worker pid#'+worker.process.pid+' killed by `'+signal+'`');
  if (worker.suicide)
    util.log('        by committing suicide.');
  else {
    util.log('        something went wrong. Respawning..');
    spawnWorker();
  }
}

// Aks all children for their health status
function healthCheck() {
  forAllWorkers(function(worker) {
    worker.send({ key: 'fetch-health', benchStart: process.hrtime() });
  });
}

// For each worker do ...
function forAllWorkers(callback) {
  for (var id in cluster.workers) {
    callback(cluster.workers[id]);
  }
}

// Setup worker for messaging
function spawnWorker() {
  var worker = cluster.fork();
  worker.on('message', handleMessage)
  return worker;
}

// Got message from worker
//
// @param {Object} Message with key `key`
//
// **Note: context is in worker!!**
function handleMessage(msg) {
  if (typeof msg == 'string') {
    switch (msg) {
      case 'app-load-error':
        exit('SIGTERM');
        break;
    }
  } else if (msg && typeof msg === 'object' && 'key' in msg) {
    switch (msg.key) {
      case 'health-report':
        var diffBench = process.hrtime(msg.startBench);
        msg.bench = diffBench[0] * 1e9 + diffBench[1];

        // @TODO: This could be a little more beautiful..
        console.log('\
  NOTICE: Received health report from pid#%d within %d nanoseconds\n\
          MemoryUsage: %j\n\
          Uptime: %d seconds\n'
        , this.process.pid, msg.bench, msg.memoryUsage, msg.uptime);

        break;
    }
  }
}
