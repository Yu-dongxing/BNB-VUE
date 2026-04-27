<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Search, Refresh, ArrowLeft, View, 
  Money, Wallet, ShoppingCart, Tickets 
} from '@element-plus/icons-vue'
import { getAdminBillList, getBillStatistics , KF } from "../api/bill.js"

// --- 1. 映射常量 ---
const billTypeOptions = [
  { label: '平台资金流水', value: 'PLATFORM' },
  { label: '链上资金流水', value: 'ON_CHAIN' },
  { label: '异常账单', value: 'ERROR_ORDER' },
  { label: '碎片流水', value: 'FRAGMENT' }
]

/**
 * 智能格式化金额
 * 判断标准：
 * 1. 如果数值包含科学计数法 (e+)，或者长度超过 15 位且是整数，则进行 fromWei (除以 10^18) 转换。
 * 2. 如果数值已经是正常范围的小数或较小的整数，则只做千分位格式化。
 */
const smartFormatAmount = (val, decimals = 18) => {
  if (val === undefined || val === null || val === '') return '0.00';

  // 将输入转换为字符串，处理科学计数法
  let strVal = val.toString();
  
  // 检查是否包含科学计数法
  const isSci = strVal.includes('e') || strVal.includes('E');
  
  // 获取整数部分的长度 (排除负号)
  const integerPart = strVal.split('.')[0].replace('-', '');
  
  // 判断条件：
  // 1. 包含 e+ 科学计数法
  // 2. 或者 整数部分长度超过 12 位 (例如超过 10000 亿)
  const needConversion = isSci || integerPart.length > 12;

  if (needConversion) {
    try {
      // --- 执行 fromWei 转换逻辑 ---
      
      // 1. 先把科学计数法转为纯数字字符串
      let bigNumStr = BigInt(Number(val).toLocaleString('fullwide', { useGrouping: false })).toString();
      
      // 2. 补位并插入小数点
      while (bigNumStr.length <= decimals) bigNumStr = '0' + bigNumStr;
      const pos = bigNumStr.length - decimals;
      const intStr = bigNumStr.substring(0, pos) || '0';
      const decStr = bigNumStr.substring(pos);
      
      // 3. 组合并转为浮点数，进行千分位美化
      const finalNum = parseFloat(intStr + '.' + decStr);
      return finalNum.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 6 
      });
    } catch (e) {
      console.error("转换失败:", e);
      return strVal; // 转换出错则返回原值
    }
  } else {
    // --- 普通数值格式化 ---
    const num = parseFloat(val);
    if (isNaN(num)) return strVal;
    
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  }
}
// 2. 安全解析 JSON 并美化显示
const formatJson = (jsonStr) => {
  if (!jsonStr) return '无数据';
  try {
    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    return JSON.stringify(obj, null, 2); // 缩进2个空格
  } catch (e) {
    return jsonStr;
  }
}
const cardIdMap = {
  1: { label: '铜卡', type: 'info' },
  2: { label: '银卡', type: '' },
  3: { label: '金卡', type: 'warning' }
}

const getCardLabel = (id) => cardIdMap[id]?.label || '非卡牌交易'

const fundTypeOptions = [
  { label: '入账', value: 'INCOME' },
  { label: '出账', value: 'EXPENSE' }
]

const statusOptions = [
  { label: '处理中', value: 'PENDING' },
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' }
]


const statusOptionsTable = [
  { label: '处理中', value: '0' },
  { label: '成功', value: '1' },
  { label: '失败', value: '2' }
]

/**
 *     GOLD_QUANT("GOLD_QUANT", "黄金量化"),
    GOLD_QUANT_REWARD("GOLD_QUANT_REWARD", "黄金量化奖励分成"),
    GOLD_QUANT_DISTRIBUTION("GOLD_QUANT_DISTRIBUTION", "黄金量化分销分成");

 */
const transTypeOptions = [
  { label: '购买', value: 'PURCHASE' },
  { label: '卖出', value: 'SELL' },
  { label: '充值', value: 'DEPOSIT' },
  { label: '提现', value: 'WITHDRAWAL' },
  { label: '闪兑', value: 'EXCHANGE' },
  { label: '奖励', value: 'REWARD' },
  { label: '收益', value: 'PROFIT' },
  { label: '转账', value: 'TRANSFER' },
  { label: '黄金量化奖励分成', value: 'GOLD_QUANT_REWARD' },
  { label: '黄金量化分销分成', value: 'GOLD_QUANT_DISTRIBUTION' },
  { label: '黄金量化', value: 'GOLD_QUANT' },
]

