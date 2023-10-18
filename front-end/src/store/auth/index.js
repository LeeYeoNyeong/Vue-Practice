import UserModel from "@/models/userModel";
import {stat} from "@babel/core/lib/gensync-utils/fs";

export default {
    namespaced: true,
    state: () => ({
        isLogin: false,
        loginUser: {
            id: 0, // 회원 고유 PK
            nickname: '', // 회원 닉네임
            auth: 0 // 회원 권한 레벨
        }
    }),
    // mutations: state를 변경하기 위해 실행되는 것으로 비동기를 해야할 경우
    mutations: {
        // 사용자의 로그인 상태를 체크
        setLogin (state) {
            state.isLogin = UserModel.isLogin()
        },
        setUserInfo (state, payload) {
            state.loginUser.id = payload?.id ?? 0;
            state.loginUser.nickname = payload?.nickname ?? '';
            state.loginUser.auth = payload?.auth ?? 0;
        }
    },
    getters: {
        isLogin (state) {
            return state.isLogin
        },
        loginUser (state) {
            return state.loginUser
        }
    }
}