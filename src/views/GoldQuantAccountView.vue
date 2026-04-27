<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh, Search } from '@element-plus/icons-vue'
import { getGoldQuantAccountList } from '../api/card.js'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const createDateRange = ref([])
const expireDateRange = ref([])

const queryParams = reactive({
  page: 1,
  size: 10,
  userId: null,
  walletAddress: '',
  expireStartTime: '',
  expireEndTime: '',
  startTime: '',
  endTime: ''
})

const parseResponse = (res) => (typeof res === 'string' ? JSON.parse(res) : res)

const syncDateRange = () => {
  queryParams.expireStartTime = expireDateRange.value?.[0] || ''
  queryParams.expireEndTime = expireDateRange.value?.[1] || ''
  queryParams.startTime = createDateRange.value?.[0] || ''
  queryParams.endTime = createDateRange.value?.[1] || ''
}

const fetchList = async () => {
  loading.value = true
  try {
    syncDateRange()
    const result = parseResponse(await getGoldQuantAccountList({ ...queryParams }))
    if (result.code === 200) {
      tableData.value = result.data?.records || []
      total.value = result.data?.total || 0
    } else {
      ElMessage.error(result.msg || result.message || '查询黄金量化托管费列表失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '查询黄金量化托管费列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchList()
}

const resetQuery = () => {
  Object.assign(queryParams, {
    page: 1,
    size: 10,
    userId: null,
    walletAddress: '',
    expireStartTime: '',
    expireEndTime: '',
    startTime: '',
    endTime: ''
  })
  createDateRange.value = []
  expireDateRange.value = []
  fetchList()
}

const formatEmpty = (value) => value || '-'

onMounted(fetchList)
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">GOLD QUANT HOSTING</p>
        <h1>黄金量化托管费记录</h1>
      </div>
      <el-button @click="$router.push('/')" :icon="ArrowLeft">返回首页</el-button>
    </header>

    <section class="search-panel">
      <el-form :model="queryParams" inline class="filter-form">
        <el-form-item label="用户ID">
          <el-input-number v-model="queryParams.userId" :min="1" :precision="0" placeholder="精确筛选" clearable />
        </el-form-item>
        <el-form-item label="钱包地址">
          <el-input v-model="queryParams.walletAddress" placeholder="支持模糊查询" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="托管费到期">
          <el-date-picker
            v-model="expireDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
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
        <el-table-column prop="userId" label="用户ID" width="110" align="center" />
        <el-table-column prop="walletAddress" label="钱包地址" min-width="220" show-overflow-tooltip />
        <el-table-column label="托管费到期时间" width="180">
          <template #default="{ row }">{{ formatEmpty(row.hostingExpireTime) }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
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
