## Simple cluster wrapper for monitoring and respawning
This is supposed to show the power and reliability of [cluster API](http://nodejs.org/api/cluster.html). It's respawning failing worker (app) processes automatically and is able to report it. This is ment to report system and worker health statuses as well.

### Installing

    $ npm install
    $ npm link

### Running

    $ cluster app=test-app.js

where `test-app.js` is the app to get clustered

### Monitoring via Munin

Using [nodejs-munin](https://github.com/newleafdigital/nodejs-munin), there is a server listing on `127.0.0.1:8082/stats` for munin plugin. This can be changed in `config/munin.json`.

### Debugging
You might run the wrapper by manually calling the cli:

    $ node ./lib/cli.js app=app.js

### TODO
* Modulize monitor (and possibility to disable it)

#### Resources & Thanks
* [DeliveryHero for paying me for this](http://deliveryhero.com/)
* [Idea on health-checks by Thomas Dimson](http://blog.argteam.com/coding/hardening-nodejs-production-process-supervisor/)
* [Rowan Mannings simple intro](http://rowanmanning.com/posts/node-cluster-and-express/)

#### Legal
  Copyright (c) 2013 farbenmeer GmbH
