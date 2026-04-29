<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  ArrowLeft,
  Connection,
  Delete,
  Edit,
  GoldMedal,
  Money,
  Plus,
  Present,
  Refresh,
  Search,
  Van
} from '@element-plus/icons-vue'
import {
  addAdminUser,
  deleteAdminUser,
  depositUserAmount,
  distributeNft,
  getAdminUserList,
  getChainNftBalance,
  setUserCustomGrade,
  updateAdminUser
} from '../api/user.js'
import { assignSpecialMiner } from '../api/miner.js'
import { getCurrentAdminInfo } from '../api/rbac.js'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])
const formRef = ref(null)
const assignFormRef = ref(null)
const gradeFormRef = ref(null)
const depositFormRef = ref(null)
const currentRoleKey = ref('')

const queryParams = reactive({
  page: 1,
  size: 10,
  userWalletAddress: '',
  userGrade: null,
  goldQuantRewardLevel: null,
  goldQuantDistributionLevel: null,
  startTime: '',
  endTime: ''
})

const dialog = reactive({
  visible: false,
  title: '',
  type: 'add'
})

const userForm = reactive({
  id: null,
  userName: '',
  userWalletAddress: '',
  balance: 0
})

const userFormRules = {
  userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  userWalletAddress: [{ required: true, message: '请输入钱包地址', trigger: 'blur' }]
}

const rowLoading = reactive({
  query: {}
})

const getResultMessage = (result, fallback) => result?.msg || result?.message || fallback

const cardTypeOptions = [
  { label: '铜卡 (Copper)', value: 1 },
  { label: '银卡 (Silver)', value: 2 },
  { label: '金卡 (Gold)', value: 3 }
]

const distributeDialog = reactive({
  visible: false,
  loading: false,
  userName: '',
  form: {
    userId: null,
    amount: 1,
    cardId: 1
  }
})

const assignSpecialDialog = reactive({
  visible: false,
  loading: false,
  userName: '',
  result: null,
  form: {
    userId: null,
    quantity: 1,
    remark: ''
  }
})

const gradeDialog = reactive({
  visible: false,
  loading: false,
  userName: '',
  currentUserGrade: null,
  form: {
    userId: null,
    customUserGrade: 0
  }
})

const depositDialog = reactive({
  visible: false,
  loading: false,
  userName: '',
  form: {
    userId: null,
    amount: '',
    source: 'v1 团队电费业绩'
  }
})

const assignSpecialRules = {
  userId: [{ required: true, message: '用户 ID 不能为空', trigger: 'change' }],
  quantity: [
    { required: true, message: '发放数量不能为空', trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        if (!Number.isInteger(value) || value <= 0) {
          callback(new Error('发放数量必须为正整数'))
          return
        }

        if (value > 100) {
          callback(new Error('单次发放数量不能超过 100'))
          return
        }

        callback()
      },
      trigger: 'change'
    }
  ]
}

const gradeRules = {
  userId: [{ required: true, message: '用户 ID 不能为空', trigger: 'change' }],
  customUserGrade: [
    { required: true, message: '请输入自定义等级，0 表示清除', trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        if (!Number.isInteger(value) || value < 0) {
          callback(new Error('自定义等级必须为 0 或正整数'))
          return
        }

        callback()
      },
      trigger: 'change'
    }
  ]
}

const depositRules = {
  userId: [{ required: true, message: '用户 ID 不能为空', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入下发金额', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        const amount = String(value ?? '').trim()
        if (!amount || Number(amount) <= 0) {
          callback(new Error('下发金额必须大于 0'))
          return
        }

        callback()
      },
      trigger: 'blur'
    }
  ],
  source: [{ required: true, message: '请输入资金来源', trigger: 'blur' }]
}

const isSuperAdmin = computed(() => currentRoleKey.value === 'super_admin')

const normalizeResult = (res) => (typeof res === 'string' ? JSON.parse(res) : res)

const formatGrade = (grade) => {
  if (grade === undefined || grade === null || grade === '') return '-'
  return `V${grade}`
}

