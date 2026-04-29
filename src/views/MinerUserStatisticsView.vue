<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh, Search } from '@element-plus/icons-vue'
import { getMinerUserStatistics } from '../api/miner.js'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])

const createDefaultQuery = () => ({
  page: 1,
  size: 10,
  walletAddress: '',
  userGrade: null,
  startTime: '',
  endTime: ''
})

const queryParams = reactive(createDefaultQuery())

const parseResponse = (res) => (typeof res === 'string' ? JSON.parse(res) : res)

const formatLevel = (value) => {
  if (value === undefined || value === null || value === '') return '-'
  return `V${value}`
}

const formatAmount = (value) => {
  if (value === undefined || value === null || value === '') return '0'
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return value
  return numberValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  })
}

const syncDateRange = () => {
  queryParams.startTime = dateRange.value?.[0] || ''
  queryParams.endTime = dateRange.value?.[1] || ''
}

const fetchList = async () => {
  loading.value = true
  try {
    syncDateRange()
    const result = parseResponse(await getMinerUserStatistics({ ...queryParams }))
    if (result.code === 200) {
      tableData.value = result.data?.records || []
      total.value = result.data?.total || 0
      return
    }

    ElMessage.error(result.msg || result.message || '查询用户矿机统计失败')
  } catch (error) {
    console.error(error)
    ElMessage.error(error.message || '查询用户矿机统计失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchList()
}

const resetQuery = () => {
  Object.assign(queryParams, createDefaultQuery())
  dateRange.value = []
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">MINER USER STATISTICS</p>
        <h1>用户矿机统计</h1>
      </div>
      <el-button @click="$router.push('/')" :icon="ArrowLeft">返回首页</el-button>
    </header>

    <section class="search-panel">
      <el-form :model="queryParams" inline class="filter-form">
        <el-form-item label="钱包地址">
          <el-input v-model="queryParams.walletAddress" placeholder="支持模糊查询" clearable style="width: 220px" />
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
        <el-form-item label="统计时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="userId" label="用户ID" width="100" align="center" />
        <el-table-column prop="walletAddress" label="用户地址" min-width="240" show-overflow-tooltip />
        <el-table-column prop="purchasedCount" label="已购矿机" width="120" align="center" />
        <el-table-column prop="activeCount" label="激活/电费矿机" width="140" align="center" />
        <el-table-column prop="userGrade" label="矿机等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="success" effect="plain">{{ formatLevel(row.userGrade) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已分成金额" width="160" align="right">
          <template #default="{ row }">{{ formatAmount(row.performanceDistributedAmount) }}</template>
        </el-table-column>
      </el-table>

      <div class="pagination-box">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
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

.search-panel,
.table-container {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 0;
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
</style>
