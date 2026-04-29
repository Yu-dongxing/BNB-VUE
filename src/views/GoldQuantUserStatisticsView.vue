<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Money, Refresh, Search } from '@element-plus/icons-vue'
import { getGoldQuantUserStatistics } from '../api/card.js'
import { depositUserAmount } from '../api/user.js'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])
const performanceFormRef = ref(null)

const transactionTypeOptions = [
  { label: '黄金量化奖励分成', value: 'GOLD_QUANT_REWARD' },
  { label: '黄金量化分销分成', value: 'GOLD_QUANT_DISTRIBUTION' }
]

const createDefaultQuery = () => ({
  page: 1,
  size: 10,
  walletAddress: '',
  rewardLevel: null,
  distributionLevel: null,
  startTime: '',
  endTime: ''
})

const queryParams = reactive(createDefaultQuery())

const performanceDialog = reactive({
  visible: false,
  loading: false,
  walletAddress: '',
  form: {
    userId: null,
    amount: '',
    transactionType: 'GOLD_QUANT_REWARD',
    source: '黄金量化奖励分成'
  }
})

const parseResponse = (res) => (typeof res === 'string' ? JSON.parse(res) : res)

const getResultMessage = (result, fallback) => result?.msg || result?.message || fallback

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

const performanceRules = {
  userId: [{ required: true, message: '用户 ID 不能为空', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入下发金额', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        const amount = String(value ?? '').trim()
        const numberAmount = Number(amount)
        if (!amount || Number.isNaN(numberAmount) || numberAmount <= 0) {
          callback(new Error('下发金额必须大于 0'))
          return
        }

        callback()
      },
      trigger: 'blur'
    }
  ],
  transactionType: [{ required: true, message: '请选择交易类型', trigger: 'change' }],
  source: [{ required: true, message: '请输入资金备注', trigger: 'blur' }]
}

const syncDateRange = () => {
  queryParams.startTime = dateRange.value?.[0] || ''
  queryParams.endTime = dateRange.value?.[1] || ''
}

const fetchList = async () => {
  loading.value = true
  try {
    syncDateRange()
    const result = parseResponse(await getGoldQuantUserStatistics({ ...queryParams }))
    if (result.code === 200) {
      tableData.value = result.data?.records || []
      total.value = result.data?.total || 0
      return
    }

    ElMessage.error(result.msg || result.message || '查询量化用户窗口统计失败')
  } catch (error) {
    console.error(error)
    ElMessage.error(error.message || '查询量化用户窗口统计失败')
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

const syncDefaultSource = () => {
  const selected = transactionTypeOptions.find((item) => item.value === performanceDialog.form.transactionType)
  performanceDialog.form.source = selected?.label || ''
}

const openPerformanceDialog = (row) => {
  performanceDialog.walletAddress = row.walletAddress || '-'
  performanceDialog.form.userId = row.userId
  performanceDialog.form.amount = ''
  performanceDialog.form.transactionType = 'GOLD_QUANT_REWARD'
  syncDefaultSource()
  performanceDialog.visible = true
  nextTick(() => {
    performanceFormRef.value?.clearValidate()
  })
}

const submitPerformance = async () => {
  if (!performanceFormRef.value) return

  await performanceFormRef.value.validate(async (valid) => {
    if (!valid) return

    performanceDialog.loading = true
    try {
      const result = parseResponse(await depositUserAmount({
        userId: performanceDialog.form.userId,
        amount: String(performanceDialog.form.amount).trim(),
        transactionType: performanceDialog.form.transactionType,
        source: performanceDialog.form.source.trim()
      }))

      if (result.code === 200) {
        ElMessage.success(getResultMessage(result, '下发业绩成功'))
        performanceDialog.visible = false
        fetchList()
        return
      }

      ElMessage.error(getResultMessage(result, '下发业绩失败'))
    } catch (error) {
      console.error(error)
      ElMessage.error(error.message || '下发业绩失败')
    } finally {
      performanceDialog.loading = false
    }
  })
}

onMounted(fetchList)
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">GOLD QUANT USER STATISTICS</p>
        <h1>量化收益窗口统计</h1>
      </div>
      <el-button @click="$router.push('/')" :icon="ArrowLeft">返回首页</el-button>
    </header>

    <section class="search-panel">
      <el-form :model="queryParams" inline class="filter-form">
        <el-form-item label="钱包地址">
          <el-input v-model="queryParams.walletAddress" placeholder="支持模糊查询" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="奖励等级">
          <el-input-number
            v-model="queryParams.rewardLevel"
            :min="0"
            :precision="0"
            placeholder="等级"
            clearable
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item label="分销等级">
          <el-input-number
            v-model="queryParams.distributionLevel"
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
      <el-table :data="tableData" v-loading="loading"  stripe>
        <el-table-column prop="userId" label="用户ID" width="100" align="center" />
        <el-table-column prop="walletAddress" label="用户地址" min-width="240" show-overflow-tooltip />
        <el-table-column prop="purchasedCount" label="已购/缴费" width="120" align="center" />
        <el-table-column prop="activeCount" label="激活/窗口费" width="120" align="center" />
        <el-table-column prop="windowCount" label="当前窗口" width="120" align="center" />
        <el-table-column prop="rewardLevel" label="奖励等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="success" effect="plain">{{ formatLevel(row.rewardLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="distributionLevel" label="分销等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ formatLevel(row.distributionLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="奖励分成总金额"  align="right">
          <template #default="{ row }">{{ formatAmount(row.rewardDistributedAmount) }}</template>
        </el-table-column>
        <el-table-column label="分销分成总金额" align="right">
          <template #default="{ row }">{{ formatAmount(row.distributionDistributedAmount) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template #default="{ row }">
            <el-button link type="success" :icon="Money" @click="openPerformanceDialog(row)">
              下发业绩
            </el-button>
          </template>
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

    <el-dialog v-model="performanceDialog.visible" title="下发业绩" width="520px" append-to-body>
      <el-form
        ref="performanceFormRef"
        :model="performanceDialog.form"
        :rules="performanceRules"
        label-width="100px"
      >
        <el-form-item label="目标用户">
          <el-input :value="`${performanceDialog.walletAddress}（ID：${performanceDialog.form.userId || '-'}）`" disabled />
        </el-form-item>
        <el-form-item label="交易类型" prop="transactionType">
          <el-select
            v-model="performanceDialog.form.transactionType"
            placeholder="请选择交易类型"
            style="width: 100%"
            @change="syncDefaultSource"
          >
            <el-option
              v-for="item in transactionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下发金额" prop="amount">
          <el-input
            v-model="performanceDialog.form.amount"
            placeholder="请输入金额，例如：100.00"
          />
        </el-form-item>
        <el-form-item label="资金备注" prop="source">
          <el-input
            v-model="performanceDialog.form.source"
            maxlength="60"
            show-word-limit
            placeholder="例如：黄金量化奖励分成"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="performanceDialog.visible = false">取消</el-button>
        <el-button type="success" :loading="performanceDialog.loading" @click="submitPerformance">确认下发</el-button>
      </template>
    </el-dialog>
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
