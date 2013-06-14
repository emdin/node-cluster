var config = require('../../config/munin')
  , stats;

exports.stats = stats;

// Setup config and describe possible stat-keys
exports.setup = function(munin) {
  stats = munin(config);
  stats.availableStatsKeys = config.statsKeys;

  return stats;
}

exports.initStats = function(pid) {
  for (var id in config.statsKeys) {
    var key = config.statsKeys[id];
    stats.describeGraph(key, {}, [key]);
    stats.initStat(key, { label: 'pid#'+pid+'|'+key });
  }
}

// Report any given key to munin stats
exports.report = function(data) {
  var keys = stats.availableStatsKeys;
  for (var id in keys) {
    var key = keys[id];
    stats.setStat(key, data[key]);
    console.log(key + ' ' + data[key])
  }
}