const syncDateRange = () => {
  if (dateRange.value?.length === 2) {
    queryParams.startTime = dateRange.value[0]
    queryParams.endTime = dateRange.value[1]
    return
  }

  queryParams.startTime = ''
  queryParams.endTime = ''
}

const fetchCurrentAdminRole = async () => {
  try {
    const res = await getCurrentAdminInfo()
    if (res?.code === 200 && res.data?.role?.roleKey) {
      currentRoleKey.value = res.data.role.roleKey
    }
  } catch (error) {
    console.error('获取当前管理员角色失败', error)
    currentRoleKey.value = ''
  }
}

const getList = async () => {
  loading.value = true
  try {
    syncDateRange()
    const result = normalizeResult(await getAdminUserList(queryParams))

    if (result.code === 200) {
      tableData.value = result.data?.records || []
      total.value = result.data?.total || 0
      return
    }

    ElMessage.error(getResultMessage(result, '获取用户列表失败'))
  } catch (error) {
    console.error(error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  getList()
}

const resetQuery = () => {
  dateRange.value = []
  queryParams.userWalletAddress = ''
  queryParams.userGrade = null
  queryParams.goldQuantRewardLevel = null
  queryParams.goldQuantDistributionLevel = null
  queryParams.page = 1
  queryParams.startTime = ''
  queryParams.endTime = ''
  getList()
}

const resetUserForm = () => {
  Object.assign(userForm, {
    id: null,
    userName: '',
    userWalletAddress: '',
    balance: 0
  })
}

const openDialog = (type, row) => {
  dialog.type = type
  dialog.title = type === 'add' ? '新增用户' : '编辑用户'
  dialog.visible = true

  if (type === 'edit' && row) {
    Object.assign(userForm, {
      id: row.id,
      userName: row.userName,
      userWalletAddress: row.userWalletAddress,
      balance: row.balance
    })
    return
  }

  resetUserForm()
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      const apiCall = dialog.type === 'add' ? addAdminUser : updateAdminUser
      const result = normalizeResult(await apiCall(userForm))

      if (result.code === 200) {
        ElMessage.success('操作成功')
        dialog.visible = false
        getList()
        return
      }

      ElMessage.error(getResultMessage(result, '操作失败'))
    } catch (error) {
      console.error(error)
      ElMessage.error('操作失败')
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除用户“${row.userName}”吗？`, '警告', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const result = normalizeResult(await deleteAdminUser(row.id))
      if (result.code === 200) {
        ElMessage.success('删除成功')
        getList()
        return
      }

      ElMessage.error(getResultMessage(result, '删除失败'))
    } catch (error) {
      console.error(error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleQueryChainBalance = async (row, cardId) => {
  if (rowLoading.query[row.id]) return

  rowLoading.query[row.id] = true
  try {
    const result = normalizeResult(await getChainNftBalance(row.id, cardId))

    if (result.code === 200) {
      const cardName = cardTypeOptions.find((item) => item.value === cardId)?.label || '未知卡牌'
      await ElMessageBox.alert(
        `用户 [${row.userName}] 当前链上 [${cardName}] 持有数量为：${result.data ?? 0}`,
        '链上数据查询',
        {
          confirmButtonText: '确定',
          type: 'info'
        }
      )
      return
    }

    ElMessage.error(getResultMessage(result, '查询失败'))
  } catch (error) {
    console.error(error)
    ElMessage.error('查询失败')
  } finally {
    rowLoading.query[row.id] = false
  }
}

const openDistributeDialog = (row) => {
  distributeDialog.userName = row.userName
  distributeDialog.form.userId = row.id
  distributeDialog.form.cardId = 1
  distributeDialog.form.amount = 1
  distributeDialog.visible = true
}

const submitDistribute = async () => {
  if (!Number.isInteger(distributeDialog.form.amount) || distributeDialog.form.amount <= 0) {
    ElMessage.warning('分发数量必须大于 0')
    return
  }

  distributeDialog.loading = true
  try {
    const result = normalizeResult(await distributeNft(distributeDialog.form))
    if (result.code === 200) {
      ElMessage.success(`已为用户 ${distributeDialog.userName} 分发 ${distributeDialog.form.amount} 张卡牌`)
      distributeDialog.visible = false
      return
    }

    ElMessage.error(getResultMessage(result, '分发卡牌失败'))
    distributeDialog.visible = false
  } catch (error) {
    console.error(error)
    ElMessage.error('分发卡牌失败')
  } finally {
    distributeDialog.loading = false
  }
}

const openAssignSpecialDialog = (row) => {
  assignSpecialDialog.userName = row.userName
  assignSpecialDialog.result = null
  assignSpecialDialog.form.userId = row.id
  assignSpecialDialog.form.quantity = 1
  assignSpecialDialog.form.remark = ''
  assignSpecialDialog.visible = true
}

const submitAssignSpecial = async () => {
  if (!assignFormRef.value) return

  await assignFormRef.value.validate(async (valid) => {
    if (!valid) return

    assignSpecialDialog.loading = true
    try {
      const payload = {
        userId: assignSpecialDialog.form.userId,
        quantity: assignSpecialDialog.form.quantity,
        remark: assignSpecialDialog.form.remark?.trim() || undefined
      }

      const result = normalizeResult(await assignSpecialMiner(payload))

      if (result.code === 200) {
        assignSpecialDialog.result = result.data || null
        ElMessage.success(getResultMessage(result, '发放成功'))
        getList()
        return
      }

      ElMessage.error(getResultMessage(result, '发放特殊矿机失败'))
    } catch (error) {
      console.error(error)
      ElMessage.error('发放特殊矿机失败')
    } finally {
      assignSpecialDialog.loading = false
    }
  })
}

const openGradeDialog = (row) => {
  gradeDialog.userName = row.userName
  gradeDialog.currentUserGrade = row.userGrade ?? null
  gradeDialog.form.userId = row.id
  gradeDialog.form.customUserGrade = row.customUserGrade ?? 0
  gradeDialog.visible = true
}

const submitGrade = async () => {
  if (!gradeFormRef.value) return

  await gradeFormRef.value.validate(async (valid) => {
    if (!valid) return

    gradeDialog.loading = true
    try {
      const result = normalizeResult(await setUserCustomGrade({
        userId: gradeDialog.form.userId,
        customUserGrade: gradeDialog.form.customUserGrade
      }))

      if (result.code === 200) {
        ElMessage.success(getResultMessage(result, '设置成功'))
        gradeDialog.visible = false
        getList()
        return
      }

      ElMessage.error(getResultMessage(result, '设置等级失败'))
    } catch (error) {
      console.error(error)
      ElMessage.error('设置等级失败')
    } finally {
      gradeDialog.loading = false
    }
  })
}

const clearCustomGrade = () => {
  gradeDialog.form.customUserGrade = 0
}

const openDepositDialog = (row) => {
  depositDialog.userName = row.userName
  depositDialog.form.userId = row.id
  depositDialog.form.amount = ''
  depositDialog.form.source = '系统充值'
  depositDialog.visible = true
}

const submitDeposit = async () => {
  if (!depositFormRef.value) return

  await depositFormRef.value.validate(async (valid) => {
    if (!valid) return

    depositDialog.loading = true
    try {
      const result = normalizeResult(await depositUserAmount({
        userId: depositDialog.form.userId,
        amount: String(depositDialog.form.amount).trim(),
        transactionType:'DEPOSIT',
        source: depositDialog.form.source.trim()
      }))

      if (result.code === 200) {
        ElMessage.success(getResultMessage(result, '充值成功'))
        depositDialog.visible = false
        getList()
        return
      }

      ElMessage.error(getResultMessage(result, '充值失败'))
    } catch (error) {
      console.error(error)
      ElMessage.error('充值失败')
    } finally {
      depositDialog.loading = false
    }
  })
}

onMounted(async () => {
  await fetchCurrentAdminRole()
  getList()
})
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">用户管理</p>
      </div>
      <div class="header-actions">
        <el-button :icon="ArrowLeft" style="margin-right: 12px" @click="router.push('/')">
          返回首页
        </el-button>
        <el-button type="primary" :icon="Plus" @click="openDialog('add')">
          新增用户
        </el-button>
      </div>
    </header>

    <section class="search-card">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="钱包地址">
          <el-input v-model="queryParams.userWalletAddress" placeholder="搜索钱包地址" clearable />
        </el-form-item>
        <el-form-item label="矿机等级">
          <el-input-number
            v-model="queryParams.userGrade"
            :min="0"
            :precision="0"
            placeholder="等级"
            clearable
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item label="量化奖励等级">
          <el-input-number
            v-model="queryParams.goldQuantRewardLevel"
            :min="0"
            :precision="0"
            placeholder="等级"
            clearable
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item label="量化分销等级">
          <el-input-number
            v-model="queryParams.goldQuantDistributionLevel"
            :min="0"
            :precision="0"
            placeholder="等级"
            clearable
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <el-table :data="tableData" v-loading="loading" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userName" label="用户名" min-width="140" />
        <el-table-column prop="userWalletAddress" label="钱包地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="userGrade" label="矿机等级" width="110">
          <template #default="{ row }">
            <el-tag type="success" effect="plain">{{ formatGrade(row.userGrade) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="goldQuantRewardLevel" label="量化奖励等级" width="130">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ formatGrade(row.goldQuantRewardLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="goldQuantDistributionLevel" label="量化分销等级" width="130">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ formatGrade(row.goldQuantDistributionLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customUserGrade" label="自定义等级" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.customUserGrade" type="warning" effect="plain">
              {{ formatGrade(row.customUserGrade) }}
            </el-tag>
            <span v-else class="muted-text">未设置</span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="150">
          <template #default="{ row }">
            <span class="balance-text">{{ row.balance }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="180" />
        <el-table-column label="操作" width="430" fixed="right" align="center">
          <template #default="{ row }">
            <div class="user-actions">
              <div class="action-group">
                <el-button link type="primary" :icon="Edit" @click="openDialog('edit', row)">编辑</el-button>
                <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
                <el-button link type="warning" :icon="GoldMedal" @click="openGradeDialog(row)">设置等级</el-button>
              </div>

              <div class="action-divider"></div>

              <div class="action-group action-row">
                <el-dropdown trigger="click" @command="(cardId) => handleQueryChainBalance(row, cardId)">
                  <el-button link class="btn-chain" :icon="Connection" :loading="rowLoading.query[row.id]">
                    查询卡牌余额
                    <el-icon class="el-icon--right">
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

                <el-button link class="btn-distribute" :icon="Present" @click="openDistributeDialog(row)">
                  分发卡牌
                </el-button>

                <el-button link class="btn-deposit" :icon="Money" @click="openDepositDialog(row)">
                  人工充值
                </el-button>

                <el-button
                  v-if="isSuperAdmin"
                  link
                  type="warning"
                  :icon="Van"
                  @click="openAssignSpecialDialog(row)"
                >
                  为用户分配特殊矿机
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </section>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px">
      <el-form ref="formRef" :model="userForm" :rules="userFormRules" label-width="100px" style="padding: 20px">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="userForm.userName" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="钱包地址" prop="userWalletAddress">
          <el-input v-model="userForm.userWalletAddress" placeholder="0x..." />
        </el-form-item>
        <el-form-item v-if="dialog.type === 'add'" label="初始余额">
          <el-input-number v-model="userForm.balance" :precision="6" :step="0.1" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="gradeDialog.visible" title="设置用户等级" width="460px" append-to-body>
      <el-form
        ref="gradeFormRef"
        :model="gradeDialog.form"
        :rules="gradeRules"
        label-width="110px"
      >
        <el-form-item label="目标用户">
          <el-input :value="`${gradeDialog.userName}（ID：${gradeDialog.form.userId || '-'}）`" disabled />
        </el-form-item>
        <el-form-item label="当前最终等级">
          <el-input :value="formatGrade(gradeDialog.currentUserGrade)" disabled />
        </el-form-item>
        <el-form-item label="自定义等级" prop="customUserGrade">
          <el-input-number
            v-model="gradeDialog.form.customUserGrade"
            :min="0"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-alert
          title="自定义等级填 0 表示清除；最终等级由后端在自动等级和自定义等级中取较大值。"
          type="info"
          show-icon
          :closable="false"
        />
      </el-form>
      <template #footer>
        <el-button @click="gradeDialog.visible = false">取消</el-button>
        <el-button @click="clearCustomGrade">清除自定义等级</el-button>
        <el-button type="primary" :loading="gradeDialog.loading" @click="submitGrade">确认设置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="depositDialog.visible" title="人工充值" width="500px" append-to-body>
      <el-form
        ref="depositFormRef"
        :model="depositDialog.form"
        :rules="depositRules"
        label-width="100px"
      >
        <el-form-item label="目标用户">
          <el-input :value="`${depositDialog.userName}（ID：${depositDialog.form.userId || '-'}）`" disabled />
        </el-form-item>
        <el-form-item label="充值金额" prop="amount">
          <el-input
            v-model="depositDialog.form.amount"
            placeholder="请输入金额，例如：100.00"
          />
        </el-form-item>
        <el-form-item label="资金备注" prop="source">
          <el-input
            v-model="depositDialog.form.source"
            maxlength="60"
            show-word-limit
            placeholder="例如：系统充值"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="depositDialog.visible = false">取消</el-button>
        <el-button type="success" :loading="depositDialog.loading" @click="submitDeposit">确认充值</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="distributeDialog.visible" title="手动分发 NFT 卡牌" width="400px" append-to-body>
      <div style="margin-bottom: 20px">
        <el-alert
          title="此操作将直接调用合约向用户钱包分发卡牌，请谨慎操作。"
          type="warning"
          show-icon
          :closable="false"
        />
      </div>

      <el-form label-width="100px">
        <el-form-item label="接收用户">
          <el-input :value="distributeDialog.userName" disabled />
        </el-form-item>
        <el-form-item label="分发数量">
          <el-input-number v-model="distributeDialog.form.amount" :min="1" style="width: 100%" />
        </el-form-item>
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

    <el-dialog v-model="assignSpecialDialog.visible" title="为用户分配特殊矿机" width="520px" append-to-body>
      <el-alert
        title="特殊矿机发放后不会立即激活，用户后续自行缴纳电费后才开始产收益。"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-form
        ref="assignFormRef"
        :model="assignSpecialDialog.form"
        :rules="assignSpecialRules"
        label-width="100px"
      >
        <el-form-item label="目标用户">
          <el-input :value="`${assignSpecialDialog.userName}（ID：${assignSpecialDialog.form.userId || '-'}）`" disabled />
        </el-form-item>
        <!-- <el-form-item label="用户 ID" prop="userId">
          <el-input-number v-model="assignSpecialDialog.form.userId" :min="1" :precision="0" style="width: 100%" />
        </el-form-item> -->
        <el-form-item label="发放数量" prop="quantity">
          <el-input-number
            v-model="assignSpecialDialog.form.quantity"
            :min="1"
            :max="100"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="assignSpecialDialog.form.remark"
            type="textarea"
            :rows="3"
            maxlength="100"
            show-word-limit
            placeholder="请输入备注，例如：赠送"
          />
        </el-form-item>
      </el-form>

      <div v-if="assignSpecialDialog.result" class="assign-result">
        <div class="assign-result__title">发放结果</div>
        <div>用户 ID：{{ assignSpecialDialog.result.userId }}</div>
        <div>发放数量：{{ assignSpecialDialog.result.quantity }}</div>
        <div>矿机 ID：{{ (assignSpecialDialog.result.minerIds || []).join(', ') || '-' }}</div>
      </div>

      <template #footer>
        <el-button @click="assignSpecialDialog.visible = false">取消</el-button>
        <el-button type="warning" :loading="assignSpecialDialog.loading" @click="submitAssignSpecial">
          确认发放
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

.balance-text {
  color: #67c23a;
  font-weight: bold;
}

.muted-text {
  color: var(--el-text-color-secondary);
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.action-row {
  align-items: center;
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

.btn-distribute {
  color: var(--el-color-success);
}

.btn-deposit {
  color: var(--el-color-success);
}

.assign-result {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  line-height: 1.8;
}

.assign-result__title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

:deep(.el-icon--right) {
  margin-left: 4px;
}
</style>
