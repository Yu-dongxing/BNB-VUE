<template>
  <div class="page-container">
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">资产监管</p>
        <h1 class="title">矿机管理</h1>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="getList">刷新数据</el-button>
      </div>
    </header>

    <!-- 搜索筛选栏 -->
    <section class="search-card">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="矿机ID">
          <el-input v-model="queryParams.minerId" placeholder="M001..." clearable @keyup.enter="handleSearch" />
        </el-form-item>

        <el-form-item label="钱包地址">
          <el-input
            v-model="queryParams.walletAddress"
            placeholder="请输入用户钱包地址"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="矿机类型">
          <el-select v-model="queryParams.minerType" placeholder="全部" clearable style="width: 120px">
            <el-option label="小型" value="0" />
            <el-option label="中型" value="1" />
            <el-option label="大型" value="2" />
            <el-option label="特殊" value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="运行状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待激活" :value="0" />
            <el-option label="运行中" :value="1" />
            <el-option label="已过期" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="电费缴纳">
          <el-select v-model="queryParams.isElectricityPaid" placeholder="全部" clearable style="width: 100px">
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="到期提醒">
          <el-select v-model="queryParams.expiryStatus" placeholder="筛选到期情况" clearable style="width: 150px">
            <el-option label="已到期" :value="1" />
            <el-option label="未到期" :value="2" />
            <el-option label="即将到期(≤5天)" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <!-- 数据表格 -->
    <section class="table-panel">
      <el-table 
        v-loading="loading" 
        :data="tableData" 
        border 
        stripe
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        
        <el-table-column label="矿机信息" min-width="180">
          <template #default="scope">
            <div class="miner-info">
              <el-tag size="small" effect="dark" :type="getMinerTypeTag(scope.row.minerType)">
                {{ getMinerTypeName(scope.row.minerType) }}
              </el-tag>
              <span class="miner-id">{{ scope.row.minerId }}</span>
            </div>
            <div class="wallet-addr">{{ scope.row.walletAddress }}</div>
          </template>
        </el-table-column>

        <el-table-column label="卡牌消耗" width="150">
          <template #default="scope">
            <div v-if="scope.row.nftCardId">
              <el-tag size="small" :type="getCardTypeTag(scope.row.nftCardId)">
                {{ getCardTypeName(scope.row.nftCardId) }}
              </el-tag>
              <div class="order-id">单号: {{ scope.row.nftBurnOrderId || '-' }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="运行状态" width="100" align="center">
          <template #default="scope">
            <el-badge is-dot :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ getStatusName(scope.row.status) }}
            </el-badge>
          </template>
        </el-table-column>

        <el-table-column label="加速状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isAccelerated === 1 ? 'warning' : 'info'" effect="plain">
              {{ scope.row.isAccelerated === 1 ? '已加速' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="电费/有效期" min-width="200">
          <template #default="scope">
            <div>
              电费：<el-tag size="small" :type="scope.row.isElectricityPaid === 1 ? 'success' : 'danger'">
                {{ scope.row.isElectricityPaid === 1 ? '已缴纳' : '未缴纳' }}
              </el-tag>
            </div>
            <div class="time-label">缴费日: {{ scope.row.paymentDate || '-' }}</div>
            <div class="time-label">收益起算: {{ scope.row.eligibleDate || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="购买时间" width="170" />

        <!-- <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handleDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column> -->
      </el-table>

      <!-- 分页器 -->
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
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getMinerList } from '../../api/miner'

// --- 数据定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])

// 查询参数 (对应 MinerQueryDTO)
const queryParams = reactive({
  page: 1,
  size: 10,
  minerId: '',
  walletAddress: '',
  minerType: '',
  status: null,
  isElectricityPaid: null,
  isAccelerated: null,
  expiryStatus: null,
  startTime: '',
  endTime: ''
})

// --- 逻辑方法 ---

const getList = async () => {
  loading.value = true
  try {
    // 处理日期范围映射到 startTime/endTime
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.startTime = dateRange.value[0]
      queryParams.endTime = dateRange.value[1]
    } else {
      queryParams.startTime = ''
      queryParams.endTime = ''
    }

    const res = await getMinerList(queryParams)
    // 根据ApiResponse结构解析
    const result = typeof res === 'string' ? JSON.parse(res) : res
    
    if (result.code === 200) {
      tableData.value = result.data.records
      total.value = result.data.total
    } else {
      ElMessage.error(result.message || '获取列表失败')
    }
  } catch (error) {
    console.error("Fetch error:", error)
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
  Object.assign(queryParams, {
    page: 1,
    size: 10,
    minerId: '',
    walletAddress: '',
    minerType: '',
    status: null,
    isElectricityPaid: null,
    isAccelerated: null,
    expiryStatus: null,
    startTime: '',
    endTime: ''
  })
  getList()
}

const handleDetail = (row) => {
  console.log("查看详情", row)
  ElMessage.info(`查看矿机 ${row.minerId} 的详细信息（功能开发中）`)
}

// --- 格式化辅助函数 ---

const getMinerTypeName = (type) => {
  const maps = { '0': '小型', '1': '中型', '2': '大型', '3': '特殊' }
  return maps[type] || '未知'
}

const getMinerTypeTag = (type) => {
  const maps = { '0': '', '1': 'success', '2': 'warning', '3': 'danger' }
  return maps[type] || 'info'
}

const getCardTypeName = (id) => {
  const maps = { 1: '铜卡 (Copper)', 2: '银卡 (Silver)', 3: '金卡 (Gold)' }
  return maps[id] || '未知'
}

const getCardTypeTag = (id) => {
  const maps = { 1: 'info', 2: '', 3: 'warning' }
  return maps[id] || ''
}

const getStatusName = (status) => {
  const maps = { 0: '待激活', 1: '运行中', 2: '已过期' }
  return maps[status] ?? '未知'
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

.eyebrow {
  text-transform: uppercase;
  color: #1d7f6e;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--el-text-color-primary);
  margin: 0;
}

.search-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.02);
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
}

.order-id {
  font-size: 11px;
  color: #a8abb2;
  margin-top: 4px;
}

.time-label {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-card .el-form-item {
    width: 100%;
    margin-right: 0;
  }
}
</style>
