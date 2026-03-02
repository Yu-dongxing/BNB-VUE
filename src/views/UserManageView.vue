<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete, ArrowLeft, Present, Connection, ArrowDown } from '@element-plus/icons-vue'
import {
  getAdminUserList,
  addAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getChainNftBalance,
  distributeNft
} from "../api/user.js"

// --- 数据定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 查询参数 (对应后端的 UserQueryDTO)
const queryParams = reactive({
  page: 1,
  size: 10,
  userWalletAddress: '',
  startTime: '',
  endTime: ''
})

// 时间范围选择器
const dateRange = ref([])

// 弹窗控制
const dialog = reactive({
  visible: false,
  title: '',
  type: 'add' // add or update
})

// 表单数据
const userForm = reactive({
  id: null,
  userName: '',
  userWalletAddress: '',
  balance: 0
})

const formRef = ref(null)
const rules = {
  userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  userWalletAddress: [{ required: true, message: '请输入钱包地址', trigger: 'blur' }]
}

// 1. 定义一个用于记录行级加载状态的对象
const rowLoading = reactive({
  query: {},      // 记录“链上余额”查询状态，格式为 { 用户ID: true/false }
  distribute: {}  // 如果需要，也可以记录“分发”按钮状态
})

const cardTypeOptions = [
  { label: '铜 (Copper)', value: 1 },
  { label: '银 (Silver)', value: 2 },
  { label: '金 (Gold)', value: 3 }
]


// --- 方法 ---

