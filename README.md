# e2e-bridge-cli

A command-line interface to E2E Bridge based on Node.js

## Features

* xUML and Node.js Services
    * deploy
    * remove
    * start
    * stop
* xUML Services only
    * kill
* Can be installed as global utility

## Installation
``` bash
$ npm install [-g] e2e-bridge-cli
```
Global installation may require additional privileges.

## Usage
This guide assumes global installation. If you installed locally, replace ``` e2ebridge ``` with ``` node path/to/app.js ``` (or, on linux ``` path/to/app.js ```).

To start, stop or remove a (Node.js) service:  
``` bash
$ e2ebridge start|stop|remove ${ServiceName} [-N|--nodejs] [settings]
```

To deploy a service:  
``` bash
$ e2ebridge deploy ${path/to/repository} [settings] [-o options]
```

To kill a xUML service:
``` bash
$ e2ebridge kill ${ServiceName} [settings]
```

To get usage help:  
``` bash
$ e2ebridge --help
```

### settings:
* -h|--host <FQDN bridge host> The host, that runs the bridge. Defaults to localhost.
* -p|--port <bridge port> The port of the bridge. Defaults to 8080.
* -n|--node <node name> The name of bridge node. Ignored for deployment. Defaults to ${host}.
* -u|--user <bridge user> User that has the right to perform operation on bridge.
		Required. If not given, you'll be prompted for it.
* -P|--password <password for bridge user> Password for the user.
Required. If not given, you'll prompted for it, what is recommended as giving your password
in command line will expose it in your shell's history. Password is masked during prompt.

### options:
A comma-separated list of deployment options.

* startup: Launch service after deployment.
* overwrite: Overwrite existing service if one already exists.
* settings: Overwrite settings and preferences too.

### Other switches:
* -N|--nodejs Assume that the service is a Node.js service. This is ignored for "deploy" and illegal for "kill".

## Usage examples
* Deploy *PurchaseOrderExample* to localhost  
``` bash
$ e2ebridge deploy /tmp/PurchaseOrderExample.rep -u admin -P admin
```

* Deploy *PurchaseOrderExample* to some development server. Overwrite existing instance and startup service afterwards. Additionally do not expose your password in command line (you'll be prompted for it)  
``` bash
$ e2ebridge deploy /tmp/PurchaseOrderExample.rep -u admin -h devserver.my.org -o startup,overwrite
```

* Start *PurchaseOrderExample* on some development server.   
``` bash
$ e2ebridge start PurchaseOrderExample -u admin -h devserver.my.org
```

* Start myNodeServie on some development server (a Node.js service).   
``` bash
$ e2ebridge start myNodeService -u admin -h devserver.my.org -N
```
