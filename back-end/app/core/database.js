const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: appConfig.database.host,
        user: appConfig.database.username,
        password: appConfig.database.password,
        port: appConfig.database.port,
        database: appConfig.database.database
    },
    debug: false
})

module.exports = knex;