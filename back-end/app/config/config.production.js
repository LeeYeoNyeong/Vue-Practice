module.exports = {
    appPort: 3000,
    secretKey: '암호화키',
    database: {
        host: '데이타베이스 호스트',
        username: '데이타베이스 id',
        password: '데이타베이스 password',
        port: 3306,
        database: '데이타베이스 이름'
    },
    cors: {
        origin: true,
        credentials: true
    },
    jwt: {
        accessTokenExpire: '1m',
        refreshTokenExpire: '14d'
    }
}