// 获取列表
const getList = async () => {
  loading.ref = true
  try {
    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.startTime = dateRange.value[0]
      queryParams.endTime = dateRange.value[1]
    } else {
      queryParams.startTime = ''
      queryParams.endTime = ''
    }

    const res = await getAdminUserList(queryParams)
    // 注意：你的后端返回的是 String 格式的 ApiResponse，Axios 拦截器 response.data 会拿到它
    // 如果拦截器没自动 JSON.parse，这里需要手动处理。
    // 假设拦截器已经处理好了 res.data 结构
    const result = typeof res === 'string' ? JSON.parse(res) : res

    if (result.code === 200) {
      tableData.value = result.data.records // Mybatis-Plus IPage 默认结构
      total.value = result.data.total
    } else {
      ElMessage.error(result.message || '获取失败')
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索 & 重置
const handleSearch = () => {
  queryParams.page = 1
  getList()
}

const resetQuery = () => {
  dateRange.value = []
  queryParams.userWalletAddress = ''
  handleSearch()
}

// 新增 & 修改
const openDialog = (type, row) => {
  dialog.type = type
  dialog.title = type === 'add' ? '新增用户' : '修改用户'
  dialog.visible = true

  if (type === 'edit' && row) {
    Object.assign(userForm, row)
  } else {
    // 重置表单
    userForm.id = null
    userForm.userName = ''
    userForm.userWalletAddress = ''
    userForm.balance = 0
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const apiCall = dialog.type === 'add' ? addAdminUser : updateAdminUser
      const res = await apiCall(userForm)
      const result = typeof res === 'string' ? JSON.parse(res) : res

      if (result.code === 200) {
        ElMessage.success('操作成功')
        dialog.visible = false
        getList()
      } else {
        ElMessage.error(result.message)
      }
    }
  })
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除用户 "${row.userName}" 吗？`, '警告', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await deleteAdminUser(row.id)
    const result = typeof res === 'string' ? JSON.parse(res) : res
    if (result.code === 200) {
      ElMessage.success('删除成功')
      getList()
    }
  })
}

const handleQueryChainBalance = async (row, cardId) => {
  // 如果当前行正在查询，直接返回
  if (rowLoading.query[row.id]) return;

  // 开启当前行的 Loading
  rowLoading.query[row.id] = true;
  try {
    // 这里的 getChainNftBalance 需要在 api/user.js 中支持传入两个参数
    const res = await getChainNftBalance(row.id, cardId);
    const result = typeof res === 'string' ? JSON.parse(res) : res;

    if (result.code === 200) {
      // 查找对应的卡牌名称用于展示
      const cardName = cardTypeOptions.find(item => item.value === cardId)?.label || '未知卡牌';

      ElMessageBox.alert(
        `用户 [${row.userName}] 的链上实时 [${cardName}] 持有量为：${result.data} 张`,
        '链上数据查询',
        { confirmButtonText: '确定', type: 'info' }
      );
    } else {
      ElMessage.error(result.message || '查询失败');
    }
  } catch (error) {
    console.error(error);
  } finally {
    rowLoading.query[row.id] = false;
  }
};

// --- 新增：分发 NFT 逻辑 ---
const distributeDialog = reactive({
  visible: false,
  loading: false,
  userName: '',
  form: {
    userId: null,
    amount: 1,
    cardId: 1
  }
});

const openDistributeDialog = (row) => {
  distributeDialog.userName = row.userName;
  distributeDialog.form.userId = row.id;
  distributeDialog.form.cardId = 1;
  distributeDialog.form.amount = 1;
  distributeDialog.visible = true;
};

const submitDistribute = async () => {
  if (distributeDialog.form.amount <= 0) {
    return ElMessage.warning("分发数量必须大于 0");
  }

  distributeDialog.loading = true;
  try {
    const res = await distributeNft(distributeDialog.form);
    const result = typeof res === 'string' ? JSON.parse(res) : res;
    if (result.code === 200) {
      ElMessage.success(`成功为用户 ${distributeDialog.userName} 分发 ${distributeDialog.form.amount} 张卡牌`);
      distributeDialog.visible = false;
    } else {
      ElMessage.error(result.message || '分发失败');
      distributeDialog.visible = false;
    }
  } finally {
    distributeDialog.loading = false;
  }
};

onMounted(() => {
  getList()
})
</script>

<template>
  <div class="page-container">
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">用户管理</p>
      </div>
      <div class="header-actions">
        <el-button @click="$router.push('/')" :icon="ArrowLeft" style="margin-right: 12px;">
          返回首页
        </el-button>
        <el-button type="primary" :icon="Plus" @click="openDialog('add')">
          新增用户
        </el-button>
      </div>
    </header>

    <!-- 搜索栏 -->
    <section class="search-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="钱包地址">
          <el-input v-model="queryParams.userWalletAddress" placeholder="搜索地址" clearable />
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker v-model="dateRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <!-- 数据表格 -->
    <section class="table-panel">
      <el-table :data="tableData" v-loading="loading" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userName" label="用户名" />
        <el-table-column prop="userWalletAddress" label="钱包地址" show-overflow-tooltip />
        <el-table-column prop="balance" label="余额" width="150">
          <template #default="scope">
            <span style="color: #67c23a; font-weight: bold">{{ scope.row.balance }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="scope">
            <div class="user-actions">
              <!-- 第一组：基础管理 -->
              <div class="action-group">
                <el-button link type="primary" :icon="Edit" @click="openDialog('edit', scope.row)">编辑</el-button>
                <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
              </div>

              <div class="action-divider"></div>

              <!-- 第二组：资产操作 -->
              <div class="action-group" style="display: flex; align-items: center; gap: 12px;">

                <!-- 修改后的链上余额查询：使用下拉菜单 -->
                <el-dropdown trigger="click" @command="(cardId) => handleQueryChainBalance(scope.row, cardId)">
                  <el-button link class="btn-chain" :icon="Connection" :loading="rowLoading.query[scope.row.id]">
                    查询卡牌余额<el-icon class="el-icon--right">
                      <ArrowDown />
                    </el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-for="item in cardTypeOptions" :key="item.value" :command="item.value">
                        查询 {{ item.label }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>

                <el-button link class="btn-distribute" :icon="Present"
                  @click="openDistributeDialog(scope.row)">分发卡牌</el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.size"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total"
          @size-change="getList" @current-change="getList" />
      </div>
    </section>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px">
      <el-form :model="userForm" :rules="rules" ref="formRef" label-width="100px" style="padding: 20px">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="userForm.userName" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="钱包地址" prop="userWalletAddress">
          <el-input v-model="userForm.userWalletAddress" placeholder="0x..." />
        </el-form-item>
        <el-form-item label="初始余额" v-if="dialog.type === 'add'">
          <el-input-number v-model="userForm.balance" :precision="6" :step="0.1" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 分发 NFT 弹窗 -->
    <el-dialog v-model="distributeDialog.visible" title="手动分发 NFT 卡牌" width="400px" append-to-body>
      <div style="margin-bottom: 20px;">
        <el-alert title="此操作将直接调用智能合约在链上铸造并发送卡牌到用户钱包，请谨慎操作。" type="warning" show-icon :closable="false" />
      </div>

      <el-form label-width="100px">
        <el-form-item label="接收用户">
          <el-input :value="distributeDialog.userName" disabled />
        </el-form-item>
        <el-form-item label="分发数量">
          <el-input-number v-model="distributeDialog.form.amount" :min="1" style="width: 100%" />
        </el-form-item>
        <!-- 新增：卡牌类型选择器 -->
        <el-form-item label="卡牌类型">
          <el-select v-model="distributeDialog.form.cardId" placeholder="请选择卡牌等级" style="width: 100%">
            <el-option v-for="item in cardTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="distributeDialog.visible = false">取消</el-button>
        <el-button type="success" :loading="distributeDialog.loading" @click="submitDistribute">
          立即分发
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.search-card,
.table-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  width: 100%;
}
.btn-chain {
  color: #409eff;
  display: flex;
  align-items: center;
}
/* 解决 Loading 时图标偏移问题 */
:deep(.el-icon--right) {
  margin-left: 4px;
}
</style>