// --- 2. 响应式数据 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])

// 统计数据 (增加了 NFT 相关字段)
const stats = reactive({
  totalUserBalance: 0,
  totalPlatformDeposit: 0,
  totalNftPurchaseAmount: 0, // 总购买卡牌金额
  totalNftSalesCount: 0      // 总购买卡牌数量
})

const queryParams = reactive({
  page: 1,
  size: 10,
  userWalletAddress: '',
  billType: '',
  fundType: '',
  transactionType: '',
  status: '',
  startDate: '',
  endDate: ''
})

const detailVisible = ref(false)
const currentDetail = ref({})

// --- 3. 逻辑方法 ---

const fetchStats = async () => {
  try {
    const res = await getBillStatistics()
    const result = typeof res === 'string' ? JSON.parse(res) : res
    if (result.code === 200) {
      stats.totalUserBalance = result.data.totalUserBalance
      stats.totalPlatformDeposit = result.data.totalPlatformDeposit
      stats.totalNftPurchaseAmount = result.data.totalNftPurchaseAmount
      stats.totalNftSalesCount = result.data.totalNftSalesCount
    }
  } catch (error) {
    console.error("加载统计失败", error)
  }
}
/**
 * 人工核销账单
 */
const handleKF = async (billId) => {
  try {
    const res = await KF(billId)
    const result = typeof res === 'string' ? JSON.parse(res) : res
    if (result.code === 200) {
      ElMessage.success('账单核销成功')
      getList()
      fetchStats()
    } else {
      ElMessage.error(result.message || '核销失败')
    }
  } catch (error) {
    console.error("账单核销失败", error)
    ElMessage.error('核销请求出错：', error.message || error)
  }
}

