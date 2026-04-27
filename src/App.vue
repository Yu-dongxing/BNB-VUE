<template>
  <!-- 登录页布局：全屏显示，无侧边栏和顶栏 -->
  <div v-if="route.path === '/login'" class="login-layout">
    <RouterView />
  </div>

  <!-- 后台管理布局 -->
  <div v-else class="admin-container">
    <!-- 左侧侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-text">ADMIN PRO</span>
      </div>
      
      <div class="menu-wrapper">
        <!-- 注意：这里循环的是计算后的 displayMenu -->
        <RouterLink 
          v-for="item in displayMenu" 
          :key="item.to" 
          :to="item.to"
          class="menu-item"
          :class="{ active: route.path === item.to }"
        >
          <el-icon v-if="item.icon" class="menu-icon">
            <component :is="item.icon" />
          </el-icon>
          <span class="menu-title">{{ item.title }}</span>
        </RouterLink>
      </div>
    </aside>

    <!-- 右侧主区域 -->
    <div class="main-wrapper">
      <header class="layout-header">
        <div class="breadcrumb">
          <el-icon style="margin-right: 8px;"><Location /></el-icon>
          {{ route.meta.title || '控制台' }}
        </div>
        
        <div class="header-right">
          <!-- 主题切换 -->
          <el-button 
            :icon="isDark ? Sunny : Moon" 
            circle 
            @click="toggleDark" 
          />
          
          <!-- 用户信息 -->
          <div class="user-info-wrapper">
            <!-- <el-tag size="small" effect="dark" :type="roleKey === 'super_admin' ? 'danger' : 'success'" class="role-tag">
              {{ roleKey || '未登录' }}
            </el-tag> -->
            <el-dropdown>
              <span class="user-link">
                <el-avatar 
                  :size="32" 
                  src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" 
                />
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/admin/profile')">个人设置</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout" style="color: var(--el-color-danger)">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </header>

      <main class="content-view">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCurrentAdminInfo } from './api/rbac' // 请确保路径正确
import { 
  Moon, Sunny, House, User, Document, 
  Postcard, Setting, Lock, ArrowDown, Location ,Warning
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const isDark = ref(false)
const roleKey = ref('') // 核心状态：角色标识

// 1. 基础菜单定义 (所有管理员可见)
const baseMenu = [
  { title: "控制中心", to: "/", icon: House },
  { title: "用户管理", to: "/admin/users", icon: User },
  { title: "账单列表", to: "/admin/bills", icon: Document },
  { title: "提现管理", to: "/admin/withdraw", icon: Postcard },
  { title: "卡牌发行", to: "/admin/cards", icon: Postcard },
  { title: "黄金量化托管费", to: "/admin/gold-quant/accounts", icon: Postcard },
  { title: "黄金量化窗口", to: "/admin/gold-quant/windows", icon: Postcard },
  { title: "黄金量化分成", to: "/admin/gold-quant/commissions", icon: Document },
  { title: "合约设置", to: "/admin/settings", icon: Setting },
  { title: "个人设置", to: "/admin/profile", icon: User },
  { title: "系统配置", to: "/admin/system-config", icon: Setting },
  { title: "异常处理", to: "/admin/abnormal", icon: Warning },
];

// 2. 动态菜单计算属性 (核心：根据 roleKey 实时渲染)
const displayMenu = computed(() => {
  const menus = [...baseMenu];
  // 仅超级管理员可见权限设置
  if (roleKey.value === 'super_admin') {
    menus.push({
      title: "权限设置",
      to: "/admin/rbac",
      icon: Lock,
    },
   { title: "矿机管理", to: "/super/admin/miners", icon: Postcard },
  );
  }else{
    menus.push(
      { title: "矿机管理", to: "/admin/miners", icon: Postcard },
    );
  }
  return menus;
});

// 3. 初始化用户信息逻辑
const initUserInfo = async () => {
  const token = localStorage.getItem('Account-token');
  if (!token) return;

  try {
    const res = await getCurrentAdminInfo();
    if (res.code === 200 && res.data) {
      roleKey.value = res.data.role.roleKey;
    }
  } catch (e) {
    console.error("获取权限失败", e);
    roleKey.value = '';
  }
};

// 4. 退出登录：必须清空状态并跳转
const handleLogout = () => {
  localStorage.removeItem('Account-token');
  roleKey.value = ''; // 核心：清空角色状态，菜单会自动更新
  router.replace('/login');
};

// 5. 主题切换
const toggleDark = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
};

// 6. 监听路由变化：如果从登录页跳回首页，重新获取用户信息
watch(() => route.path, (newPath) => {
  if (newPath !== '/login' && !roleKey.value) {
    initUserInfo();
  }
});

onMounted(initUserInfo);
</script>

<style scoped>
/* 基础容器 */
.admin-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--el-bg-color-page);
}

.login-layout {
  width: 100vw;
  height: 100vh;
  background: var(--el-bg-color-page);
}

/* 侧边栏 */
.sidebar {
  width: 240px;
  background: #ffffff;
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  z-index: 100;
}
html.dark .sidebar { background: #1a1a1a; }

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  font-weight: 800;
  font-size: 1.2rem;
  color: #1d7f6e;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.menu-wrapper { flex: 1; padding: 12px; overflow-y: auto; }

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  color: #606266;
  text-decoration: none;
  transition: all 0.2s;
}
.menu-icon { margin-right: 12px; font-size: 18px; }
.menu-item:hover { background: #f5f7fa; color: #1d7f6e; }
.menu-item.active {
  background: #1d7f6e;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(29, 127, 110, 0.3);
}

/* 主内容区 */
.main-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.layout-header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
html.dark .layout-header { background: #1a1a1a; }

.header-right { display: flex; align-items: center; gap: 20px; }
.user-info-wrapper { display: flex; align-items: center; gap: 12px; }
.user-link { display: flex; align-items: center; cursor: pointer; outline: none; }
.role-tag { font-weight: bold; border-radius: 4px; }

.content-view { flex: 1; overflow-y: auto; padding: 24px; }

/* 动画效果 */
.fade-transform-enter-active, .fade-transform-leave-active { transition: all 0.3s; }
.fade-transform-enter-from { opacity: 0; transform: translateX(-20px); }
.fade-transform-leave-to { opacity: 0; transform: translateX(20px); }
</style>
