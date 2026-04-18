<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-actions">
        <el-button :icon="Refresh" @click="getList">刷新数据</el-button>
      </div>
    </header>

    <section class="search-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="矿机ID">
          <el-input v-model="queryParams.minerId" placeholder="M001..." clearable @keyup.enter="handleSearch" />
        </el-form-item>

        <el-form-item label="矿机类型">
          <el-select v-model="queryParams.minerType" placeholder="全部" clearable style="width: 120px">
            <el-option label="小型" value="0" />
            <el-option label="中型" value="1" />
            <el-option label="大型" value="2" />
            <el-option label="特殊" value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="矿机状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待激活" :value="0" />
            <el-option label="运行中" :value="1" />
            <el-option label="已过期" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="是否缴电费">
          <el-select v-model="queryParams.isElectricityPaid" placeholder="全部" clearable style="width: 120px">
            <el-option label="已缴电费" :value="1" />
            <el-option label="未缴电费" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="到期状态">
          <el-select v-model="queryParams.expiryStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="已到期" :value="1" />
            <el-option label="正常" :value="2" />
            <el-option label="即将到期" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="userId" label="用户ID" width="100" align="center" />

        <el-table-column label="矿机信息" min-width="220">
          <template #default="{ row }">
            <div class="miner-info">
              <el-tag size="small" effect="dark" :type="getMinerTypeTag(row.minerType)">
                {{ getMinerTypeName(row.minerType) }}
              </el-tag>
              <span class="miner-id">{{ row.minerId || '-' }}</span>
            </div>
            <div class="wallet-addr">{{ row.walletAddress || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="兑换卡牌" min-width="170">
          <template #default="{ row }">
            <div v-if="row.nftCardId">
              <el-tag size="small" :type="getCardTypeTag(row.nftCardId)">
                {{ getCardTypeName(row.nftCardId) }}
              </el-tag>
              <div class="sub-label">卡牌ID: {{ row.nftCardId }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="卡牌销毁状态" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getBurnStatusTag(row.nftBurnStatus)" effect="plain">
              {{ getBurnStatusName(row.nftBurnStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="矿机状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" effect="dark">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="电费状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isElectricityPaid === 1 ? 'success' : 'danger'" effect="plain">
              {{ row.isElectricityPaid === 1 ? '已缴电费' : '未缴电费' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="到期状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getExpiryTag(row)" effect="plain">
              {{ getExpiryStatusName(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="paymentDate" label="最近缴费时间" width="170" />
        <el-table-column prop="lastRewardTime" label="最近收益时间" width="170" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getMinerList } from '../../api/miner'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])

const createDefaultQueryParams = () => ({
  page: 1,
  size: 10,
  minerId: '',
  minerType: '',
  status: null,
  isElectricityPaid: null,
  expiryStatus: null,
  startTime: '',
  endTime: ''
})

const queryParams = reactive(createDefaultQueryParams())

const getList = async () => {
  loading.value = true
  try {
    if (dateRange.value?.length === 2) {
      queryParams.startTime = dateRange.value[0]
      queryParams.endTime = dateRange.value[1]
    } else {
      queryParams.startTime = ''
      queryParams.endTime = ''
    }

    const res = await getMinerList(queryParams)
    const result = typeof res === 'string' ? JSON.parse(res) : res

    if (result.code === 200) {
      tableData.value = result.data?.records || []
      total.value = result.data?.total || 0
      return
    }

    ElMessage.error(result.message || '获取矿机列表失败')
  } catch (error) {
    console.error('Fetch error:', error)
    ElMessage.error('网络请求异常')
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
  Object.assign(queryParams, createDefaultQueryParams())
  getList()
}

const getMinerTypeName = (type) => {
  const maps = { '0': '小型', '1': '中型', '2': '大型', '3': '特殊' }
  return maps[String(type)] || '未知'
}

const getMinerTypeTag = (type) => {
  const maps = { '0': '', '1': 'success', '2': 'warning', '3': 'danger' }
  return maps[String(type)] || 'info'
}

const getCardTypeName = (id) => {
  const maps = { 1: '铜卡', 2: '银卡', 3: '金卡' }
  return maps[Number(id)] || '未知卡牌'
}

const getCardTypeTag = (id) => {
  const maps = { 1: 'info', 2: '', 3: 'warning' }
  return maps[Number(id)] || 'info'
}

const getBurnStatusName = (status) => {
  const maps = { 0: '销毁处理中', 1: '已销毁' }
  return maps[Number(status)] || '未知'
}

const getBurnStatusTag = (status) => {
  const maps = { 0: 'warning', 1: 'success' }
  return maps[Number(status)] || 'info'
}

const getStatusName = (status) => {
  const maps = { 0: '待激活', 1: '运行中', 2: '已过期' }
  return maps[Number(status)] || '未知'
}

const getStatusTag = (status) => {
  const maps = { 0: 'warning', 1: 'success', 2: 'danger' }
  return maps[Number(status)] || 'info'
}

const getExpiryStatusName = (row) => {
  const status = Number(row.status)
  if (status === 0) return '不适用'
  if (status === 2) return '已到期'
  if (status !== 1 || !row.paymentDate) return '-'

  const paymentTime = new Date(row.paymentDate).getTime()
  if (Number.isNaN(paymentTime)) return '-'

  const now = Date.now()
  const expiredBoundary = now - 30 * 24 * 60 * 60 * 1000
  const soonBoundary = now - 25 * 24 * 60 * 60 * 1000

  if (paymentTime < expiredBoundary) return '已到期'
  if (paymentTime <= soonBoundary) return '即将到期'
  return '正常'
}

const getExpiryTag = (row) => {
  const status = getExpiryStatusName(row)
  const maps = {
    已到期: 'danger',
    即将到期: 'warning',
    正常: 'success',
    不适用: 'info',
    '-': 'info'
  }
  return maps[status] || 'info'
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.page-container {
  animation: fadeIn 0.4s ease-out;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.search-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.02);
}

.table-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 20px;
}

.miner-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.miner-id {
  font-weight: bold;
  color: var(--el-color-primary);
}

.wallet-addr {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
  word-break: break-all;
}

.sub-label {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .search-card .el-form-item {
    width: 100%;
    margin-right: 0;
  }
}
</style>
