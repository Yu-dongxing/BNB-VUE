import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import UserManageView from "../views/UserManageView.vue";
import BillListView from "../views/BillListView.vue";
import CardManageView from "../views/CardManageView.vue";
import LoginView from "../views/LoginView.vue";
import RbacManageView from "../views/RbacManageView.vue";
import AbnormalListView from "../views/AbnormalListView.vue";
import MinerManageView from "../views/MinerManageView.vue";

import SuperAdminMinerManageView from "../views/MinerManageView/SuperAdminMinerManageView.vue";
import AdminMinerManageView from "../views/MinerManageView/AdminMinerManageView.vue";

const routes = [
  { path: "/login", name: "login", component: LoginView },
  { path: "/", name: "home", component: HomeView },
  { path: "/admin/users", name: "admin-users", component: UserManageView },
  { path: "/admin/bills", name: "admin-bills", component: BillListView },
  { path: "/admin/cards", name: "admin-cards", component: CardManageView },
  { path: "/admin/gold-quant/accounts", name: "admin-gold-quant-accounts", component: () => import("../views/GoldQuantAccountView.vue"), meta: { title: "黄金量化托管费" } },
  { path: "/admin/gold-quant/windows", name: "admin-gold-quant-windows", component: () => import("../views/GoldQuantWindowView.vue"), meta: { title: "黄金量化窗口记录" } },
  { path: "/admin/gold-quant/commissions", name: "admin-gold-quant-commissions", component: () => import("../views/GoldQuantCommissionView.vue"), meta: { title: "黄金量化分成/分销记录" } },
  { path: "/admin/settings", name: "admin-settings", component: () => import("../views/SettingsView.vue") },
  { path: "/admin/withdraw", name: "admin-withdraw", component: () => import("../views/WithdrawManage.vue") },
  { 
    path: "/admin/rbac", 
    name: "admin-rbac", 
    component: RbacManageView 
  },
  //超级管理员的矿机管理界面
 { 
    path: "/super/admin/miners", 
    name: "super-admin-miners", 
    component: SuperAdminMinerManageView,
    meta: { title: '矿机管理' }
  },
  //普通管理员的矿机管理界面
 
  { 
    path: "/admin/miners", 
    name: "admin-miners", 
    component: AdminMinerManageView,
    meta: { title: '矿机管理' }
  },
  {
    path: "/admin/abnormal", 
    name: "admin-abnormal", 
    component: AbnormalListView,
    meta: { title: '异常处理' }
  },
  {
    path: "/admin/profile",
    name: "admin-profile",
    component: () => import("../views/ProfileView.vue"),
  },
  {
  path: '/admin/system-config',
  name: 'SystemSettings',
  component: () => import('../views/SystemSettings.vue'),
  meta: { title: '系统设置' }
}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * 添加路由守卫
 */
router.beforeEach((to, from, next) => {
  // 1. 获取本地存储的 token
  const token = localStorage.getItem('Account-token');

  // 2. 判断：如果要去的页面不是登录页，且没有 token
  if (to.path !== '/login' && !token) {
    // 强制跳转到登录页
    next('/login');
  } 
  // 3. 判断：如果已经有 token 了，还想去登录页
  else if (to.path === '/login' && token) {
    // 直接跳回主页
    next('/');
  } 
  // 4. 其他情况正常通行
  else {
    next();
  }
});

export default router;
