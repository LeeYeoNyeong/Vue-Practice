const usersModel = {};

usersModel.tableName = "tbl_members";

/**
 * 사용자 데이터 한 행을 가져옴
 */
usersModel.getUser = async(value, column="id") => {
    // 데이터베이스 연결 객체
    const db = database();

    // 반환할 객체
    let result = null

    try {
        await db(usersModel.tableName)
            .select("*")
            .select(db.raw("INET_ATON(`loged_ip`) AS `loged_ip`"))
            .where(column, value)
            .limit(1)
            .then((rows) => {
                if (rows && rows.length > 0) {
                    result = rows[0]
                }
            })
    }
    catch {
        result = null;
    }

    return result;
}

/**
 * 사용자 데이터 추가
 */
usersModel.addUser = async( data ) => {

    // 빈 값이 들어있는 경우 기본값 처리
    data.status = data?.status ?? 'Y'
    data.login_id = data?.login_id ?? ''
    data.login_pass = data?.login_pass ?? ''
    data.phone = data?.phone ?? ''
    data.nickname = data?.nickname ?? ''
    data.auth = data?.auth ?? 1
    data.create_at = data?.create_at ?? new Date()
    data.updated_at = data?.updated_at ?? new Date()
    data.agree_marketing = data?.agree_marketing ?? 'N'
    data.privacy_agree_at = data?.privacy_agree_at ?? new Date()

    // 비밀번호는 암호화 처리
    data.login_pass = require('sha256')(require('md5'))
    (appConfig.secretKey + data.login_pass)

    // 결과값 반환 플래그
    let result = false

    // 데이터베이스 객체
    const db = database()

    try {
        await db(usersModel.tableName)
            .insert(data)
            .then(() => {
                result = true
            })
    }
    catch {

    }

    return result;
}

/**
 * 토큰 생성
 * @param type
 * @param userInfo
 * @returns {Promise<*>}
 */
usersModel.createToken = async(type, userInfo) => {
    const jwt = require('jsonwebtoken');
    const expiresIn =
        type === 'refresh'
        ? appConfig.jwt.refreshTokenExpire
        : appConfig.jwt.accessTokenExpire

    return await jwt.sign({
        id: userInfo.id
    }, appConfig.secretKey, {
        expiresIn
    })
}

/**
 * 반환용 토큰 생성
 */
usersModel.responseToken = async(userInfo) => {
    let newAccessToken = '',
        newRefreshToken = '';
    await usersModel.createToken('access', userInfo).then((v) => (newAccessToken = v));
    await usersModel.createToken('refresh', userInfo).then((v) => (newRefreshToken = v));

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    }
}

/**
 * 로그아웃 처리
 */
processLogOut: () => {
    localStorage.removeItem('accessToken');

}


module.exports = usersModel;