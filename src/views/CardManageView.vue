<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Check,
  Delete,
  Edit,
  Plus,
  Refresh,
  Search
} from '@element-plus/icons-vue'
import {
  activeBatch,
  addBatch,
  deleteBatch,
  getActiveBatchInfo,
  getBatchList,
  updateBatch
} from '../api/card.js'

const CARD_TYPE_OPTIONS = [
  { label: '卡牌ID（1-铜）', value: 1, badge: 'CARD-1', theme: 'teal' },
  { label: '卡牌ID（2-银）', value: 2, badge: 'CARD-2', theme: 'amber' },
  { label: '卡牌ID（3-金）', value: 3, badge: 'CARD-3', theme: 'coral' }
]

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 }
]

const loading = ref(false)
const activeLoading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const formRef = ref(null)

const queryParams = reactive({
  cardId: null,
  batchName: '',
  batchNo: '',
  status: null,
  isCurrent: null,
  page: 1,
  size: 10
})

const activeBatchMap = reactive({
  card1Batch: null,
  card2Batch: null,
  card3Batch: null
})

const dialog = reactive({
  visible: false,
  type: 'add',
  title: '新增批次'
})

const initialFormState = () => ({
  id: null,
  cardId: 1,
  batchName: '',
  batchNo: '',
  totalSupply: 1000,
  soldCount: 0,
  inventory: 1000,
  unitPrice: 0,
  status: 1,
  remark: '',
  isCurrent: 0
})

const cardForm = reactive(initialFormState())

