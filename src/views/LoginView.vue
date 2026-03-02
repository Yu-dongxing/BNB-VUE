<template>
  <div class="login-container">
    <div class="login-card">
      <header>
        <p class="eyebrow">ADMINISTRATION</p>
        <h1>系统登录</h1>
      </header>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label>用户名</label>
          <input v-model="loginForm.username" type="text" placeholder="请输入管理员账号" required />
        </div>
        
        <div class="input-group">
          <label>密码</label>
          <input v-model="loginForm.password" type="password" placeholder="请输入密码" required />
        </div>
        
        <button type="submit" :disabled="loading" class="login-button">
          {{ loading ? '登录中...' : '进入控制中心' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginAdmin } from '../api/user.js'; // 根据你的文件名修改

const router = useRouter();
const loading = ref(false);
const loginForm = ref({
  username: '',
  password: ''
});

const handleLogin = async () => {
  loading.value = true;
  try {
    // 1. 直接获取结果，不需要 JSON.parse
    const res = await loginAdmin(loginForm.value);
    
    console.log("登录响应结果:", res); // 你可以在控制台看一眼结构

    // 2. 根据你截图中的响应结构判断
    // 你的后端返回结构是：{ code: 200, message: "...", data: { tokenValue: "...", ... } }
    if (res.code === 200) {
      // 注意：这里要取 res.data.tokenValue
      const token = res.data.tokenValue; 
      
      if (token) {
        localStorage.setItem('Account-token', token);
        router.push('/'); // 跳转主页
      } else {
        alert('登录失败：未获取到有效Token');
      }
    } else {
      alert(res.message || '登录失败');
    }
  } catch (error) {
    // 打印真正的错误到控制台，方便排查
    console.error("登录逻辑出错:", error);
    alert('登录处理出错，请查看控制台');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

}

.login-card {
  background: var(--surface);
  padding: 3rem;
  border-radius: 24px;
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(13, 35, 32, 0.08);
}

.login-form {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.8rem;
  color: var(--muted);
  font-weight: 600;
}

.input-group input {
  padding: 0.8rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(13, 35, 32, 0.1);
  background: #f9fbfb;
  font-family: inherit;
  outline: none;
  transition: border 0.3s;
}

.input-group input:focus {
  border-color: var(--accent);
}

.login-button {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 12px;
  border: none;
  background: var(--accent);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.login-button:hover {
  background: var(--accent-strong);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>