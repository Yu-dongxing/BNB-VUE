<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh, Search } from '@element-plus/icons-vue'
import { getGoldQuantCommissionList, getGoldQuantCommissionStatistics } from '../api/card.js'

const commissionTypeOptions = [
  { label: '奖励分成', value: 'REWARD', type: 'success' },
  { label: '分销分成', value: 'DISTRIBUTION', type: 'warning' }
]

const loading = ref(false)
const statsLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const createDateRange = ref([])
const stats = ref({
  rewardAmount: 0,
  distributionAmount: 0,
  totalAmount: 0,
  totalCount: 0,
  todayAmount: 0
})

const queryParams = reactive({
  page: 1,
  size: 10,
  beneficiaryUserId: null,
  beneficiaryWalletAddress: '',
  sourceUserId: null,
  sourceWalletAddress: '',
  sourceOrderId: '',
  commissionType: '',
  level: null,
  minGeneration: null,
  maxGeneration: null,
  minRatio: null,
  maxRatio: null,
  minOrderAmount: null,
  maxOrderAmount: null,
  minCommissionAmount: null,
  maxCommissionAmount: null,
  startTime: '',
  endTime: ''
})

const parseResponse = (res) => (typeof res === 'string' ? JSON.parse(res) : res)
const getCommissionTypeOption = (type) => commissionTypeOptions.find((item) => item.value === type)

const syncDateRange = () => {
  queryParams.startTime = createDateRange.value?.[0] || ''
  queryParams.endTime = createDateRange.value?.[1] || ''
}

const buildPayload = () => {
  syncDateRange()
  return Object.fromEntries(
    Object.entries({ ...queryParams }).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  )
}

