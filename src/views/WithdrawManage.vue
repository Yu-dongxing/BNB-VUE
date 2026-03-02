<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, ArrowLeft, Select, Close } from '@element-plus/icons-vue'
import { getAdminWithdrawList, auditWithdraw } from "../api/withdraw.js" // 请替换为你实际的相对路径

// --- 数据定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 状态字典
const statusOptions = [
  { label: '待审核', value: 0, type: 'warning' },
  { label: '已通过', value: 1, type: 'success' },
  { label: '已驳回', value: 2, type: 'danger' }
]

const getStatusType = (status) => {
  const item = statusOptions.find(i => i.value === status)
  return item ? item.type : 'info'
}
const getStatusLabel = (status) => {
  const item = statusOptions.find(i => i.value === status)
  return item ? item.label : '未知'
}

// 查询参数 (对应后端的 AdminWithdrawQueryDTO)
const queryParams = reactive({
  page: 1,
  size: 10,
  userId: null,
  userWalletAddress: '',
  orderId: '',
  status: null,
  startDate: '',
  endDate: ''
})

// 时间范围选择器 (格式化为 YYYY-MM-DD，因为后端 DTO 是使用这个格式配合 LocalTime.MIN/MAX)
const dateRange = ref([])

// 审核弹窗控制
const auditDialog = reactive({
  visible: false,
  loading: false,
  row: null, // 当前审核的数据行
  form: {
    recordId: null,
    remark: ''
  }
})

// --- 方法 ---

// 获取提现列表
const getList = async () => {
  loading.value = true
  try {
    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.startDate = dateRange.value[0]
      queryParams.endDate = dateRange.value[1]
    } else {
      queryParams.startDate = ''
      queryParams.endDate = ''
    }

    const res = await getAdminWithdrawList(queryParams)
    const result = typeof res === 'string' ? JSON.parse(res) : res

    if (result.code === 200) {
      tableData.value = result.data.records
      total.value = result.data.total
    } else {
      ElMessage.error(result.message || '获取列表失败')
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
  queryParams.userId = null
  queryParams.userWalletAddress = ''
  queryParams.orderId = ''
  queryParams.status = null
  handleSearch()
}

// 打开审核弹窗
const openAuditDialog = (row) => {
  auditDialog.row = row
  auditDialog.form.recordId = row.id
  auditDialog.form.remark = ''
  auditDialog.visible = true
}

// 提交审核 (同意 or 驳回)
const submitAudit = async (isPass) => {
  const actionText = isPass ? '同意' : '驳回'
  
  if (!isPass && !auditDialog.form.remark.trim()) {
    return ElMessage.warning('请填写驳回原因')
  }

  ElMessageBox.confirm(`确定要 <strong style="color: ${isPass ? '#67c23a' : '#f56c6c'}">${actionText}</strong> 此提现申请吗？`, '审核确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    dangerouslyUseHTMLString: true,
    type: isPass ? 'success' : 'warning'
  }).then(async () => {
    auditDialog.loading = true
    try {
      const payload = {
        recordId: auditDialog.form.recordId,
        isPass: isPass,
        remark: auditDialog.form.remark || (isPass ? '审核通过' : '审核驳回')
      }
      const res = await auditWithdraw(payload)
      const result = typeof res === 'string' ? JSON.parse(res) : res

      if (result.code === 200) {
        ElMessage.success(`提现申请已${actionText}`)
        auditDialog.visible = false
        getList() // 刷新列表
      } else {
        ElMessage.error(result.message || '操作失败')
      }
    } catch (error) {
      console.error(error)
    } finally {
      auditDialog.loading = false
    }
  }).catch(() => {})
}

onMounted(() => {
  getList()
})
</script>

