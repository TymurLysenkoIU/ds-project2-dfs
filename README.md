# Description

This repository contains common files for the DFS (distributed file system) for Distributed systems course at Innopolis University.

# Structure

## `docker`

Folder, which contains a docker compose file to deploy the whole system in Docker. It includes all components needed to run and develop the system.

The components are described below in details.

### **Mongo**

Name server uses **MongoDB** as a database to persists its state. The `docker-compose.yml` contains `mongo` and `mongo-express` services.

To just run **mongo** for development purposes, simply do:

```bash
docker-compose up -d mongo mongo-express
```

After this, `mongo-express` should be accessible at http://localhost:8081 and the `mongo` itself at `localhost:27017`. `mongo-init/init.js` defines a user for the backend server and gives access right to the user for the application's database (see the file).

#### `mongo` service

**MongoDB** database itself.

##### Configuration

`mongo/mongod.conf` is mounted in the container and used by `MongoDB` as a config file, so when it needs to be configured, this file has to be changed and the service must be restarted to apply changes.

##### Initialization

From [**mongo's docker image description**](https://hub.docker.com/_/mongo):

When a container is started for the first time it will execute files with extensions `.sh` and `.js` that are found in `/docker-entrypoint-initdb.d`. Files will be executed in alphabetical order. .js files will be executed by mongo using the database specified by the `MONGO_INITDB_DATABASE` variable, if it is present, or test otherwise. You may also switch databases within the `.js` script.

The directory `mongo-init` is mounted to `/docker-entrypoint-initdb.d`, so all `.js` and `.sh` files in it will be run, when a container is started for the first time.

The file `mongo-init/init.js` creates a user to be used by the backend for the application's database.

##### Environment variables

`mongo.env` file contains environment variables which will be stored in the container.

- `MONGO_INITDB_ROOT_USERNAME` - default admin's username.
- `MONGO_INITDB_ROOT_PASSWORD` - default admin's password.
- `MONGO_CONTAINER_PORT` - port on which `MongoDB` runs in.side a container.
> Note, when **mongo** needs to be run on a non-default port inside the container, changing it in the `mongo.env` file will not make **mongo** run on this port. Instead, the port to which the database will bind must be set in `mongod.conf` and then changed in `mongo.env`.
- `MONGO_HOST_PORT` - port of the host system, on which **MongoDB** will be available.

#### `mongo-express` service

Web-based UI to conveniently access to **mongo** (e. g. can be used for debugging).

It is connected to the **MongoDB** instance from by default.

### Storage server (`storage-server` service)

Is a global service deployed on each swarm node labeled with `storage_server=true`. The image and its description is available [here](https://github.com/TymurLysenkoIU/ds-project2-storage-server).

The storage server API is available at port **80** on each node, where the storage server is deployed. FTP ports are **20** and  **21** plus passive mode ports **21100-21102**.

> Note: the service is not automatically load balanced by the docker, so **it is guaranteed that access to each node accesses the requested node**.

# Deployment

### Label storage severs

Mark **all** storage servers with labels, so storage server containers will be deployed there:

```sh
docker node update --label-add storage_server=true storage-server-name
```

where `storage-server-name` is a name of a storage server, which is unique for each server.


## Local deployment using `docker-machine`

### Create machines

VirtualBox
```sh
# Create manager node
docker-machine create --driver=virtualbox --virtualbox-cpu-count=1 --virtualbox-disk-size=4096 --virtualbox-memory=1024 main

# Create storage nodes
docker-machine create --driver=virtualbox --virtualbox-cpu-count=1 --virtualbox-disk-size=4096 --virtualbox-memory=1024 storage1
docker-machine create --driver=virtualbox --virtualbox-cpu-count=1 --virtualbox-disk-size=4096 --virtualbox-memory=1024 storage2
docker-machine create --driver=virtualbox --virtualbox-cpu-count=1 --virtualbox-disk-size=4096 --virtualbox-memory=1024 storage3
```

Hyper-V
```sh
# Create manager node
docker-machine create --driver=hyperv --hyperv-cpu-count=1 --hyperv-disk-size=4096 --hyperv-memory=1024 main

# Create storage nodes
docker-machine create --driver=hyperv --hyperv-cpu-count=1 --hyperv-disk-size=4096 --hyperv-memory=1024 storage1
docker-machine create --driver=hyperv --hyperv-cpu-count=1 --hyperv-disk-size=4096 --hyperv-memory=1024 storage2
docker-machine create --driver=hyperv --hyperv-cpu-count=1 --hyperv-disk-size=4096 --hyperv-memory=1024 storage3
```

### Share the directory with the manager node

Mount the docker directory to the manager node when use `docker-machine`:

```sh
docker-machine stop main

vboxmanage sharedfolder add main --name "$(pwd)/docker" --hostpath="$(pwd)/docker" --automount

docker-machine start main
```

### "Connect" to the created machines

Run this in separate terminals, to connect each terminal to a particular machine:

```sh
eval $(docker-machine env main)
```

```sh
eval $(docker-machine env storage1)
```

```sh
eval $(docker-machine env storage2)
```

### Initialize main node in `docker swarm` as manager

Run in the terminal "connected" to the **main** machine:

```sh
docker swarm init --advertise-addr=$(docker-machine ip main)
```

To be able to join to the swarm copy the output of the following command:

```sh
docker swarm join-token worker
```

### Join the swarm from other nodes

The output of the previous command will look line:

```sh
docker swarm join --token token-value 192.168.99.106:2377
```

Run it for all other nodes that should join the swarm.

### [Label storage severs](#label-storage-severs)

### Deploy the stack to the swarm

From manager node run:

```sh
cd ./docker

docker stack deploy -c docker-compose.yml dfs
```