const fetchStatistics = async () => {
  statsLoading.value = true
  try {
    const { page, size, ...payload } = buildPayload()
    const result = parseResponse(await getGoldQuantCommissionStatistics(payload))
    if (result.code === 200) {
      stats.value = {
        rewardAmount: result.data?.rewardAmount ?? 0,
        distributionAmount: result.data?.distributionAmount ?? 0,
        totalAmount: result.data?.totalAmount ?? 0,
        totalCount: result.data?.totalCount ?? 0,
        todayAmount: result.data?.todayAmount ?? 0
      }
    } else {
      ElMessage.error(result.msg || result.message || '查询分成统计失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '查询分成统计失败')
  } finally {
    statsLoading.value = false
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const result = parseResponse(await getGoldQuantCommissionList(buildPayload()))
    if (result.code === 200) {
      tableData.value = result.data?.records || []
      total.value = result.data?.total || 0
    } else {
      ElMessage.error(result.msg || result.message || '查询黄金量化分成记录失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '查询黄金量化分成记录失败')
  } finally {
    loading.value = false
  }
}

const fetchPageData = () => {
  fetchList()
  fetchStatistics()
}

const handleSearch = () => {
  queryParams.page = 1
  fetchPageData()
}

const resetQuery = () => {
  Object.assign(queryParams, {
    page: 1,
    size: 10,
    beneficiaryUserId: null,
    beneficiaryWalletAddress: '',
    sourceUserId: null,
    sourceWalletAddress: '',
    sourceOrderId: '',
    commissionType: '',
    level: null,
    minGeneration: null,
    maxGeneration: null,
    minRatio: null,
    maxRatio: null,
    minOrderAmount: null,
    maxOrderAmount: null,
    minCommissionAmount: null,
    maxCommissionAmount: null,
    startTime: '',
    endTime: ''
  })
  createDateRange.value = []
  fetchPageData()
}

const formatEmpty = (value) => value || '-'
const formatAmount = (value) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 6 })
const formatPercent = (value) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return '-'
  return `${Number((numericValue * 100).toFixed(4))}%`
}
const formatLevel = (value) => (Number(value) > 0 ? `V${value}` : '无等级')

onMounted(fetchPageData)
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">GOLD QUANT COMMISSION</p>
        <h1>黄金量化分成/分销记录</h1>
      </div>
      <el-button @click="$router.push('/')" :icon="ArrowLeft">返回首页</el-button>
    </header>

    <section class="stats-grid" v-loading="statsLoading">
      <div class="stat-item">
        <span>奖励分成</span>
        <strong>{{ formatAmount(stats.rewardAmount) }}</strong>
      </div>
      <div class="stat-item">
        <span>分销分成</span>
        <strong>{{ formatAmount(stats.distributionAmount) }}</strong>
      </div>
      <div class="stat-item">
        <span>分成总额</span>
        <strong>{{ formatAmount(stats.totalAmount) }}</strong>
      </div>
      <div class="stat-item">
        <span>总笔数</span>
        <strong>{{ stats.totalCount || 0 }}</strong>
      </div>
      <div class="stat-item">
        <span>今日分成</span>
        <strong>{{ formatAmount(stats.todayAmount) }}</strong>
      </div>
    </section>

    <section class="search-panel">
      <el-form :model="queryParams" inline class="filter-form">
        <el-form-item label="收益用户ID">
          <el-input-number v-model="queryParams.beneficiaryUserId" :min="1" :precision="0" placeholder="精确筛选" clearable />
        </el-form-item>
        <el-form-item label="收益钱包">
          <el-input v-model="queryParams.beneficiaryWalletAddress" placeholder="支持模糊查询" clearable style="width: 210px" />
        </el-form-item>
        <el-form-item label="来源用户ID">
          <el-input-number v-model="queryParams.sourceUserId" :min="1" :precision="0" placeholder="精确筛选" clearable />
        </el-form-item>
        <el-form-item label="来源钱包">
          <el-input v-model="queryParams.sourceWalletAddress" placeholder="支持模糊查询" clearable style="width: 210px" />
        </el-form-item>
        <el-form-item label="来源订单">
          <el-input v-model="queryParams.sourceOrderId" placeholder="订单号" clearable style="width: 190px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="queryParams.commissionType" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="item in commissionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级">
          <el-input-number v-model="queryParams.level" :min="1" :precision="0" placeholder="V 等级" clearable />
        </el-form-item>
        <el-form-item label="代数">
          <div class="range-inline">
            <el-input-number v-model="queryParams.minGeneration" :min="1" :precision="0" placeholder="最小" clearable />
            <span>至</span>
            <el-input-number v-model="queryParams.maxGeneration" :min="1" :precision="0" placeholder="最大" clearable />
          </div>
        </el-form-item>
        <el-form-item label="比例">
          <div class="range-inline">
            <el-input-number v-model="queryParams.minRatio" :precision="4" :step="0.01" :min="0" :max="1" placeholder="最小" clearable />
            <span>至</span>
            <el-input-number v-model="queryParams.maxRatio" :precision="4" :step="0.01" :min="0" :max="1" placeholder="最大" clearable />
          </div>
        </el-form-item>
        <el-form-item label="订单金额">
          <div class="range-inline">
            <el-input-number v-model="queryParams.minOrderAmount" :precision="2" :min="0" placeholder="最小" clearable />
            <span>至</span>
            <el-input-number v-model="queryParams.maxOrderAmount" :precision="2" :min="0" placeholder="最大" clearable />
          </div>
        </el-form-item>
        <el-form-item label="分成金额">
          <div class="range-inline">
            <el-input-number v-model="queryParams.minCommissionAmount" :precision="2" :min="0" placeholder="最小" clearable />
            <span>至</span>
            <el-input-number v-model="queryParams.maxCommissionAmount" :precision="2" :min="0" placeholder="最大" clearable />
          </div>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="createDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </el-form-item>
        <!-- <el-form-item label="每页">
          <el-select v-model="queryParams.size" style="width: 110px">
            <el-option :value="10" label="10 条" />
            <el-option :value="20" label="20 条" />
            <el-option :value="50" label="50 条" />
          </el-select>
        </el-form-item> -->
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="90" align="center" />
        <el-table-column label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getCommissionTypeOption(row.commissionType)?.type || 'info'">
              {{ getCommissionTypeOption(row.commissionType)?.label || row.commissionType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="beneficiaryUserId" label="收益用户ID" width="120" align="center" />
        <el-table-column prop="beneficiaryWalletAddress" label="收益钱包" min-width="210" show-overflow-tooltip />
        <el-table-column prop="sourceUserId" label="来源用户ID" width="120" align="center" />
        <el-table-column prop="sourceWalletAddress" label="来源钱包" min-width="210" show-overflow-tooltip />
        <el-table-column prop="sourceOrderId" label="来源订单" min-width="180" show-overflow-tooltip />
        <el-table-column label="来源账单" width="110" align="center">
          <template #default="{ row }">{{ formatEmpty(row.sourceBillId) }}</template>
        </el-table-column>
        <el-table-column label="入账账单" width="110" align="center">
          <template #default="{ row }">{{ formatEmpty(row.commissionBillId) }}</template>
        </el-table-column>
        <el-table-column label="等级" width="90" align="center">
          <template #default="{ row }">{{ formatLevel(row.level) }}</template>
        </el-table-column>
        <el-table-column prop="generation" label="代数" width="90" align="center" />
        <el-table-column label="比例" width="100" align="center">
          <template #default="{ row }">{{ formatPercent(row.ratio) }}</template>
        </el-table-column>
        <el-table-column label="订单金额" width="140" align="right">
          <template #default="{ row }">{{ formatAmount(row.orderAmount) }}</template>
        </el-table-column>
        <el-table-column label="分成金额" width="140" align="right">
          <template #default="{ row }">{{ formatAmount(row.commissionAmount) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="说明" min-width="260" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
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
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 24px;
}

.header-left h1 {
  margin: 6px 0 0;
  font-size: 30px;
  line-height: 1.1;
}

.eyebrow {
  margin: 0;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  letter-spacing: 1.6px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item,
.search-panel,
.table-container {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
}

.stat-item {
  padding: 16px;
}

.stat-item span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-bottom: 8px;
}

.stat-item strong {
  font-size: 22px;
  color: var(--el-text-color-primary);
}

.search-panel,
.table-container {
  padding: 20px;
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 0;
}

.range-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-inline :deep(.el-input-number) {
  width: 118px;
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }
}
</style>
