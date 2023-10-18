import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import '@/plugins/formatter'

Vue.config.productionTip = false

// 믹스인(mixin) 설정을 불러와 적용
import mixins from '@/mixins';
Vue.mixin(mixins);

// Axios module load
import '@/plugins/axios'

// 새로고침 등을 했을 때 로그인이 되어있는지 여부를 다시 체크
import userModel from '@/models/userModel'
if (userModel.isLogin()){
  store.commit('authorize/setLogin', true)
  userModel.requestMyInfo()
}

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
