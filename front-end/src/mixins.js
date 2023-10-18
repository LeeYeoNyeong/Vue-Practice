import {mapGetters} from "vuex";

export default {
    computed: {
        ...mapGetters({
            isLogin: 'authorize/isLogin',
            loginUser: "authorize/loginUser"
        })
    }
}