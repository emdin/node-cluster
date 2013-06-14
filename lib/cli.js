#!/usr/bin/env node

/**
 * Run it
 *
 * .. just like any other node app. pass the file workers should run.
 *
 * @param {String} path of app workers should run.
 *
 *    $ node index.js app=app.js
 */

var fs = require("fs")
  , appPath
  , runApp;

// Let's find out which worker we shall call.
process.argv.forEach(function(argument) {
  var match = /app=([\w,.,\/,-]+)/g.exec(argument);
  if (match) appPath = match[1];
});

// Load application or raise missing argument.
if (appPath) {
  var runApp = function() {
    try {
      require(fs.realpathSync(appPath));
    } catch(err) {
      console.error('ERROR: worker-app not found in path %s (%s)', appPath, err);
      process.send('app-load-error');
    }
  }
} else {
  console.error('\
    ERROR: wrong number of arguments. Missing `app`\n\
    Example:\n\
    \n\
    $ node index.js app=app.js\n'
  );
  process.exit(1);
}

// Actually spawn our processes
require('./cluster').spawn(runApp);