const rules = {
  cardId: [{ required: true, message: '请选择卡牌类型', trigger: 'change' }],
  totalSupply: [
    { required: true, message: '请输入发行总量', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value || value <= 0) callback(new Error('发行总量必须大于 0'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

const activeSummaryList = computed(() => [
  { key: 'card1Batch', ...CARD_TYPE_OPTIONS[0], batch: activeBatchMap.card1Batch },
  { key: 'card2Batch', ...CARD_TYPE_OPTIONS[1], batch: activeBatchMap.card2Batch },
  { key: 'card3Batch', ...CARD_TYPE_OPTIONS[2], batch: activeBatchMap.card3Batch }
])

const parseResponse = (res) => (typeof res === 'string' ? JSON.parse(res) : res)

const formatCardType = (cardId) =>
  CARD_TYPE_OPTIONS.find((item) => item.value === cardId)?.label || `卡牌ID（${cardId}）`

const formatStatusType = (status) => (status === 1 ? 'success' : 'info')

const formatStatusText = (status) => (status === 1 ? '启用' : '停用')

const formatPrice = (price) => {
  const value = Number(price ?? 0)
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}

const calculatePercentage = (soldCount, totalSupply) => {
  const sold = Number(soldCount || 0)
  const totalValue = Number(totalSupply || 0)
  if (!totalValue) return 0
  const percentage = (sold / totalValue) * 100
  if (sold > 0 && percentage < 0.1) return 0.1
  return Math.min(Number(percentage.toFixed(2)), 100)
}

const syncInventoryWithSupply = () => {
  if (dialog.type === 'add') {
    cardForm.inventory = Number(cardForm.totalSupply || 0)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const result = parseResponse(await getBatchList({ ...queryParams }))
    if (result.code === 200) {
      tableData.value = result.data?.records || []
      total.value = result.data?.total || 0
    } else {
      ElMessage.error(result.message || '获取批次列表失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '获取批次列表失败')
  } finally {
    loading.value = false
  }
}

const fetchActiveInfo = async () => {
  activeLoading.value = true
  try {
    const result = parseResponse(await getActiveBatchInfo())
    if (result.code === 200) {
      activeBatchMap.card1Batch = result.data?.card1Batch || null
      activeBatchMap.card2Batch = result.data?.card2Batch || null
      activeBatchMap.card3Batch = result.data?.card3Batch || null
    } else {
      ElMessage.error(result.message || '获取当前激活批次失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '获取当前激活批次失败')
  } finally {
    activeLoading.value = false
  }
}

const refreshPageData = async () => {
  await Promise.all([fetchList(), fetchActiveInfo()])
}

const handleSearch = () => {
  queryParams.page = 1
  fetchList()
}

const resetQuery = () => {
  Object.assign(queryParams, {
    cardId: null,
    batchName: '',
    batchNo: '',
    status: null,
    isCurrent: null,
    page: 1,
    size: 10
  })
  fetchList()
}

const quickFilterByCard = (cardId) => {
  queryParams.cardId = cardId
  queryParams.page = 1
  fetchList()
}

const openDialog = async (type, row = null) => {
  dialog.type = type
  dialog.title = type === 'add' ? '新增卡牌批次' : '编辑卡牌批次'

  if (type === 'edit' && row) {
    Object.assign(cardForm, initialFormState(), {
      id: row.id,
      cardId: row.cardId,
      batchName: row.batchName || '',
      batchNo: row.batchNo || '',
      totalSupply: row.totalSupply ?? 0,
      soldCount: row.soldCount ?? 0,
      inventory: row.inventory ?? 0,
      unitPrice: Number(row.unitPrice ?? 0),
      status: row.status ?? 1,
      remark: row.remark || '',
      isCurrent: row.isCurrent ?? 0
    })
  } else {
    Object.assign(cardForm, initialFormState(), {
      cardId: queryParams.cardId || 1
    })
    syncInventoryWithSupply()
  }

  dialog.visible = true
  await nextTick()
  formRef.value?.clearValidate()
}

const buildSubmitPayload = () => {
  if (dialog.type === 'add') {
    return {
      cardId: cardForm.cardId,
      batchName: cardForm.batchName || undefined,
      batchNo: cardForm.batchNo || undefined,
      totalSupply: cardForm.totalSupply,
      unitPrice: Number(cardForm.unitPrice || 0),
      status: cardForm.status,
      remark: cardForm.remark || undefined
    }
  }

  return {
    id: cardForm.id,
    batchName: cardForm.batchName || undefined,
    totalSupply: cardForm.totalSupply,
    inventory: cardForm.inventory,
    unitPrice: Number(cardForm.unitPrice || 0),
    status: cardForm.status,
    remark: cardForm.remark || undefined
  }
}

const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true
    const requestFn = dialog.type === 'add' ? addBatch : updateBatch
    const result = parseResponse(await requestFn(buildSubmitPayload()))

    if (result.code === 200) {
      ElMessage.success(result.message || '操作成功')
      dialog.visible = false
      await refreshPageData()
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    if (error?.message) {
      ElMessage.error(error.message)
    }
  } finally {
    submitLoading.value = false
  }
}

const handleActive = (row) => {
  ElMessageBox.confirm(
    `确认激活批次“${row.batchName || row.batchNo || row.id}”吗？仅会切换 ${formatCardType(row.cardId)} 下的激活批次，不影响其他类型。`,
    '激活确认',
    {
      type: 'warning',
      confirmButtonText: '确认激活',
      cancelButtonText: '取消'
    }
  )
    .then(async () => {
      const result = parseResponse(await activeBatch(row.id))
      if (result.code === 200) {
        ElMessage.success(result.message || '激活成功')
        await refreshPageData()
      } else {
        ElMessage.error(result.message || '激活失败')
      }
    })
    .catch(() => {})
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确认删除批次“${row.batchName || row.batchNo || row.id}”吗？`,
    '删除确认',
    {
      type: 'error',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    }
  )
    .then(async () => {
      const result = parseResponse(await deleteBatch(row.id))
      if (result.code === 200) {
        ElMessage.success(result.message || '删除成功')
        await refreshPageData()
      } else {
        ElMessage.error(result.message || '删除失败')
      }
    })
    .catch(() => {})
}

onMounted(refreshPageData)
</script>

<template>
  <div class="page-container card-manage-page">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">ETF CARD BATCH MANAGEMENT</p>
        <h1>卡牌发行管理</h1>
        <p class="header-desc">按卡牌类型维护独立批次，并为每种类型保留一套当前生效批次。</p>
      </div>
      <div class="header-actions">
        <el-button @click="$router.push('/')" :icon="ArrowLeft">返回首页</el-button>
        <el-button type="primary" :icon="Plus" @click="openDialog('add')">新增批次</el-button>
      </div>
    </header>

    <section class="summary-grid" v-loading="activeLoading">
      <article
        v-for="item in activeSummaryList"
        :key="item.key"
        class="summary-card"
        :class="`theme-${item.theme}`"
      >
        <div class="summary-top">
          <div>
            <span class="summary-badge">{{ item.badge }}</span>
            <h3>{{ item.label }}</h3>
          </div>
          <el-button text @click="quickFilterByCard(item.value)">查看该类型</el-button>
        </div>

        <template v-if="item.batch">
          <div class="summary-main">
            <strong>{{ item.batch.batchName || '未命名批次' }}</strong>
            <span>{{ item.batch.batchNo || '系统自动编号' }}</span>
          </div>
          <div class="summary-metrics">
            <div>
              <label>总量</label>
              <span>{{ item.batch.totalSupply }}</span>
            </div>
            <div>
              <label>库存</label>
              <span>{{ item.batch.inventory }}</span>
            </div>
            <div>
              <label>单价</label>
              <span>{{ formatPrice(item.batch.unitPrice) }}</span>
            </div>
          </div>
          <div class="summary-footer">
            <el-tag type="success">当前激活</el-tag>
            <span>{{ item.batch.updateTime || item.batch.createTime }}</span>
          </div>
        </template>

        <template v-else>
          <div class="summary-empty">
            <strong>未配置激活批次</strong>
            <span>请先新增并激活 {{ item.label }} 的启用批次。</span>
          </div>
        </template>
      </article>
    </section>

    <section class="search-panel">
      <div class="search-panel-head">
        <div>
          <h3>批次筛选</h3>
          <p>支持按卡牌类型、批次名称、编号、状态和激活状态联动查询。</p>
        </div>
        <el-button :icon="Refresh" @click="refreshPageData">刷新全部</el-button>
      </div>

      <el-form :model="queryParams" inline class="search-form">
        <el-form-item label="卡牌类型">
          <el-select v-model="queryParams.cardId" placeholder="全部类型" clearable style="width: 140px">
            <el-option
              v-for="item in CARD_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="批次名称">
          <el-input v-model="queryParams.batchName" placeholder="支持模糊查询" clearable />
        </el-form-item>
        <el-form-item label="批次编号">
          <el-input v-model="queryParams.batchNo" placeholder="支持精确查询" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否激活">
          <el-select v-model="queryParams.isCurrent" placeholder="全部" clearable style="width: 120px">
            <el-option label="已激活" :value="1" />
            <el-option label="未激活" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="每页条数">
          <el-select v-model="queryParams.size" style="width: 120px">
            <el-option :value="10" label="10 条" />
            <el-option :value="20" label="20 条" />
            <el-option :value="50" label="50 条" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        title="激活说明"
        type="info"
        :closable="false"
        show-icon
        description="激活操作仅影响当前批次所属的 cardId，同类型旧批次会自动取消激活，不会影响另外两种卡牌类型。"
      />
    </section>

    <section class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="卡牌类型" width="120">
          <template #default="{ row }">
            <el-tag effect="plain">{{ formatCardType(row.cardId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否激活" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isCurrent === 1 ? 'success' : 'info'">
              {{ row.isCurrent === 1 ? '已激活' : '未激活' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="batchName" label="批次名称" min-width="180" />
        <el-table-column prop="batchNo" label="批次编号" min-width="170" show-overflow-tooltip />
        <el-table-column label="发行进度" min-width="230">
          <template #default="{ row }">
            <div class="progress-box">
              <el-progress
                :percentage="calculatePercentage(row.soldCount, row.totalSupply)"
                :stroke-width="12"
                :status="row.inventory === 0 ? 'exception' : row.isCurrent === 1 ? 'success' : ''"
              />
              <div class="progress-info">
                <span>{{ row.soldCount || 0 }} / {{ row.totalSupply || 0 }}</span>
                <span>
                  {{
                    row.totalSupply
                      ? `${(((row.soldCount || 0) / row.totalSupply) * 100).toFixed(2)}%`
                      : '0.00%'
                  }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="inventory" label="库存" width="100" align="center" />
        <el-table-column prop="unitPrice" label="单价(USDT)" width="120" align="right">
          <template #default="{ row }">
            <span class="price-text">{{ formatPrice(row.unitPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="formatStatusType(row.status)">{{ formatStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="success"
              :icon="Check"
              :disabled="row.isCurrent === 1 || row.status !== 1"
              @click="handleActive(row)"
            >
              激活
            </el-button>
            <el-button link type="primary" :icon="Edit" @click="openDialog('edit', row)">
              编辑
            </el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-box">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSearch"
          @current-change="fetchList"
        />
      </div>
    </section>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="cardForm" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="卡牌类型" prop="cardId">
              <el-select
                v-model="cardForm.cardId"
                :disabled="dialog.type === 'edit'"
                placeholder="请选择卡牌类型"
                style="width: 100%"
              >
                <el-option
                  v-for="item in CARD_TYPE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发行总量" prop="totalSupply">
              <el-input-number
                v-model="cardForm.totalSupply"
                :min="1"
                :precision="0"
                style="width: 100%"
                @change="syncInventoryWithSupply"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="批次名称">
              <el-input v-model="cardForm.batchName" placeholder="不填则由后端自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批次编号">
              <el-input
                v-model="cardForm.batchNo"
                :disabled="dialog.type === 'edit'"
                :placeholder="dialog.type === 'add' ? '不填则自动生成' : '批次编号不可编辑'"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="单价(USDT)">
              <el-input-number
                v-model="cardForm.unitPrice"
                :min="0"
                :precision="2"
                :step="0.1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="cardForm.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="dialog.type === 'edit'" :gutter="16">
          <el-col :span="12">
            <el-form-item label="库存">
              <el-input-number
                v-model="cardForm.inventory"
                :min="0"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="已售数量">
              <el-input :model-value="cardForm.soldCount" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="cardForm.remark" type="textarea" :rows="4" placeholder="可填写批次说明、活动备注等" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.card-manage-page {
  --card-teal: linear-gradient(135deg, #0f8b8d 0%, #1f6f8b 100%);
  --card-amber: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  --card-coral: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 24px;
}

.header-left h1 {
  margin: 6px 0 8px;
  font-size: 30px;
  line-height: 1.1;
}

.header-desc {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.eyebrow {
  margin: 0;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  letter-spacing: 1.6px;
  text-transform: uppercase;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.summary-card {
  min-height: 208px;
  color: #fff;
  border-radius: 18px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.16);
}

.summary-card::after {
  content: '';
  position: absolute;
  inset: auto -30px -40px auto;
  width: 140px;
  height: 140px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.theme-teal {
  background: var(--card-teal);
}

.theme-amber {
  background: var(--card-amber);
}

.theme-coral {
  background: var(--card-coral);
}

.summary-top,
.summary-footer,
.summary-metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-top {
  margin-bottom: 18px;
}

.summary-top h3 {
  margin: 10px 0 0;
  font-size: 22px;
}

.summary-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 12px;
  letter-spacing: 1px;
}

.summary-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
}

.summary-main strong,
.summary-empty strong {
  font-size: 20px;
  line-height: 1.3;
}

.summary-main span,
.summary-empty span,
.summary-footer span {
  color: rgba(0, 0, 0, 0.78);
}

.summary-metrics {
  gap: 10px;
  margin-bottom: 18px;
}

.summary-metrics > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-metrics label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.68);
}

.summary-metrics span {
  font-size: 18px;
  font-weight: 600;
}

.summary-empty {
  display: flex;
  min-height: 120px;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.search-panel,
.table-container {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 22px;
}

.search-panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.search-panel-head h3 {
  margin: 0 0 6px;
  font-size: 18px;
}

.search-panel-head p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.search-form {
  margin-bottom: 16px;
}

.price-text {
  font-weight: 700;
  color: #c2410c;
}

.progress-box {
  width: 100%;
}

.progress-info {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header,
  .search-panel-head {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
