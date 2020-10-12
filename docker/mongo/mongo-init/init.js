// use dfs
db.createUser(
  {
    user: "name-server",
    pwd: "name-server-password",
    roles: [
      { role: "readWrite", db: "storage" }
    ]
  }
)
