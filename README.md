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
