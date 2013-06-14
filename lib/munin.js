var config = require('../config/munin')
  , stats;

exports.stats = stats;

// Setup config and describe possible stat-keys
exports.setup = function(munin) {
  stats = munin(config);

  return stats;
}

exports.initStat = function(pid) {
  forEachStatKey(function(key) {
    stats.initStat(getStatKey(pid, key), { label: 'pid#'+pid });
  });
}

exports.setupGraphs = function(pids) {
  forEachStatKey(function(key) {
    stats.describeGraph(key, {}, getStatKeys(pids, key));
  });
}

// Report any given key to munin stats
exports.report = function(data) {
  forEachStatKey(function(key) {
    stats.setStat(getStatKey(data.pid, key), data[key]);
  });
}

// Create keys for all pids (and use `map` in the future!)
function getStatKeys(pids, key) {
  var keys = [];
  for (id in pids) {
    keys.push('pid#'+pids[id]+'|'+key);
  }
  return keys;
}

// Create a single key for pid
function getStatKey(pid, key) {
  return 'pid#'+pid+'|'+key;
}

function forEachStatKey(callback) {
  var keys = config.statsKeys;
  for (var id in keys) callback(keys[id]);
}