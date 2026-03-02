<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Refresh, ArrowLeft, Cpu, Collection, 
  Wallet, SetUp, Key, Share 
} from '@element-plus/icons-vue'
import { getContractMeta, updateTreasury ,setMinAmount } from "../api/contract.js"

// --- 数据定义 ---
const loading = ref(false)
const updateLoading = ref(false)
const meta = ref({
  contractAddress: '',
  usdtAddress: '',
  adminAddress: '',
  executorAddress: '',
  treasuryAddress: '',
  minAmount: 0
})

const minAmountLoading = ref(false)

// 表单数据增加 minAmount
const form = reactive({
  newTreasury: '',
  newMinAmount: 10 // 默认给个值
})

// 设置最小扣款金额逻辑
const handleSetMinAmount = async () => {
  if (form.newMinAmount <= 0) {
    return ElMessage.warning("金额必须大于 0")
  }

  ElMessageBox.confirm(
    `确认将最小扣款额度修改为 ${form.newMinAmount}？\n注意：这会影响后续所有的合约代扣验证。`,
    '系统提示',
    { confirmButtonText: '确定', type: 'warning' }
  ).then(async () => {
    minAmountLoading.value = true
    try {
      const res = await setMinAmount(form.newMinAmount)
      const result = typeof res === 'string' ? JSON.parse(res) : res
      if (result.code === 200) {
        ElMessage.success('修改成功')
        await fetchMeta() // 刷新基础信息显示
      }
    } finally {
      minAmountLoading.value = false
    }
  })
}

// --- 逻辑方法 ---

// 获取/刷新数据
const fetchMeta = async () => {
  loading.value = true
  try {
    const res = await getContractMeta()
    const result = typeof res === 'string' ? JSON.parse(res) : res
    if (result.code === 200) {
      meta.value = result.data
      ElMessage.success({ message: '配置已同步', duration: 1000 })
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 设置收款地址
const handleSetTreasury = async () => {
  if (!form.newTreasury || form.newTreasury.length < 40) {
    return ElMessage.warning("请输入有效的钱包地址")
  }

  ElMessageBox.confirm(
    `确认将收款地址修改为：${form.newTreasury}？这涉及链上操作，请务必核对。`,
    '安全警告',
    { confirmButtonText: '确定修改', type: 'warning' }
  ).then(async () => {
    updateLoading.value = true
    try {
      const res = await updateTreasury(form.newTreasury)
      const result = typeof res === 'string' ? JSON.parse(res) : res
      if (result.code === 200) {
        ElMessage.success("收款地址设置指令已发送至链上")
        form.newTreasury = '' // 清空表单
        await fetchMeta() // 重新查询刷新界面
      }
    } finally {
      updateLoading.value = false
    }
  })
}

onMounted(() => {
  fetchMeta()
})
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">链上合约设置</p>
      </div>
      <div class="header-actions">
        <el-button @click="$router.push('/')" :icon="ArrowLeft">返回首页</el-button>
        <el-button type="primary" :icon="Refresh" @click="fetchMeta" :loading="loading">
          刷新配置
        </el-button>
      </div>
    </header>

    <el-row :gutter="20">
      <!-- 左侧：合约基础信息展示 -->
      <el-col :span="16">
        <div class="config-card">
          <div class="card-head">
            <el-icon><Cpu /></el-icon>
            <span>PaymentUSDT 合约信息</span>
          </div>
          
          <el-descriptions :column="1" border class="meta-descriptions">
            <el-descriptions-item>
              <template #label><el-icon><Share /></el-icon> 合约地址</template>
              <code class="addr-code">{{ meta.contractAddress }}</code>
            </el-descriptions-item>
            
            <el-descriptions-item>
              <template #label><el-icon><Collection /></el-icon> USDT 合约地址</template>
              <code class="addr-code">{{ meta.usdtAddress }}</code>
            </el-descriptions-item>

            <el-descriptions-item>
              <template #label><el-icon><Key /></el-icon> 管理员 (Admin)</template>
              <code class="addr-code">{{ meta.adminAddress }}</code>
            </el-descriptions-item>

            <el-descriptions-item>
              <template #label><el-icon><SetUp /></el-icon> 执行者 (Executor)</template>
              <code class="addr-code">{{ meta.executorAddress }}</code>
            </el-descriptions-item>

            <el-descriptions-item>
              <template #label><el-icon><Wallet /></el-icon> 当前收款地址 (Treasury)</template>
              <code class="addr-code active-treasury">{{ meta.treasuryAddress }}</code>
            </el-descriptions-item>

            <el-descriptions-item>
              <template #label>最小扣款金额</template>
              <span class="amount-text">{{ meta.minAmount }} USDT</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>

      <!-- 右侧：操作区 -->
      <el-col :span="8" v-if="1 > 2">
        <div class="action-card">
          <div class="card-head">
            <span>修改收款地址</span>
          </div>
          <div class="card-body">
            <p class="notice-text">
              设置后，系统所有的入账资金将自动汇入此地址。请确保您拥有该地址的私钥。
            </p>
            <el-form label-position="top">
              <el-form-item label="新收款地址">
                <el-input 
                  v-model="form.newTreasury" 
                  placeholder="0x..." 
                  :prefix-icon="Wallet"
                  clearable
                />
              </el-form-item>
              <el-button 
                type="warning" 
                style="width: 100%; margin-top: 10px;" 
                @click="handleSetTreasury"
                :loading="updateLoading"
              >
                确认变更地址
              </el-button>
            </el-form>
          </div>
        </div>

         <div class="action-card mt-20">
          <div class="card-head">
            <el-icon><SetUp /></el-icon>
            <span>最小扣款额度设置</span>
          </div>
          <div class="card-body">
            <p class="notice-text">
              该值决定了系统允许发起的最低扣款金额。修改此值需消耗链上 Gas。
            </p>
            <el-form label-position="top">
              <el-form-item label="设置金额 (USDT单位)">
                <!-- 使用数字输入框确保输入合法 -->
                <el-input-number 
                  v-model="form.newMinAmount" 
                  :min="1" 
                  :precision="0"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
              <el-button 
                type="warning" 
                style="width: 100%; margin-top: 10px;" 
                @click="handleSetMinAmount"
                :loading="minAmountLoading"
              >
                更新最小额度
              </el-button>
            </el-form>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.config-card, .action-card {
  background: var(--el-bg-color); border-radius: 12px;
  border: 1px solid var(--el-border-color-light); margin-bottom: 20px;
}
.card-head {
  padding: 16px 20px; border-bottom: 1px solid var(--el-border-color-light);
  display: flex; align-items: center; gap: 10px; font-weight: bold;
}
.addr-code {
  font-family: monospace; background: var(--el-fill-color-light);
  padding: 4px 8px; border-radius: 4px; color: var(--el-color-primary); word-break: break-all;
}
.notice-text { font-size: 13px; color: var(--el-text-color-secondary); margin-bottom: 15px; }
</style>