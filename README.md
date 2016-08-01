# e2e-bridge-cli

A command-line interface to E2E Bridge based on Node.js

## Features

* xUML, Node.js or Java Services
    * deploy
    * remove
    * start
    * stop
* xUML Services only
    * kill
* Node.js Services only
    * pack
* Can be installed as global utility

## Installation
``` bash
$ npm install [-g] e2e-bridge-cli
```
Global installation may require additional privileges.

## Usage
This guide assumes global installation. If you installed locally, replace ``` e2ebridge ``` with ``` node path/to/app.js ``` (or, on linux ``` path/to/app.js ```).

To start, stop or remove a xUML, Node.js (-N) or Java (-j) service:
``` bash
$ e2ebridge start|stop|remove ${ServiceName} [[-N|--nodejs]|[-j|--java]] [settings]
```

To pack a Node.js service:
- A .e2eignore file can be used to ignore some files when packing.
- If path to directory is omitted the current directory is used.
- If path to repository is omitted a "<package.name>-<package.version>.zip" file is created in the directory. If package information is missing an error will be thrown.
``` bash
$ e2ebridge pack [${path/to/directory}] [${path/to/repository}]
```

To deploy a service:
- If path to repository is a directory it will be packed and published. Only useful for Node.js services.
- If path to repository is omitted the current directory is used. Only useful for Node.js services.
``` bash
$ e2ebridge deploy [${path/to/repository}|${path/to/directory}] [settings] [-o options]
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
* npm_install: Run 'npm install' (applies to Node.js services only)

### Other switches:
* -N|--nodejs Assume that the service is a Node.js service. This is ignored for "deploy" and illegal for "kill".
* -j|--java Assume that the service is a Java service. This is ignored for "deploy" and illegal for "kill".
* -g|--git Use "git archive" for building the repository. This is ignored for all commands but "pack".
* -s|--shrinkwrap Execute "npm shrinkwrap" before creating the repository. This is ignored for all commands but "pack".

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
