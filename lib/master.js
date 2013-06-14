var cluster = require('cluster')
  , exitSignals = ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT']
  , healthCheckInterval = 60 * 100
  , numCPUs = require('os').cpus().length
  , logger = require('winston')
  , stats = require('./munin/setup');

// Setup master process
exports.setup = function () {
  // Make sure everything get's shut down
  exitSignals.forEach(function(signal) {
    process.on(signal, function() { exit(signal) });
  });

  // Setup munin reports
  stats.setup(require('/Users/pex/Projects/temp/nodejs-munin'));

  // Let's milk the CPU :)
  for(var i = 0; i < numCPUs; i++) spawnWorker();

  // Bind events
  cluster.on('exit', checkDeath);

  // Fetch health-report from clusters every `healthCheckInterval`
  setInterval(healthCheck, healthCheckInterval);

  logger.log('info', 'Master now runs pid#%d', process.pid);

  return true;
}

// Exit all spawned workers
//
// @param {String} Signal of death
function exit(signal) {
  forAllWorkers(function(worker) {
    logger.log('info', '  Killing worker pid#%d with `%s`', worker.process.pid, signal);
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
  logger.log('info', '  Worker pid#%d killed by `%s`', worker.process.pid, signal || null);
  if (worker.suicide)
    logger.log('info', '        by committing suicide.');
  else {
    logger.log('error', '        something went wrong. Respawning..');
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
  // Init stats for this worker
  stats.initStats(worker.process.pid);
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
        msg.responseTime = diffBench(msg.startBench);

        // Report health report
        stats.report(msg)

        break;
    }
  }
}

// Calculate response time for benchmark
function diffBench(start) {
  var diffBench = process.hrtime(start);
  return diffBench[0] * 1e9 + diffBench[1];
}
