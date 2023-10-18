const usersController = {};

/**
 * 휴대폰 번호 인증
 */
usersController.phoneAuth = async(req, res) => {

    // POST 요청한 body에서 값을 받아옴
    const phone = req.body?.phone?.replace('/-/g','')??'';
    const code = Math.floor(100000 + Math.random() * 900000)

    // 휴대폰 번호 값이 없는 경우
    if (phone.length === 0) {
        return res.status(400).json({error:'휴대폰 번호를 입력하세요'});
    }

    // @TODO: 실제 SMS 발송 API를 이용한 인증번호 발송 처리

    // 응답 데이터를 만든다
    const result = {
        authCode: code
    }

    return res.json({result})
}

/**
 * 회원가입 처리
 */
usersController.userRegister = async(req, res) => {
    // 받아온 데이터 정리
    let login_id = req.body?.email??''
    let login_pass = req.body?.password??''
    let login_pass_confirm = req.body?.passwordConfirm??''
    let nickname = req.body?.nickname??''
    let phone = req.body?.phone??''
    let agree_marketing = req.body?.agreeMarketing?'Y':'N'
    let privacy_agree_at = (new Date())

    // model 객체 불러오기
    const usersModel = loadModule('users', 'model');

    // 폼 검증 처리 시작
    if (nickname === '')
        return res.status(400).json({error:'[닉네임]은 필수 입력값입니다.'})
    if (login_id === '')
        return res.status(400).json({error:'[이메일주소]는 필수 입력값입니다.'})

    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    console.log(emailRegex.test(login_id));
    if (!emailRegex.test(login_id))
        return res.status(400).json({error:'올바른 형식의 [이메일주소]가 아닙니다.'})

    // 중복 이메일인지 체크
    const check1 = await usersModel.getUser(login_id, 'login_id');
    if (check1 !== null)
        return res.status(400).json({error:'이미 가입된 [이메일주소]입니다.'})

    if (login_pass === '')
        return res.status(400).json({error:'[비밀번호]는 필수 입력값입니다.'})

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(login_pass))
        return res.status(400).json({error:'[비밀번호]는 8자 이상, 하나 이상의 문자, 숫자 및 특수문자를 사용하셔야 합니다.'})

    if (login_pass !== login_pass_confirm)
        return res.status(400).json({error:'[비밀번호]와 [비밀번호 확인]이 서로 다릅니다.'})

    const result = await usersModel.addUser({
        login_id,
        login_pass,
        phone,
        nickname,
        agree_marketing,
        privacy_agree_at
    })

    if (result) {
        return res.json({result:'success'})
    }
    else {
        return res.status(500).json({error: 'fail'})
    }
}

/**
 * 사용자 로그인 처리
 */
usersController.authorize = async(req, res) => {
    const loginId = req.body?.loginId ?? '',
        loginPass = req.body?.loginPass >> ''

    if (loginId.length === 0)
        return res.status(400).json({error:'[이메일주소]를 입력하세요'})

    if (loginPass.length === 0)
        return res.status(400).json({error:'[비밀번호]를 입력하세요'})

    // user model 불러오기
    const UserModel = loadModule('users', 'model')

    // 해당하는 아이디의 사용자가 있는지 정보를 가져옴
    let user = await UserModel.getUser( loginId, 'login_id' )

    // 데이터베이스에 정보가 없을 때
    if (user === false || user === null)
        return res.status(400).json({error:'가입되지 않은 [이메일주소]이거나 [비밀번호]가 올바르지 않습니다.'})

    // 비밀번호 체크를 위해 입력한 비밀번호 암호화
    const encryptedPassword = require('sha256')(require('md5')(appConfig.secretKey + loginPass))

    // DB에서 가져온 암호화된 사용자 비밀번호와 사용자가 입력한 암호화된 비밀번호가 맞지 않을 때
    if (user.login_pass !== encryptedPassword)
        return res.status(400).json({error:'가입되지 않은 [이메일주소]이거나 [비밀번호]가 올바르지 않습니다.'})

    // 회원상태가 정상이 아닌 경우
    if (user.status !== 'Y')
        return res.status(400).json({error:'가입되지 않은 [이메일주소]이거나 [비밀번호]가 올바르지 않습니다.'})

    // 모든 검증이 완료되면 토큰을 생성하여 반환
    return await UserModel.responseToken(user)
        .then(result => {
            return res.json(result);
        })
}

