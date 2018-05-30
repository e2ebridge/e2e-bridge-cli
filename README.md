# e2e-bridge-cli

A command-line interface to E2E Bridge based on Node.js

## Features

* xUML, Node.js or Java Services
    * deploy
    * remove
    * start
    * stop
    * view / set service preferences
    * view / set service settings

* xUML Services only
    * kill
    * list / view model notes

* Node.js Services only
    * pack

* Can be installed as global utility

## Installation
``` bash
$ npm install [-g] e2e-bridge-cli
```
Global installation may require additional privileges.

## Usage
This guide assumes global installation. If you installed locally, replace `e2ebridge` with `node path/to/app.js` (or, on linux `path/to/app.js`).

To start, stop or remove a xUML, Node.js (-N) or Java (-j) service:
``` bash
$ e2ebridge start|stop|remove ${ServiceName} [[-N|--nodejs]|[-j|--java]] [settings]
```

To pack a Node.js service:
- A .e2eignore file can be used to ignore some files when packing.
- Path to directory is mandatory.
- If path to repository is omitted a "<package.name>-<package.version>.zip" file is created in the current working directory. If package information is missing an error will be thrown.
- During pack no file should be modified otherwise error "Didn't get expected byte count" can happen.
  To prevent packing the current package or older packages place them outside the source
  folder or put package names into .e2eignore.
``` bash
$ e2ebridge pack ${path/to/directory} [${path/to/repository}]
```

To deploy a service:
- If path to repository is a directory it will be packed and published. Only useful for Node.js services.
- If path to repository is omitted the current directory is used. Only useful for Node.js services.
``` bash
$ e2ebridge deploy [${path/to/repository}|${path/to/directory}] [settings] [-o option]...
```

To kill an xUML service:
``` bash
$ e2ebridge kill ${ServiceName} [settings]
```

To view / set service preferences:
- If no `pref * *` arguments are given, the current service preferences are displayed
``` bash
$ e2ebridge preferences ${ServiceName} [[-N|--nodejs]|[-j|--java]] [pref ${PreferenceName} ${PreferenceValue}]... [settings]
```

To view / set service settings:
- If no `set * *` arguments are given, the current service settings are displayed
``` bash
$ e2ebridge settings ${ServiceName} [[-N|--nodejs]|[-j|--java]] [set ${SettingName} ${SettingValue}]... [settings]
```

To list available model notes for xUML service:
``` bash
$ e2ebridge modelnotes ${ServiceName} [settings]
```

To view chosen model notes for xUML service:
``` bash
$ e2ebridge modelnotes ${ServiceName} ${NotesFileName} [settings]
```

To get usage help:  
``` bash
$ e2ebridge --help
```

### Settings:
* `-h|--host <FQDN bridge host>` The host, that runs the bridge. Defaults to localhost.
* `-p|--port <bridge port>` The port of the bridge. Defaults to 8080.
* `-n|--node <node name>` The name of bridge node. Ignored for deployment. Defaults to ${host}.
* `-u|--user <bridge user>` User that has the right to perform operation on bridge.
Required. If not given, you'll be prompted for it.
* `-P|--password <password for bridge user>` Password for the user.
Required. If not given, you'll prompted for it, what is recommended as giving your password
in command line will expose it in your shell's history. Password is masked during prompt.

### Options:
* **startup**: Launch service after deployment.
* **overwrite**: Overwrite existing service if one already exists.
* **overwritePrefs**: Overwrite settings and preferences too.
* **npmInstall**: Run 'npm install --ignore-scripts' (applies to Node.js services only)
* **runScripts**: Run 'npm install' (applies to Node.js services only)
* **instanceName=\<instance name\>**: Choose a different instance name  (applies to Node.js services only)

### Other Switches:
* `-N|--nodejs` Assume that the service is a Node.js service. This is ignored for "deploy" and illegal for "kill".
* `-j|--java` Assume that the service is a Java service. This is ignored for "deploy" and illegal for "kill".
* `-g|--git` Use "git archive" for building the repository. This is ignored for all commands but "pack".
* `-s|--shrinkwrap` Execute "npm shrinkwrap" before creating the repository. This is ignored for all commands but "pack".

### Service Preferences:
Currently the Bridge supports following preferences:
- All services:
  * automaticStartup : boolean
  * automaticRestart : boolean
  * owner : string \[readonly\]

- xUML services:
  * bridgeServerLogLevel : string \[None, Fatal, Error, Warning, Info, Debug\]
  * transactionLogLevel  : string \[None, Custom, Service, IOExternal, IOInternal\]
  * transactionLogRotInterval : \[HOURLY, DAILY\]

- Node.js and Java services:
  * minimumUptimeInSeconds : integer
  * uiUrl: string
  * uiTabTitle : string

- Java services:
  * remoteDebugPort : integer


## Migrating from version 1
* The deployment options is no more a comma-separated list. To pass multiple options, use multiple `-o` parameters.
Also the names of the options got changed. Changes are summarized in the below table:

| Old name              | New name     |
|-----------------------|--------------|
|settings               |overwritePrefs|
|npm_install            |npmInstall    |
|npm_install_run_scripts|runScripts    |
|instance_name          |instanceName  |


## Usage Examples
* Deploy *PurchaseOrderExample* to localhost  
``` bash
$ e2ebridge deploy /tmp/PurchaseOrderExample.rep -u admin -P admin
```

* Deploy *PurchaseOrderExample* to some development server. Overwrite existing instance and startup service afterwards. Additionally do not expose your password in command line (you'll be prompted for it)  
``` bash
$ e2ebridge deploy /tmp/PurchaseOrderExample.rep -u admin -h devserver.my.org -o startup -o overwrite
```

* Start *PurchaseOrderExample* on some development server.   
``` bash
$ e2ebridge start PurchaseOrderExample -u admin -h devserver.my.org
```

* Start myNodeServie on some development server (a Node.js service).   
``` bash
$ e2ebridge start myNodeService -u admin -h devserver.my.org -N
```

* Set automatic startup of *PurchaseOrderExample* on some development server.
``` bash
$ e2ebridge preferences PurchaseOrderExample pref automaticStartup true -u admin -h devserver.my.org
```

* Set Setting "global_Settings::Folder Name to move mails in that are skipped" of *PurchaseOrderExample* on some development server.
``` bash
$ e2ebridge settings PurchaseOrderExample set "global_Settings::Folder Name to move mails in that are skipped" "SKIPPED" -u admin -h devserver.my.org
```
