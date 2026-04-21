<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">GLOBAL SYSTEM CONFIGURATION</p>
        <h1>系统全局配置</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="openModal()">新增配置项</el-button>
      </div>
    </header>

    <div class="filter-card animate-up">
      <el-input
        v-model="queryParams.configKey"
        placeholder="搜索配置键(Key)..."
        class="search-input"
        clearable
        @change="handleQuery"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button :icon="Refresh" @click="handleQuery">刷新列表</el-button>
    </div>

    <section class="content-panel animate-up">
      <el-table :data="configList" border stripe v-loading="loading">
        <el-table-column label="配置名称" width="180">
          <template #default="{ row }">
            <span class="config-name">{{ row.configName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="配置键(Key)" width="220">
          <template #default="{ row }">
            <code class="code-tag">{{ row.configKey }}</code>
          </template>
        </el-table-column>

        <el-table-column label="配置值(Value)" min-width="300">
          <template #default="{ row }">
            <div class="value-preview" @click="openModal(row)">
              {{ formatPreview(row.configValue) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="作用说明" min-width="200" />

        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openModal(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          layout="total, prev, pager, next"
          :total="total"
          @current-change="fetchList"
        />
      </div>
    </section>

    <el-dialog
      v-model="showModal"
      :title="form.id ? '编辑系统配置' : '新增配置项'"
      width="900px"
      destroy-on-close
    >
      <el-form :model="form" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="配置名称">
              <el-input v-model="form.configName" placeholder="例如：矿机系统配置" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置键(Key)">
              <el-input v-model="form.configKey" :disabled="!!form.id" placeholder="UNIQUE_KEY" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="作用说明/备注">
          <el-input v-model="form.remark" placeholder="描述该配置项的业务用途" />
        </el-form-item>

        <div class="visual-form-wrapper">
          <div class="form-divider">
            <span>{{ isVisualMode ? '可视化表单模式' : '普通文本模式' }}</span>
          </div>

          <div v-if="form.configKey === 'MINER_SYSTEM_SETTINGS'" class="custom-form-box">
            <el-divider content-position="left">基础参数设置</el-divider>

            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item :label="FIELD_MAP.electricFee">
                  <el-input-number v-model="visualData.electricFee" :precision="2" :step="0.1" style="width: 100%" />
                </el-form-item>
              </el-col>
              <!-- <el-col :span="6">
                <el-form-item :label="FIELD_MAP.accelerationFee">
                  <el-input-number
                    v-model="visualData.accelerationFee"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col> -->
              <el-col :span="6">
                <el-form-item :label="FIELD_MAP.profitTime">
                  <el-time-picker v-model="visualData.profitTime" value-format="HH:mm:ss" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="FIELD_MAP.electricityRewardTime">
                  <el-time-picker
                    v-model="visualData.electricityRewardTime"
                    value-format="HH:mm:ss"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">矿机每日收益配置</el-divider>

            <el-row :gutter="20">
              <el-col v-for="minerType in visibleMinerProfitKeys" :key="minerType" :span="6">
                <el-form-item :label="MINER_TYPE_LABELS[minerType]">
                  <el-input-number
                    v-model="visualData.minerDailyProfits[minerType]"
                    :precision="6"
                    :step="0.1"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <p class="form-tip">提交后会按 6 位小数向下截断处理</p>

            <el-divider content-position="left">碎片兑换比例</el-divider>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="铜卡牌(id=1)碎片兑换比例(张/卡)" class="card-rate-form-item">
                  <el-input-number
                    v-model="visualData.fragmentToCardRates[1]"
                    :precision="0"
                    :min="1"
                    :step="1"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="银卡牌(id=2)碎片兑换比例(张/卡)" class="card-rate-form-item">
                  <el-input-number
                    v-model="visualData.fragmentToCardRates[2]"
                    :precision="0"
                    :min="1"
                    :step="1"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="金卡牌(id=3)碎片兑换比例(张/卡)" class="card-rate-form-item">
                  <el-input-number
                    v-model="visualData.fragmentToCardRates[3]"
                    :precision="0"
                    :min="1"
                    :step="1"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">分成与阶梯奖励配置</el-divider>

            <el-row :gutter="40">
              <el-col>
                <el-form-item :label="FIELD_MAP.rewardTiers">
                  <div class="dynamic-list-container">
                    <div v-for="(tier, index) in visualData.tiers" :key="index" class="dynamic-row">
                      <span class="row-label">满</span>
                      <el-input-number
                        v-model="tier.minCount"
                        :min="0"
                        :precision="0"
                        controls-position="right"
                      />
                      <span class="row-label">台，奖励比例</span>
                      <el-input-number
                        v-model="tier.ratio"
                        :precision="3"
                        :step="0.01"
                        :max="1"
                        :min="0"
                      />
                      <el-button :icon="Delete" circle type="danger" link @click="removeTierRow(index)" />
                    </div>
                    <el-button type="primary" link :icon="Plus" @click="addTierRow" class="add-btn">
                      添加阶梯门槛
                    </el-button>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div v-else-if="form.configKey === 'WITHDRAW_SETTINGS'" class="custom-form-box">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.minAmount">
                  <el-input-number v-model="visualData.minAmount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.feeRate">
                  <el-input-number v-model="visualData.feeRate" :precision="3" :max="1" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.uPerCoin">
                  <el-input-number
                    v-model="visualData.uPerCoin"
                    :precision="6"
                    :step="0.1"
                    :min="0.000001"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div v-else>
            <el-form-item label="配置值内容(JSON/Text)">
              <el-input v-model="form.configValue" type="textarea" :rows="10" placeholder="请输入内容..." />
            </el-form-item>
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="showModal = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认并保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Plus, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as configApi from '../api/systemConfig'
import { getCurrentAdminInfo } from '../api/rbac'

const DEFAULT_FRAGMENT_TO_CARD_RATE = 100
const DEFAULT_FRAGMENT_TO_CARD_RATES = {
  1: 100,
  2: 150,
  3: 200
}
const DEFAULT_MINER_DAILY_PROFITS = {
  '0': 0,
  '1': 0,
  '2': 0,
  '3': 0
}
const DEFAULT_WITHDRAW_SETTINGS = {
  minAmount: 10,
  feeRate: 0.05,
  uPerCoin: 1
}
const MINER_TYPE_LABELS = {
  '0': '小型矿机日收益',
  '1': '中型矿机日收益',
  '2': '大型矿机日收益',
  '3': '默认（3）矿机日收益'
}

const truncateToSixDecimals = (value) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0
  }

  return Math.floor(numericValue * 1000000) / 1000000
}

const normalizeMinerDailyProfits = (source = {}) => {
  const rawProfits = source.minerDailyProfits || {}
  const normalized = {}

  ;['0', '1', '2', '3'].forEach((minerType) => {
    const current = rawProfits[minerType] ?? rawProfits[Number(minerType)]
    normalized[minerType] =
      current === undefined || current === null || current === ''
        ? DEFAULT_MINER_DAILY_PROFITS[minerType]
        : truncateToSixDecimals(current)
  })

  return normalized
}

const normalizeFragmentToCardRates = (source = {}) => {
  const fallbackRate = Number(source.fragmentToCardRate ?? DEFAULT_FRAGMENT_TO_CARD_RATE)
  const rawRates = source.fragmentToCardRates || {}
  const normalized = {}

  ;[1, 2, 3].forEach((cardId) => {
    const current = rawRates[cardId] ?? rawRates[String(cardId)]
    const parsed = Number(current)
    const defaultValue = DEFAULT_FRAGMENT_TO_CARD_RATES[cardId] ?? fallbackRate
    normalized[cardId] = Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue
  })

  return normalized
}

const sanitizeMinerSettings = (source = {}) => {
  return {
    ...source,
    tiers: Array.isArray(source.tiers) ? source.tiers : [],
    electricityRewardTime: source.electricityRewardTime || '23:50:00',
    profitTime: source.profitTime || '23:59:00',
    electricFee: Number(source.electricFee ?? 0),
    accelerationFee: Number(source.accelerationFee ?? 0),
    minerDailyProfits: normalizeMinerDailyProfits(source),
    fragmentToCardRate: source.fragmentToCardRate ?? DEFAULT_FRAGMENT_TO_CARD_RATE,
    fragmentToCardRates: normalizeFragmentToCardRates(source)
  }
}

const FIELD_MAP = {
  electricFee: '电费单价 (USDT)',
  accelerationFee: '加速包费用 (USDT)',
  profitTime: '矿机收益发放时间',
  electricityRewardTime: '电费分成结算时间',
  rewardTiers: '下级电费分成阶梯',
  minAmount: '最低提现金额(USDT)',
  feeRate: '提现手续费率',
  uPerCoin: '一个币对应多少U'
}

const VISUAL_KEYS = ['MINER_SYSTEM_SETTINGS', 'WITHDRAW_SETTINGS']

const loading = ref(false)
const showModal = ref(false)
const configList = ref([])
const total = ref(0)
const visualData = ref({})
const currentRoleKey = ref('')

const queryParams = reactive({ page: 1, size: 10, configKey: '' })
const form = reactive({ id: null, configName: '', configKey: '', configValue: '', remark: '' })

const isVisualMode = computed(() => VISUAL_KEYS.includes(form.configKey))
const isSuperAdmin = computed(() => currentRoleKey.value === 'super_admin')
const visibleMinerProfitKeys = computed(() => (isSuperAdmin.value ? ['0', '1', '2', '3'] : ['0', '1', '2']))

const fetchCurrentAdminRole = async () => {
  try {
    const res = await getCurrentAdminInfo()
    if (res?.code === 200 && res.data?.role?.roleKey) {
      currentRoleKey.value = res.data.role.roleKey
    }
  } catch (error) {
    console.error('获取当前管理员角色失败:', error)
    currentRoleKey.value = ''
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await configApi.getConfigPage(queryParams)
    if (res?.records) {
      configList.value = res.records
      total.value = res.total
    }
  } finally {
    loading.value = false
  }
}

const openModal = (row = null) => {
  if (row) {
    Object.assign(form, JSON.parse(JSON.stringify(row)))

    if (isVisualMode.value) {
      try {
        const fixedStr = form.configValue.replace(/([{,]\s*)(\d+)(\s*:)/g, '$1"$2"$3')
        const parsed = JSON.parse(fixedStr)

        if (form.configKey === 'MINER_SYSTEM_SETTINGS') {
          visualData.value = sanitizeMinerSettings(parsed)
        } else {
          visualData.value = sanitizeWithdrawSettings(parsed)
        }
      } catch (error) {
        console.error('JSON 解析失败:', error)
        visualData.value = form.configKey === 'MINER_SYSTEM_SETTINGS' ? sanitizeMinerSettings() : sanitizeWithdrawSettings()
      }
    }
  } else {
    Object.assign(form, { id: null, configName: '', configKey: '', configValue: '', remark: '' })
    visualData.value = sanitizeMinerSettings({
      distributionRatios: {},
      electricFee: 0,
      accelerationFee: 0
    })
  }

  showModal.value = true
}

const addTierRow = () => {
  if (!visualData.value.tiers) visualData.value.tiers = []
  visualData.value.tiers.push({ minCount: 0, ratio: 0 })
}

const removeTierRow = (index) => {
  visualData.value.tiers.splice(index, 1)
}

const validateMinerDailyProfits = () => {
  const profits = visualData.value?.minerDailyProfits || {}
  return ['0', '1', '2', '3'].find((key) => {
    const rawValue = profits[key]
    return rawValue === undefined || rawValue === null || rawValue === '' || !Number.isFinite(Number(rawValue)) || Number(rawValue) < 0
  })
}

const sanitizeWithdrawSettings = (source = {}) => ({
  minAmount: Number(source.minAmount ?? DEFAULT_WITHDRAW_SETTINGS.minAmount),
  feeRate: Number(source.feeRate ?? DEFAULT_WITHDRAW_SETTINGS.feeRate),
  uPerCoin: Number(source.uPerCoin ?? DEFAULT_WITHDRAW_SETTINGS.uPerCoin)
})

const submitForm = async () => {
  if (isVisualMode.value) {
    if (form.configKey === 'MINER_SYSTEM_SETTINGS') {
      const fragmentToCardRates = normalizeFragmentToCardRates(visualData.value)
      const invalidRate = Object.entries(fragmentToCardRates).find(([, value]) => !Number.isInteger(value) || value <= 0)
      if (invalidRate) {
        ElMessage.error('卡牌碎片兑换比例必须为大于 0 的整数')
        return
      }

      const invalidProfitKey = validateMinerDailyProfits()
      if (invalidProfitKey) {
        ElMessage.error(`${MINER_TYPE_LABELS[invalidProfitKey]}必须填写且不能小于 0`)
        return
      }

      visualData.value = sanitizeMinerSettings({
        ...visualData.value,
        minerDailyProfits: normalizeMinerDailyProfits(visualData.value),
        fragmentToCardRates
      })
    } else if (form.configKey === 'WITHDRAW_SETTINGS') {
      const nextWithdrawSettings = sanitizeWithdrawSettings(visualData.value)
      if (!Number.isFinite(nextWithdrawSettings.uPerCoin) || nextWithdrawSettings.uPerCoin <= 0) {
        ElMessage.error('一个币对应多少U必须大于 0')
        return
      }

      visualData.value = nextWithdrawSettings
    }

    form.configValue = JSON.stringify(visualData.value)
  }

  try {
    await configApi.saveOrUpdateConfig(form)
    ElMessage.success('配置已保存成功')
    showModal.value = false
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  }
}

const handleQuery = () => {
  queryParams.page = 1
  fetchList()
}

const formatPreview = (val) => {
  if (!val) return '-'
  return val.length > 60 ? `${val.substring(0, 60)}...` : val
}

onMounted(async () => {
  await fetchCurrentAdminRole()
  fetchList()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.header-left h1 {
  font-size: 24px;
  margin: 5px 0 0;
  color: var(--el-text-color-primary);
}

.eyebrow {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.filter-card {
  display: flex;
  gap: 12px;
  background: var(--el-bg-color);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  margin-bottom: 20px;
}

.search-input {
  width: 320px;
}

.content-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 15px;
}

.code-tag {
  font-family: 'Courier New', Courier, monospace;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.value-preview {
  font-family: monospace;
  font-size: 12px;
  background: var(--el-fill-color-lighter);
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid transparent;
  transition: 0.2s;
}

.value-preview:hover {
  border-color: var(--el-color-primary);
  background: var(--el-fill-color);
}

.form-divider {
  border-top: 1px solid var(--el-border-color-lighter);
  margin: 30px 0 25px;
  position: relative;
}

.form-divider span {
  position: absolute;
  top: -10px;
  background: var(--el-bg-color-overlay);
  padding: 0 15px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  left: 50%;
  transform: translateX(-50%);
}

.custom-form-box {
  background: var(--el-fill-color-blank);
  padding: 20px;
  border-radius: 8px;
  border: 1px dashed var(--el-border-color-darker);
}

.form-tip {
  margin: 0 0 16px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

:deep(.card-rate-form-item .el-form-item__label) {
  white-space: nowrap;
}

.dynamic-list-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--el-fill-color-lighter);
  padding: 15px;
  border-radius: 6px;
  min-height: 100px;
}

.dynamic-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.add-btn {
  width: fit-content;
  margin-top: 5px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.animate-up {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.config-name {
  font-weight: 600;
}
</style>
