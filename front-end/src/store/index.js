import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// 회원인증 관련 상태관리 모듈
import authorizeStore from '@/store/auth'

export default new Vuex.Store({
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    authorize: authorizeStore // 위에서 로드한 객체를 모듈로 등록
  }
})
