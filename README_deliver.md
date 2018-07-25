# [e2e-bridge-cli](README.md "Back to documentation of e2e-bridge-cli"): deliver Command

A command of the E2E Bridge command-line interface to deliver services to E2E Bridges that can be used in a continuous delivery environment

## Features

The e2ebridge deliver command features setting up a continuous delivery project with a variety of settings and options. All this is managed by JSON files in a specific file structure.

* grouping Bridge nodes to a domain
* labeling nodes
* defining a setup as a solution

## Installation
See [documentation of e2e-bridge-cli](README.md "e2e-bridge-cli") for more information on how to install the e2e-bridge-cli.

## File Structure of a Delivery Project
``` bash
myProject
├── domains
│   └── myDomain.json
├── nodes
│   ├── myNode1.json
│   ├── myNode2.json
│   └── myNode3.json
├── repositories
│   ├── anxUMLServiceRepository.rep
│   ├── anotherxUMLServiceRepository.rep
│   └── aNodeJSServiceRepository.zip
├── services
│   ├── anxUMLService.json
│   ├── anotherxUMLService.json
│   ├── aNodeJSService.json
│   └── aNodeJSService.settings
│       ├── deploymentSettings1.json
│       └── deploymentSettings2.json
└── solutions
    └── solution1.json
```

### Deployment Domains
Folder **domains** contains JSON files that each define a domain you want to be able to deploy to. The name of the JSON file determines the name of the domain.

Content structure:
``` json
{
    "nodes": ["myNode1", "myNode2", ...],
    "services": ["myService1", ...],
    "solutions": ["mySolution1", ...
}
```
| Option                | Description                                                                                                           | Mandatory | Allowed Values                    |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------|-----------|-----------------------------------|
| **nodes**             | Specify a list of nodes that are a members of this domain. Details of these nodes must be defined in folder **nodes**.| yes       | nodes defined in folder **nodes** |
| **services**          | Specify a list of services you want to deliver with this domain. Details of these services must be defined in folder **services**.| no        | services defined in folder **services** |
| **solutions**         | You can define solutions and associate them to domains. Details of these solutions must be defined in folder **solutions**.| no        | solutions defined in folder **solutions**.|

In general, **services** and **solutions** are not mandatory. However, you need to relate the services you want to deliver to to your domain definition.
So, either specify services directly in the domain definition, or specify services indirectly via a solution. If you do not specify services either way, the deliver command will be aborted with error.

### Bridge Nodes
Folder **nodes** contains one JSON file per node you want to be able to deploy to. The name of the JSON file determines the name of the node.
Content structure:
``` json
{
    "location": "myMachineName.myDomain.com",
    "user": "myUser",
    "password": "myPassword",
    "label": ["myFirstLabel", "mySecondLabel", ...]
}﻿
```
| Option                | Description                                                                                                                           | Mandatory | Allowed Values                                |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|-----------|-----------------------------------------------|
| **location**          | Specify the fully qualified domain name of the Bridge host you want to use for delivery. The location may also contain a port number. | yes       | a valid machine name (with/without port)      |
| **user**              | Specify a Bridge user with the necessary rights to deploy software. If you do not specify a user, you will be prompted for it.        | no        | a valid user name                             |
| **password**          | Specify the password according to the user. If you do not specify a user, you will be prompted for it.                                | no        | password string                               |
| **label**             | You can apply labels to nodes.                                                                                                        | no        | any string                                    |

### Service Repositories
Folder **repositories** of the delivery project contains the service repositories of the services to be deployed. Define with the **services** definitions, which services to deploy and how.

### Service Deployment Options
Folder **services** contains one JSON file per service to be deployed to define the deployment options per service. The file name *must* match the service instance name on the E2E Bridge.

Content structure:
``` json
{
    "type": "xUML|node|java",
    "repository": "myServiceRepository.rep|myNodeJSrepository.zip|myJavaService.jar",
    "deploymentOptions": {
        "startup": true|false,
        "overwrite": true|false,
        "overwritePrefs": true|false,
        "npmInstall": true|false,
        "runScripts": true|false,
        "instanceName": "anInstanceName (Node.js services only)",
        "preserveNodeModules": true|false
    }
    "settings": {
        "name of a setting": "a valid default setting value",
        ...
    }
}
```
| Option                | Description                                                                                        | Mandatory | Allowed Values             |
|-----------------------|----------------------------------------------------------------------------------------------------|-----------|----------------------------|
| **type**              | Specify the type of service: xUML service, Node.js service or Java service.                        | yes       | xUML&#124;node&#124;java   |
| **repository**        | Specify the name of the repository from folder **repositories** or a path relative to this folder. | yes       |                            |
| **deploymentOptions** | Define the deployment options. Each single option is optional.                                     | no        | See table of deployment options below. |
| **settings**          | Specify setting values for the service to be deployed with.                                        | no        |


| Deployment Option       | Description                                                                                                      | Allowed Values (default in bold)|
|-------------------------|------------------------------------------------------------------------------------------------------------------|---------------------------------|
| **startup**             | Specify whether the service should be started after deployment. This option is valid for all service types.      | **true**&#124;false             |
| **overwrite**           | Specify whether the deployment should overwrite an existing service. This option is valid for all service types. | **true**&#124;false             |
| **overwritePrefs**      | Specify whether changed service preferences should be overwritten. This option is valid for all service types.   | true&#124;**false**             |
| **npmInstall**          | Specify whether the deployment should run an `npm install` command. This options is valid for Node.js services only.| true&#124;**false**             |
| **runScripts**          | Specify whether scripts should be executed on `npm install`. This options is valid for Node.js services only.    | true&#124;**false**             |
| **instanceName**        | For Node.js services, you can change the service instance name on deployment, if a new name is provided here.    | a string (default=**undefined**)|
| **preserveNodeModules** | Upon deployment of a Node.js service, the modules folder will get deleted, if existent. By setting this option you can keep these folders. This can be useful , if you do not want to perform an npm install on deployment.| true&#124;**false**|

### Solutions
Define solutions if you want to deploy services that are related and need to be deployed together in a specific setup.

Content structure:
``` bash
{
    "services": {
        "myLabel1": ["myService2", "myService3", ...],
        "myLabel2": ["myService2", "myService3", ...],
		...
    }
}
```

## Additional Options
| Option               | Description                                                                                                                                 |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| **--break-on-error** | Stop the delivery run as soon as an error occurs. If not set, the command will proceed with the delivery scenario after the erroneous step. |
| **--dry-run**        | No effective deployment will be executed. This can be used to check the consistency of the delivery scenario.                              |

Back to [documentation of e2e-bridge-cli](README.md "e2e-bridge-cli").﻿﻿
