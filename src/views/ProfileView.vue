<template>
  <div class="page-container">
    <!-- 1. 顶部标题区 -->
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">个人账号设置</p>
      </div>
      <div class="header-actions">
        <el-button @click="router.push('/')" :icon="ArrowLeft">返回仪表盘</el-button>
      </div>
    </header>

    <!-- 2. 内容面板 (参考示例的 content-panel) -->
    <section class="content-panel animate-up" style="max-width: 600px; margin: 0 auto;">
      <div class="panel-header">
        <div class="panel-title">
          <el-icon style="vertical-align: middle; margin-right: 8px;"><User /></el-icon>
          基本信息维护
        </div>
      </div>

      <el-form 
        :model="profileForm" 
        :rules="rules" 
        ref="formRef" 
        label-position="top" 
        class="custom-form"
      >
        <!-- 用户名修改 -->
        <el-form-item label="当前用户名" prop="username">
          <el-input 
            v-model="profileForm.username" 
            placeholder="设置您的登录账号" 
            :prefix-icon="User"
          />
          <p class="form-help">修改用户名后，下次登录需使用新账号。</p>
        </el-form-item>

        <!-- 昵称修改 -->
        <el-form-item label="显示昵称" prop="nickname">
          <el-input 
            v-model="profileForm.nickname" 
            placeholder="在系统顶栏显示的名称"
            :prefix-icon="Edit"
          />
        </el-form-item>

        <el-divider border-style="dashed">
          <el-icon><Lock /></el-icon> 安全验证
        </el-divider>

        <!-- 密码修改 -->
        <el-form-item label="设置新密码" prop="password">
          <el-input 
            type="password" 
            v-model="profileForm.password" 
            show-password 
            placeholder="若不修改请留空"
            :prefix-icon="Lock"
          />
          <p class="form-help">建议定期更换密码以保障账号安全。</p>
        </el-form-item>

        <div class="form-actions">
          <el-button 
            type="primary" 
            size="large" 
            :loading="submitting" 
            @click="handleUpdate"
            style="width: 100%; height: 48px; font-weight: 600; border-radius: 10px;"
          >
            保存资料修改
          </el-button>
        </div>
      </el-form>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, User, Lock, Edit } from '@element-plus/icons-vue';
import { getCurrentAdminInfo, updateMyProfile } from '../api/rbac';

const router = useRouter();
const submitting = ref(false);
const formRef = ref(null);

// 表单数据
const profileForm = reactive({
  username: '',
  nickname: '',
  password: ''
});

// 验证规则
const rules = {
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  nickname: [{ required: true, message: '昵称不能为空', trigger: 'blur' }]
};

// 获取当前管理员信息填充表单
const fetchProfile = async () => {
  try {
    const res = await getCurrentAdminInfo();
    if (res.code === 200) {
      profileForm.username = res.data.user.username;
      profileForm.nickname = res.data.user.nickname;
    }
  } catch (error) {
    console.error("加载个人资料失败", error);
  }
};

// 提交修改
const handleUpdate = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const res = await updateMyProfile(profileForm);
      if (res.code === 200) {
        ElMessage.success('个人资料已成功更新');
        handleLogout(); // 更新后强制登出
        profileForm.password = ''; // 清空密码框
        // 重新获取数据以同步状态
        fetchProfile();
      } else {
        ElMessage.error(res.message || '更新失败');
      }
    } finally {
      submitting.value = false;
    }
  });
};

const handleLogout = () => {
  localStorage.removeItem('Account-token');
  router.replace('/login');
  this.$emit('logout');
};

onMounted(fetchProfile);
</script>

<style scoped>
/* 继承并复用 RbacManageView 的核心样式 */
.page-container { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.header-left h1 { font-size: 28px; margin: 4px 0; color: var(--el-text-color-primary); }
.eyebrow { font-size: 12px; color: var(--el-text-color-placeholder); text-transform: uppercase; letter-spacing: 1.5px; }

/* 内容面板样式 */
.content-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--el-box-shadow-light);
}

.panel-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 30px; 
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.panel-title { font-size: 20px; font-weight: 700; color: var(--el-text-color-primary); }

/* 表单细节 */
.custom-form { margin-top: 10px; }
.form-help { font-size: 12px; color: var(--el-text-color-placeholder); margin-top: 6px; }
.form-actions { margin-top: 40px; }

/* 复用动画 */
.animate-up { animation: slideUp 0.4s ease-out; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

:deep(.el-form-item__label) {
  font-weight: 600;
  padding-bottom: 8px;
  color: var(--el-text-color-regular);
}

:deep(.el-input__wrapper) {
  padding: 8px 15px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.el-divider__text {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  font-weight: 500;
}
</style>