<template>
  <div class="page-container">
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">资金管理 / 提现审核</p>
      </div>
      <div class="header-actions">
        <el-button @click="$router.push('/')" :icon="ArrowLeft">
          返回首页
        </el-button>
      </div>
    </header>

    <!-- 搜索栏 -->
    <section class="search-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="提现单号">
          <el-input v-model="queryParams.orderId" placeholder="搜索单号" clearable />
        </el-form-item>
        <el-form-item label="钱包地址">
          <el-input v-model="queryParams.userWalletAddress" placeholder="搜索地址" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
          <!-- 按照后端要求的 yyyy-MM-dd 格式 -->
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD"
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
        <el-table-column prop="id" label="记录ID" width="80" align="center" />
        <el-table-column prop="orderId" label="提现单号" width="200" show-overflow-tooltip />
        <el-table-column prop="userWalletAddress" label="提现钱包地址" min-width="180" show-overflow-tooltip />
        
        <!-- 金额展示区 -->
        <el-table-column label="扣除总金额" width="140" align="right">
          <template #default="scope">
            <span style="color: #909399; font-weight: bold">{{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="手续费" width="120" align="right">
          <template #default="scope">
            <span style="color: #f56c6c;">{{ scope.row.feeAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实际到账" width="140" align="right">
          <template #default="scope">
            <span style="color: #67c23a; font-weight: bold; font-size: 15px;">{{ scope.row.actualAmount }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="申请时间" width="170" align="center" />
        <el-table-column prop="remark" label="备注" width="150" show-overflow-tooltip />
        
        <el-table-column prop="status" label="状态" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="light">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作区 -->
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status === 0" 
              type="primary" 
              link 
              @click="openAuditDialog(scope.row)">
              马上审核
            </el-button>
            <span v-else style="color: var(--el-text-color-secondary); font-size: 13px;">已处理</span>
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

    <!-- 审核弹窗 -->
    <el-dialog v-model="auditDialog.visible" title="提现申请审核" width="450px" destroy-on-close>
      <div v-if="auditDialog.row" class="audit-info-box">
        <el-descriptions :column="1" border size="small" class="custom-descriptions">
          <el-descriptions-item label="提现单号">{{ auditDialog.row.orderId }}</el-descriptions-item>
          <el-descriptions-item label="钱包地址">{{ auditDialog.row.userWalletAddress }}</el-descriptions-item>
          <el-descriptions-item label="申请扣除总金额">
            <span class="highlight-text">{{ auditDialog.row.amount }}</span> USDT
          </el-descriptions-item>
          <el-descriptions-item label="需扣除手续费">
            <span class="highlight-text danger-text">{{ auditDialog.row.feeAmount }}</span> USDT
            <span style="color: #909399; font-size: 12px; margin-left: 5px">
              (费率: {{ (auditDialog.row.feeRate * 100).toFixed(2) }}%)
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="实际应打款金额">
            <span class="highlight-text success-text" style="font-size: 18px;">{{ auditDialog.row.actualAmount }}</span> USDT
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form :model="auditDialog.form" label-position="top" style="margin-top: 20px;">
        <el-form-item label="审核备注 / 驳回原因 (必填选项若为驳回)">
          <el-input 
            v-model="auditDialog.form.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注，如果驳回则必填..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <!-- 驳回按钮 (危险操作) -->
          <el-button 
            type="danger" 
            plain 
            :icon="Close" 
            :loading="auditDialog.loading" 
            @click="submitAudit(false)">
            驳回并退款
          </el-button>
          <!-- 同意按钮 (成功操作) -->
          <el-button 
            type="success" 
            :icon="Select" 
            :loading="auditDialog.loading" 
            @click="submitAudit(true)">
            同意并放款
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 延续你给定的 CSS 变量风格，支持亮暗色模式 */
.page-container {
  /* 外层容器根据你自身框架需要调整 */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.eyebrow {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin: 0;
}

.search-card,
.table-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 审核弹窗内部样式优化 */
.audit-info-box {
  background: var(--el-bg-color-page);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.highlight-text {
  font-weight: bold;
  font-family: monospace;
}
.success-text {
  color: var(--el-color-success);
}
.danger-text {
  color: var(--el-color-danger);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 覆盖 Descriptions 的默认底色以适配暗黑模式 */
:deep(.custom-descriptions .el-descriptions__label) {
  background-color: var(--el-fill-color-light) !important;
  color: var(--el-text-color-regular);
  width: 140px;
}
:deep(.custom-descriptions .el-descriptions__content) {
  background-color: var(--el-bg-color) !important;
  color: var(--el-text-color-primary);
}
</style>