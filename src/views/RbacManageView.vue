<template>
  <div class="page-container">
    <!-- 1. 顶部标题区 -->
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">系统权限控制中心</p>
      </div>
      <div class="header-actions">
        <el-button @click="router.push('/')" :icon="ArrowLeft">返回仪表盘</el-button>
      </div>
    </header>

    <!-- 2. 现代感分段控制器 (Tabs) -->
    <div class="tabs-wrapper">
      <div class="segment-control">
        <div 
          v-for="tab in tabOptions" 
          :key="tab.key"
          :class="['segment-item', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <el-icon><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
        </div>
      </div>
    </div>

    <!-- 3.1 管理员账号管理 -->
    <section v-if="activeTab === 'user'" class="content-panel animate-up">
      <div class="panel-header">
        <div class="panel-title">账号列表</div>
        <el-button type="primary" :icon="Plus" @click="openUserModal()">添加管理员</el-button>
      </div>

      <el-table :data="admins" border stripe class="custom-table">
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="scope">
            <span class="font-bold">{{ scope.row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column label="所属角色" min-width="150">
          <template #default="scope">
            <el-tag effect="light" round>{{ getRoleName(scope.row.roleId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openUserModal(scope.row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button link type="danger" @click="handleDeleteUser(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 3.2 角色管理 (卡片网格布局) -->
    <section v-if="activeTab === 'role'" class="content-panel animate-up">
      <div class="panel-header">
        <div class="panel-title">角色矩阵</div>
        <el-button type="primary" :icon="Plus" @click="openRoleModal()">新增角色</el-button>
      </div>

      <el-row :gutter="20" class="role-grid">
        <el-col v-for="role in roles" :key="role.id" :xs="24" :sm="12" :md="12" :lg="8" class="role-col">
          <div class="role-card">
            <div class="role-card-header">
              <div class="role-info">
                <h3>{{ role.roleName }}</h3>
                <code>{{ role.roleKey }}</code>
              </div>
              <el-tag v-if="role.parentId != 0" size="small" type="info">继承父级</el-tag>
            </div>
            
            <div class="role-card-body">
              <div class="body-label">权限配置</div>
              <el-scrollbar max-height="160px">
                <div class="perm-list">
                  <el-checkbox-group v-model="rolePermMap[role.id]" @change="handleSaveRolePerms(role.id)">
                    <el-checkbox v-for="p in allPermissions" :key="p.id" :label="p.id">
                      {{ p.name }}
                    </el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-scrollbar>
            </div>

            <div class="role-card-footer">
              <el-button link type="danger" :icon="Delete" @click="handleDeleteRole(role.id)">
                删除此角色
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </section>

    <!-- 3.3 权限项定义 -->
    <section v-if="activeTab === 'perm'" class="content-panel animate-up">
      <div class="panel-header">
        <div class="panel-title">权限标识库</div>
        <el-button type="primary" :icon="Plus" @click="openPermModal()">添加权限项</el-button>
      </div>

      <el-table :data="allPermissions" border stripe>
        <el-table-column prop="name" label="权限名称" width="200" />
        <el-table-column prop="permKey" label="权限标识">
          <template #default="scope">
            <code class="code-tag">{{ scope.row.permKey }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="scope">
            <el-button link type="danger" @click="handleDeletePerm(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 4. 弹窗组件 -->
    
    <!-- 管理员弹窗 -->
    <el-dialog v-model="showUserModal" :title="userForm.id ? '编辑管理员' : '新增管理员'" width="440px">
      <el-form label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username"  placeholder="账号名称" />
        </el-form-item>
        <el-form-item label="登录密码" >
          <el-input type="password" v-model="userForm.password" show-password placeholder="设置初始密码" />
        </el-form-item>
        <el-form-item label="所属角色">
          <el-select v-model="userForm.roleId" placeholder="选择角色权限" style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.roleName" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUserModal = false">取消</el-button>
        <el-button type="primary" @click="submitUserForm">确定保存</el-button>
      </template>
    </el-dialog>

    <!-- 角色弹窗 -->
    <el-dialog v-model="showRoleModal" title="新增角色" width="440px">
      <el-form label-position="top">
        <el-form-item label="角色名称">
          <el-input v-model="roleForm.roleName" placeholder="例如：财务管理员" />
        </el-form-item>
        <el-form-item label="角色标识 (Key)">
          <el-input v-model="roleForm.roleKey" placeholder="例如：finance_admin" />
        </el-form-item>
        <el-form-item label="继承角色 (可选)">
          <el-select v-model="roleForm.parentId" style="width: 100%">
            <el-option :value="0" label="不继承 (顶级角色)" />
            <el-option v-for="r in roles" :key="r.id" :label="r.roleName" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRoleModal = false">取消</el-button>
        <el-button type="primary" @click="submitRoleForm">创建角色</el-button>
      </template>
    </el-dialog>

    <!-- 权限项弹窗 -->
    <el-dialog v-model="showPermModal" title="新增权限项" width="440px">
      <el-form label-position="top">
        <el-form-item label="权限名称">
          <el-input v-model="permForm.name" placeholder="例如：导出财务报表" />
        </el-form-item>
        <el-form-item label="权限标识 (permKey)">
          <el-input v-model="permForm.permKey" placeholder="例如：report:export" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="permForm.description" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPermModal = false">取消</el-button>
        <el-button type="primary" @click="submitPermForm">保存权限</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowLeft, Plus, Delete, User, Lock, 
  CollectionTag, Setting 
} from '@element-plus/icons-vue';
import * as rbacApi from '../api/rbac';

const router = useRouter();
const activeTab = ref('user');
const loading = ref(false);

const tabOptions = [
  { key: 'user', label: '管理员账号', icon: User },
  { key: 'role', label: '角色与权限', icon: Lock },
  { key: 'perm', label: '权限项定义', icon: CollectionTag },
];

// --- 保持原有逻辑数据结构不变 ---
const admins = ref([]);
const roles = ref([]);
const allPermissions = ref([]);
const rolePermMap = reactive({});

// --- 保持原有方法逻辑不变 ---
const fetchAll = async () => {
  loading.value = true;
  try {
    const [uRes, rRes, pRes] = await Promise.all([
      rbacApi.getAdminList(),
      rbacApi.getRoleListWithPerms(),
      rbacApi.getPermissionList()
    ]);
    admins.value = uRes.data;
    roles.value = rRes.data;
    allPermissions.value = pRes.data;
    
    roles.value.forEach(role => {
      rolePermMap[role.id] = role.permissionIds || [];
    });
  } finally {
    loading.value = false;
  }
};

const getRoleName = (id) => roles.value.find(r => r.id === id)?.roleName || (id === 0 ? '系统根级' : '未知角色');

const showUserModal = ref(false);
const userForm = reactive({ id: null, username: '', password: '', roleId: null, status: 1 });
const openUserModal = (user = null) => {
  if (user) Object.assign(userForm, user);
  else Object.assign(userForm, { id: null, username: '', password: '', roleId: null, status: 1 });
  showUserModal.value = true;
};
const submitUserForm = async () => {
  if (userForm.id) await rbacApi.updateAdminAccount(userForm);
  else await rbacApi.addAdminAccount(userForm);
  showUserModal.value = false;
  fetchAll();
};
const handleDeleteUser = async (id) => {
  if (!confirm("确定删除该管理员?")) return;
  await rbacApi.deleteAdminAccount(id);
  fetchAll();
};

const showRoleModal = ref(false);
const roleForm = reactive({ roleName: '', roleKey: '', parentId: 0 });
const openRoleModal = () => {
  Object.assign(roleForm, { roleName: '', roleKey: '', parentId: 0 });
  showRoleModal.value = true;
};
const submitRoleForm = async () => {
  await rbacApi.addRole(roleForm);
  showRoleModal.value = false;
  fetchAll();
};
const handleDeleteRole = async (id) => {
  if (!confirm("删除角色将同时清理其权限关联，是否继续?")) return;
  await rbacApi.deleteRole(id);
  fetchAll();
};

const showPermModal = ref(false);
const permForm = reactive({ name: '', permKey: '', description: '' });
const openPermModal = () => {
  Object.assign(permForm, { name: '', permKey: '', description: '' });
  showPermModal.value = true;
};
const submitPermForm = async () => {
  await rbacApi.addPermission(permForm);
  showPermModal.value = false;
  fetchAll();
};
const handleDeletePerm = async (id) => {
  if (!confirm("确定删除此权限定义?")) return;
  await rbacApi.deletePermission(id);
  fetchAll();
};

const handleSaveRolePerms = async (roleId) => {
  await rbacApi.assignRolePermissions({
    roleId: roleId,
    permissionIds: rolePermMap[roleId]
  });
};

onMounted(fetchAll);
</script>

<style scoped>
.page-container { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.header-left h1 { font-size: 28px; margin: 4px 0; color: var(--el-text-color-primary); }
.eyebrow { font-size: 12px; color: var(--el-text-color-placeholder); text-transform: uppercase; letter-spacing: 1.5px; }

/* 分段切换器 (Tabs) */
.tabs-wrapper { margin-bottom: 24px; }
.segment-control {
  display: inline-flex;
  background: var(--el-fill-color-light);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-light);
}
.segment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.segment-item:hover { color: var(--el-color-primary); }
.segment-item.active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  box-shadow: var(--el-box-shadow-lighter);
}

/* 内容面板 */
.content-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--el-box-shadow-light);
}
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.panel-title { font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); }

/* 角色网格卡片 */
.role-grid { margin-top: -10px; }
.role-col { margin-bottom: 20px; }
.role-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  height: 100%;
}
.role-card:hover { border-color: var(--el-color-primary); transform: translateY(-2px); }
.role-card-header {
  padding: 16px 20px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.role-info h3 { margin: 0; font-size: 16px; color: var(--el-text-color-primary); }
.role-info code { font-size: 12px; color: var(--el-color-danger); opacity: 0.8; }

.role-card-body { padding: 16px 20px; flex: 1; }
.body-label { font-size: 12px; font-weight: bold; color: var(--el-text-color-placeholder); margin-bottom: 12px; text-transform: uppercase; }

.perm-list { display: grid; gap: 8px; }
:deep(.el-checkbox) { margin-right: 0; width: 100%; }

.role-card-footer {
  padding: 12px 20px;
  background: var(--el-fill-color-extra-light);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  text-align: right;
}

/* 通用组件适配 */
.font-bold { font-weight: 600; }
.code-tag {
  font-family: monospace;
  background: var(--el-color-info-light-9);
  color: var(--el-color-info-dark-2);
  padding: 2px 6px;
  border-radius: 4px;
}

.animate-up { animation: slideUp 0.4s ease-out; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 暗黑模式修正 */
html.dark .segment-control { background: #1a1d1d; }
html.dark .role-card-footer { background: #252929; }
</style>