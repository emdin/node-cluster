/**
 * Target is to implement a solid failover via node child processes.
 * Each process shall report deep health status to it's master.
 * The master process is only checking it's children and reporting.
 *
 * Definitions
 *
 * - Master: The master process, holding n children (depending on CPU)
 * - Worker: A child process that actually runs the app
 *
 * Cases to consider:
 * - Worker goes down by accident: respawn
 * - Worker goes down on purpose (SIGTERM): don't respawn
 * - Master goes down on purpose (SIGTERM): kill all children
 * - Monitoring / Health check:
 *   - Let children report to master for logging
 *     - e.g. process.memoryUsage()
 *   - Send message to worker in intervals. Kill them and respawn
 *     if not responding.
 */

var cluster = require('cluster')
  , util = require('util')
  , winston = require('winston')
  , master = require('./master')
  , child = require('./child')

exports.spawn = spawn;

function spawn(runApp) {
  if (cluster.isMaster) master.setup();
  else child.setup() && runApp();
}

function setupWinston() {
  var defaultConsoleOptions = {}
    , defaultFileOptions = { timestamp: true, filename: 'log/all.log' };

  // Use console for logging
  winston.add(winston.transports.Console, defaultConsoleOptions);

  // Use file system for logging
  winston.add(winston.transports.File, defaultFileOptions);
}