const getList = async () => {
  loading.value = true
  try {
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.startDate = dateRange.value[0]
      queryParams.endDate = dateRange.value[1]
    } else {
      queryParams.startDate = ''; queryParams.endDate = ''
    }
    const res = await getAdminBillList(queryParams)
    const result = typeof res === 'string' ? JSON.parse(res) : res
    if (result.code === 200) {
      tableData.value = result.data.records
      total.value = result.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  getList()
  fetchStats()
}

const resetQuery = () => {
  dateRange.value = []
  Object.keys(queryParams).forEach(key => {
    if (key === 'page') queryParams[key] = 1
    else if (key === 'size') queryParams[key] = 10
    else queryParams[key] = ''
  })
  handleSearch()
}

const getLabel = (options, value) => options.find(opt => opt.value === value)?.label || value

const getStatusType = (status) => {
  if (status === '1' || status === 'SUCCESS') return 'success'
  if (status === '2' || status === 'FAILED') return 'danger'
  return 'warning'
}

const handleView = (row) => {
  currentDetail.value = { ...row }
  detailVisible.value = true
}

onMounted(() => {
  fetchStats()
  getList()
})
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">流水账单列表</p>
      </div>
      <el-button @click="$router.push('/')" :icon="ArrowLeft">返回首页</el-button>
    </header>

    <!-- 1. 资金统计卡片 (调整为 4 列布局) -->
    <el-row :gutter="15" class="stats-row">
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stats-card blue">
          <div class="stats-icon"><el-icon><Wallet /></el-icon></div>
          <div class="stats-content">
            <span class="label">用户总余额</span>
            <div class="value">{{ stats.totalUserBalance?.toLocaleString() }} <small>USDT</small></div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stats-card green">
          <div class="stats-icon"><el-icon><Money /></el-icon></div>
          <div class="stats-content">
            <span class="label">累计充值总额</span>
            <div class="value">{{ stats.totalPlatformDeposit?.toLocaleString() }} <small>USDT</small></div>
          </div>
        </div>
      </el-col>

      <!-- 新增：总购买卡牌金额 -->
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stats-card purple">
          <div class="stats-icon"><el-icon><ShoppingCart /></el-icon></div>
          <div class="stats-content">
            <span class="label">总购买卡牌金额</span>
            <div class="value">{{ stats.totalNftPurchaseAmount?.toLocaleString() }} <small>USDT</small></div>
          </div>
        </div>
      </el-col>

      <!-- 新增：总购买卡牌数量 -->
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stats-card orange">
          <div class="stats-icon"><el-icon><Tickets /></el-icon></div>
          <div class="stats-content">
            <span class="label">总成交卡牌数量</span>
            <div class="value">{{ stats.totalNftSalesCount?.toLocaleString() }} <small>张</small></div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 2. 筛选面板 -->
    <section class="search-panel">
      <el-form :model="queryParams" inline class="filter-form">
        <div class="filter-row">
          <el-form-item label="钱包地址">
            <el-input v-model="queryParams.userWalletAddress" placeholder="搜索地址" clearable style="width: 180px" />
          </el-form-item>
          <el-form-item label="账单类型">
            <el-select v-model="queryParams.billType" placeholder="全部" clearable style="width: 130px">
              <el-option v-for="i in billTypeOptions" :key="i.value" :label="i.label" :value="i.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="业务类型">
            <el-select v-model="queryParams.transactionType" placeholder="全部" clearable style="width: 130px">
              <el-option v-for="i in transTypeOptions" :key="i.value" :label="i.label" :value="i.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="方向">
            <el-radio-group v-model="queryParams.fundType" @change="handleSearch">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="INCOME">入账</el-radio-button>
              <el-radio-button label="EXPENSE">出账</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>
        <div class="filter-row">
          <el-form-item label="交易状态">
            <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
              <el-option v-for="i in statusOptions" :key="i.value" :label="i.label" :value="i.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" style="width: 250px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </div>
      </el-form>
    </section>

    <!-- 3. 表格 -->
    <section class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="userWalletAddress" label="用户钱包" min-width="180" show-overflow-tooltip />
        <el-table-column label="账单类型" width="120">
          <template #default="scope"><el-tag effect="plain" size="small">{{ getLabel(billTypeOptions, scope.row.billType) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="业务类型" width="90">
          <template #default="scope">{{ getLabel(transTypeOptions, scope.row.transactionType) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="140" align="right">
          <template #default="scope">
            <span :class="scope.row.fundType === 'INCOME' ? 'income' : 'expense'">
              {{ scope.row.fundType === 'INCOME' ? '+' : '-' }} {{ smartFormatAmount(scope.row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope"><el-tag :type="getStatusType(scope.row.status)" size="small">{{ getLabel(statusOptionsTable, scope.row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createTime" label="交易时间" width="170" />
        <el-table-column label="详情"  fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" :icon="View" @click="handleView(scope.row)">详情</el-button>
           <el-button link type="warning" @click="handleKF(scope.row.id)" v-if="scope.row.errStatus === 4001">人工核销</el-button>
          </template>
        </el-table-column>
        <!-- <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="scope">
             <el-button link type="warning" @click="handleKF(scope.row.id)" v-if="scope.row.errStatus === 2002">人工核销</el-button>
          </template>
        </el-table-column> -->
      </el-table>
      <div class="pagination-box">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.size" :total="total" layout="total, prev, pager, next" @current-change="getList" />
      </div>
    </section>

    <!-- 详情弹窗 -->
    <!-- 详情弹窗 -->
<el-dialog v-model="detailVisible" title="账单详细数据" width="700px" destroy-on-close>
  <!-- 统一设置 label 的宽度，防止左右错位 -->
  <el-descriptions :column="1" border label-class-name="detail-label">
    
    <el-descriptions-item label="账单 ID">{{ currentDetail.id }}</el-descriptions-item>
    
    <el-descriptions-item label="系统订单号">
      <div class="code-wrapper">{{ currentDetail.transactionOrderId || '无' }}</div>
    </el-descriptions-item>

    <el-descriptions-item label="钱包地址">
      <div class="code-wrapper">{{ currentDetail.userWalletAddress }}</div>
    </el-descriptions-item>
    
    <el-descriptions-item label="区块链 TxHash">
      <div class="code-wrapper highlight">{{ currentDetail.txId || '未上链' }}</div>
    </el-descriptions-item>

    <el-descriptions-item label="账单分类">
      <el-tag size="small">{{ getLabel(billTypeOptions, currentDetail.billType) }}</el-tag>
    </el-descriptions-item>

    <el-descriptions-item label="变动金额">
      <span :class="currentDetail.fundType === 'INCOME' ? 'income' : 'expense'" class="amount-text">
        {{ currentDetail.fundType === 'INCOME' ? '+' : '-' }} {{ smartFormatAmount(currentDetail.amount) }} USDT
      </span>
    </el-descriptions-item>

    <el-descriptions-item label="交易前余额">{{ smartFormatAmount(currentDetail.balanceBefore) }} USDT</el-descriptions-item>

    <el-descriptions-item label="当前碎片余额">{{ currentDetail.fragmentNum || 0 }} 个</el-descriptions-item>

    <el-descriptions-item label="业务成交时间">{{ currentDetail.transactionTime || currentDetail.createTime }}</el-descriptions-item>
    <el-descriptions-item label="账单备注">{{ currentDetail.remark || '无' }}</el-descriptions-item>
    <!-- <el-descriptions-item label="链上原始响应">
      <el-collapse>
        <el-collapse-item title="点击查看 JSON 详细回执" name="1">
          <pre class="json-box">{{ formatJson(currentDetail.chainResponse) }}</pre>
        </el-collapse-item>
      </el-collapse>
    </el-descriptions-item> -->
  </el-descriptions>
</el-dialog>
  </div>
</template>

<style scoped>
/* 1. 强制 Label 宽度一致，解决左右对齐错乱 */
:deep(.detail-label) {
  width: 120px !important;
  background-color: #f5f7fa !important;
  font-weight: bold;
}

/* 2. 核心：防止长字符串（TxHash/订单号）撑开容器 */
.code-wrapper {
  word-break: break-all;      /* 强制任意字符换行 */
  white-space: pre-wrap;     /* 保留空格并换行 */
  font-family: monospace;
  background: #f8f9fb;
  padding: 4px 8px;
  border-radius: 4px;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
}

.code-wrapper.highlight {
  color: #409eff;
}

/* 3. 金额大数字处理 */
.amount-text {
  font-size: 16px;
  font-weight: bold;
  font-family: 'DIN Alternate', sans-serif; /* 如果有这种字体的话 */
}

/* 4. JSON 盒子美化 */
.json-box {
  background: #282c34;
  color: #abb2bf;
  padding: 15px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  overflow: auto;
  max-height: 300px;
  margin: 0;
}

.income { color: #67C23A; }
.expense { color: #F56C6C; }
/* 代码类文本样式 */
.code-text {
  font-family: 'Courier New', Courier, monospace;
  background: #f4f4f5;
  padding: 2px 4px;
  border-radius: 4px;
  color: #606266;
  word-break: break-all; /* 强制长字符串（如 TxHash）换行 */
}

/* JSON 展示盒 */
.json-box {
  background: #2d2d2d;
  color: #ccc;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 调整 Dialog 内部间距 */
:deep(.el-descriptions__label) {
  width: 120px;
  justify-content: flex-end;
  background: #fafafa !important;
}

:deep(.el-collapse-item__header) {
  height: 32px;
  color: #409eff;
}
.stats-row { margin-bottom: 20px; }
.stats-card {
  background: var(--el-bg-color);
  padding: 20px; border-radius: 12px; display: flex; align-items: center;
  border: 1px solid var(--el-border-color-light);
}
.stats-icon {
  width: 48px; height: 48px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; margin-right: 16px;
}
/* 颜色适配变量 */
.blue .stats-icon { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.green .stats-icon { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.purple .stats-icon { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.orange .stats-icon { background: var(--el-color-danger-light-9); color: var(--el-color-danger); }

.search-panel { background: var(--el-bg-color); padding: 20px; border-radius: 12px; border: 1px solid var(--el-border-color-light); margin-bottom: 20px; }
.table-container { background: var(--el-bg-color); padding: 20px; border-radius: 12px; border: 1px solid var(--el-border-color-light); }
.income { color: var(--el-color-success); font-weight: bold; }
.expense { color: var(--el-color-danger); font-weight: bold; }
</style>