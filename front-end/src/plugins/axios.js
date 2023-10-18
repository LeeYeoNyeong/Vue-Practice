import Vue from 'vue'
import $axios from 'axios'
import store from '@/store'
import userModel from '@/models/userModel'

class AxiosExtend {

    instance = null

    // Token 만료 응답을 받을 시, Token 재생성 요청을 다시 보내기 위한 flag
    // 토큰 재생성은 무한으로 요청하지 않고, 한번만 요청하기 위해 사용
    isAlreadyFetchingAccessToken = false

    subscribers = []
    constructor() {
        this.instance = $axios.create({
            baseURL: process.env.NODE_ENV === 'production'
                ? '릴리즈서버 REST API URI'
                : 'http://127.0.0.1:3000',
            timeout: 10000,
            withCredentials: true
        })

        this.instance.interceptors.request.use(
            config => {

                // 요청 헤더에 accessToken 추가
                const accessToken = localStorage.getItem('accessToken')
                // 만약 accessToken에 있다면 헤더에 토큰을 추가
                if (accessToken)
                    config.headers.Authorization = `Bearer${accessToken}`

                return config
            },
            error => Promise.reject(error)
        )

        // REST API와의 통신에서 에러가 발생했을 때 기본 처리
        this.instance.interceptors.response.use(
            response => {
                return response;
            },
            async error => {
                const {config} = error
                const originalRequest = config // 토큰 재발급 후 원래 요청을 다시 보내기 위해 사용

                // 응답 코드 401 처리
                if (error.response?.status === 401) {
                    // 토큰 재발급 요청을 보낸 적 없을 경우
                    if (!this.isAlreadyFetchingAccessToken) {
                        this.isAlreadyFetchingAccessToken = true // 토큰 재발급요청 flag TRUE 로 변경


                        await this.instance.post('/users/authorize/token', {
                            refreshToken: localStorage.getItem('refreshToken')
                        }).then(r => {
                            // 토큰 재발급 요청에 성공하면 flag를 true로 변경
                            this.isAlreadyFetchingAccessToken = false

                            // LocalStorage의 값 업데이트
                            localStorage.setItem('refreshToken', r.data.refreshToken)
                            localStorage.setItem('accessToken', r.data.accessToken)
                            store.commit('authorize/setLogin', true)

                            this.subscribers = this.subscribers.filter(callback =>
                                callback(r.data.accessToken))
                        })
                    }
                    // 토큰 재발급을 이미 요청했는데도 401 응답일 때
                    else {
                        // 토큰 재발급에 실패했으므로, 저장되었던 데이터를 모두 날림.
                        window.localStorage.removeItem('accessToken')
                        window.localStorage.removeItem('refreshToken')
                        originalRequest.headers.Authorization = null

                        store.commit('authorize/setLogin', false)
                        store.commit('authorize/setUserInfo', null)
                    }

                    const retryOriginalRequest = new Promise(resolve => {
                        this.subscribers.push(accessToken => {
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`
                            resolve(this.instance(originalRequest))
                        })
                    })

                    // 로그인된 상태라면 내 정보를 다시 가져옴
                    if (userModel.isLogin()) {
                        await userModel.requestMyInfo()
                    }

                    return retryOriginalRequest
                } else {
                    let message

                    if (error.response?.date?.error) {
                        message = error.response.data.error
                    } else {
                        switch (error.response?.status) {
                            case 0:
                                message = "REST API 서버에 접근할 수 없습니다.\n서버 관리자에게 문의하세요.";
                                break;
                            case 400:
                                message = "잘못된 요청입니다.";
                                break;
                            case 404:
                                message = "[404] REST API 요청에 실패하였습니다."
                                break;
                            case 500:
                                message = "서버에서 처리 중 오류가 발생하였습니다."
                                break;
                        }
                    }

                    alert(message);

                    return Promise.reject(error);
                }
            }
        )
    }
}

const axios = new AxiosExtend()

Vue.prototype.$axios = axios.instance

export default axios.instance