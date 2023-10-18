import store from '@/store'
import axios from '@/plugins/axios'

const exportObject = {
    /**
     * 사용자의 로그인 여부 확인
     */
    isLogin: () => {
        const accessToken = localStorage.getItem('accessToken');
        return !!(accessToken && accessToken !== 'undefined');
    },

    /**
     * REST API 서버에 로그인 요청
     */
    requestLogin: async (payload) => {
        return await axios
            .post('/users/authorize', {
                loginId: payload.loginId,
                loginPass: payload.loginPass
            })
            .then(async (res) => {
                // 정상적으로 응답을 받은 경우, processLogin 함수를 실행합니다.
                await exportObject.processLogin(res.data)
            })
    },

    /**
     * 로그인이 완료된 경우, 응답 데이터를 이용하여 클라이언트에 토큰 저장
     */
    processLogin: async (result) => {
        // AccessToken과 refreshToken 발급에 성공한 경우
        if (result?.accessToken && result?.refreshToken) {
            // LocalStorage에 accessToken과 refreshToken 저장
            localStorage.setItem('accessToken', result?.accessToken);
            localStorage.setItem('refreshToken', result?.refreshToken);

            // vuex 상태 관리에서 현재 로그인 상태를 TRUE로 변경
            store.commit('authorize/setLogin', true);

            // REST API에 내 정보 요청
            await exportObject.requestInfo()
        }
        // 발급에 실패한 경우
        else {
            // vuex 상태 관리에서 현재 로그인 상태를 FALSE로 변경
            store.commit('authorize/setLogin', false);

            // vue 상태 관리에서 현재 내 정보를 빈 값으로 변경
            store.commit('authorize/setUserInfo', null);

            // LocalStorage에 있는 데이터 모두 삭제
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            alert('사용자 로그인에 실패하였습니다.')
        }
    },

    /**
     * REST API로 내 정보를 가져온다.
     */
    requestMyInfo: async () => {
        return await axios.get('/users').then(res => {
            // vuex 상태 관리에서 현재 내 정보를 처리
            store.commit('authorize/setUserInfo', res.data);
        })
    }
}

export default exportObject