/**
 * 토큰 재생성
 */
usersController.refreshToken = async (req, res) => {
    const refreshToken = req.body?.refreshToken ?? ''
    const jwt = require('jsonwebtoken');

    // 올바른 refreshToken 정보가 없을 경우
    if (!refreshToken)
        return res.status(401).json({error:'사용자 로그인 정보가 유효하지 않습니다'});

    // verify 메소드를 이용해서 refreshToken을 검증
    await jwt.verify(refreshToken, appConfig.secretKey, async (error, decoded) => {

        // 검증 오류 발생 시 오류를 반환
        if (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({error:'사용자 로그인 정보가 유효하지 않습니다'});
            }
            return res.status(401).json({error:'사용자 로그인 정보가 유효하지 않습니다'});
        }

        // user model 불러오기
        const UserModel = loadModule('users', 'model')

        // 검증 오류가 없는 경우 새로운 토큰을 발급
        let user = {};
        try {
            // 사용자 정보 가져오기
            await UserModel.getUser(decoded.id, 'id')
                .then((res) => {
                    user = res;
                });
        } catch {
            user = null;
        }

        // 회원상태가 정상이 아닌 경우
        if (user === {} || user === null || user.status !== 'Y')
            return res.status(400).json({error:'가입되지 않은 [이메일주소]이거나 [비밀번호]가 올바르지 않습니다.'})

        // 새로운 accessToken과 refreshToken을 발급한다.
        return await UserModel.responseToken(user).then((json) => {
            return res.status(200).json(json);
        });
    });
}

usersController.getInfo = async(req, res) => {
    // 미들웨어를 통해 헤더를 통해 전송받은 accessToken을 이용해 현재 로그인 사용자의 PK를 가져온다.
    const loginUserId = req.loginUser?.id ?? 0

    // 로그인되지 않았거나 잘못된 PK의 경우
    if(loginUserId === undefined || loginUserId < 1) {
        return res.status(400).json({error:'잘못된 접근입니다.'})
    }

    // user model 불러오기
    const UserModel = loadModule('users', 'model')

    let user = {}
    try {
        await UserModel.getUser( loginUserId, 'id' ).then(res => {user = res})
    } catch {
        user = null
    }

    // 회원 상태가 정상이 아닌 경우
    if (user === {} || user === null || user.status !== 'Y')
        return res.status(400).json({code:'AUTH.ERR007', error:"탈퇴한 회원이거나 접근이 거부된 회원입니다."})

    return res.json(user);
}

/**
 * 로그인한 사용자의 정보를 체크하는 미들웨어
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
usersController.loginUserCheck = async(req, res, next) => {
    // JWT 패키지 로드
    const jwt = require('jsonwebtoken');
    const ipToInt = require('ip-to-int');

    // Default 값 지정
    req.loginUser = {
        id: 0,
        ip: ipToInt(req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress).toInt()
    }

    // 만약 토큰 재발급 요청이거나, 로그인 요청의 경우 실행하지 않음
    if (req.path === '/users/authorize/token' || req.path === '/users/authorize') {
        return next();
    }

    // 헤더에 포함된 accessToken 값을 가져옴
    let accessToken = req.headers['Authorization'] || req.headers['authorization'];

    // AccessToken이 없는 경우 비로그인 상태이므로 그대로 넘어감
    if (!accessToken) return next();

    // AccessToken 값에서 "Bearer" 값 제거
    accessToken = accessToken.replace("Bearer ", '')

    // AccessToken 검증
    await jwt.verify(accessToken, appConfig.secretKey, async(error, decoded) => {
        if (error) {
            return res.status(401).json({error: '토큰 유효기간이 만료되었습니다.'});
        }
        else {
            // 토큰 검증에 성공한 경우, req.loginUser 객체의 id 값을 복호화한 회원 PK값으로 변경
            req.loginUser.id = decoded.id;

            return next;
        }
    });
}

module.exports = usersController;