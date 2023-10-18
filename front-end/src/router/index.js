import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

import AuthorizeRoutes from "./authorize.routes";
import MyPageRoutes from "./my.routes";
import BoardRoutes from "./board.routes";
import AgreementRoutes from "./agreement.routes";

const routes = [
  { path: '/', name: 'home',  component: () => import(/*
webpackChunkName: "home" */ '../views/HomeView.vue')},
  ...AuthorizeRoutes,
  ...MyPageRoutes,
  ...BoardRoutes,
  ...AgreementRoutes,
  {
    path: '*',
    name: 'Error404',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/Errors/Error404.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
