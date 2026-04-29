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
      <el-button type="warning" plain @click="openGoldQuantConfig">黄金量化参数配置</el-button>
      <el-button type="warning" plain @click="openGoldQuantCommissionConfig">黄金量化分成规则配置</el-button>
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
              <el-input v-model="form.configKey" :disabled="!!form.id" placeholder="UNIQUE_KEY" @change="handleConfigKeyChange" />
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
              <el-col :span="6">
                <el-form-item :label="FIELD_MAP.smallAreaUnlimitedElectricityReward">
                  <el-switch
                    v-model="visualData.smallAreaUnlimitedElectricityReward"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-alert
              class="rule-alert"
              type="info"
              :closable="false"
              show-icon
              title="开关关闭按下级电费、代数业绩比例、等级分成比例计算；开关开启按小区总电费和等级分成比例计算。"
            />

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
              <!-- <el-col :span="8">
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
              </el-col> -->
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

            <el-divider content-position="left">等级与分成</el-divider>

            <el-form-item label="等级判断标准">
              <el-switch
                v-model="visualData.activeMinerGradeMode"
                active-text="以已激活矿机数量为准"
                inactive-text="以已兑换矿机数量为准"
              />
            </el-form-item>

            <el-row :gutter="40">
              <el-col>
                <el-form-item :label="FIELD_MAP.rewardTiers">
                  <div class="dynamic-list-container">
                    <div v-for="(tier, index) in visualData.tiers" :key="index" class="dynamic-row">
                      <span class="row-label">满</span>
                      <el-input-number
                        v-model="tier.minCount"
                        :min="1"
                        :precision="0"
                        controls-position="right"
                      />
                      <span class="row-label">台，等级</span>
                      <el-input-number
                        v-model="tier.grade"
                        :min="1"
                        :precision="0"
                        controls-position="right"
                      />
                      <span class="row-label">，分成比例</span>
                      <el-input-number
                        v-model="tier.rewardRatio"
                        :precision="3"
                        :step="0.01"
                        :max="1"
                        :min="0"
                      />
                      <el-button :icon="Delete" circle type="danger" link @click="removeTierRow(index)" />
                    </div>
                    <el-button type="primary" link :icon="Plus" @click="addTierRow" class="add-btn">
                      添加等级
                    </el-button>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">电费代数业绩比例</el-divider>

            <el-form-item :label="FIELD_MAP.electricityGenerationPerformanceRatios">
              <div class="dynamic-list-container">
                <div
                  v-for="(item, index) in visualData.electricityGenerationPerformanceRatios"
                  :key="index"
                  class="dynamic-row"
                >
                  <span class="row-label">第</span>
                  <el-input-number
                    v-model="item.generation"
                    :min="1"
                    :precision="0"
                    controls-position="right"
                  />
                  <span class="row-label">代，业绩比例</span>
                  <el-input-number
                    v-model="item.performanceRatio"
                    :precision="4"
                    :step="0.05"
                    :max="1"
                    :min="0"
                  />
                  <el-button :icon="Delete" circle type="danger" link @click="removeGenerationRatioRow(index)" />
                </div>
                <el-button type="primary" link :icon="Plus" @click="addGenerationRatioRow" class="add-btn">
                  添加代数比例
                </el-button>
              </div>
            </el-form-item>
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

          <div v-else-if="form.configKey === 'GOLD_QUANT_SETTINGS'" class="custom-form-box">
            <el-divider content-position="left">黄金量化参数配置</el-divider>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.hostingFee">
                  <el-input-number v-model="visualData.hostingFee" :precision="2" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.windowMaintenanceFee">
                  <el-input-number v-model="visualData.windowMaintenanceFee" :precision="2" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.hostingDays">
                  <el-input-number v-model="visualData.hostingDays" :precision="0" :min="1" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.maintenanceDays">
                  <el-input-number v-model="visualData.maintenanceDays" :precision="0" :min="1" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.minerThreshold">
                  <el-input-number v-model="visualData.minerThreshold" :precision="0" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.maxWindowCount">
                  <el-input-number v-model="visualData.maxWindowCount" :precision="0" :min="1" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div v-else-if="form.configKey === 'GOLD_QUANT_COMMISSION_SETTINGS'" class="custom-form-box">
            <el-divider content-position="left">奖励等级规则</el-divider>
            <div class="dynamic-list-container">
              <div v-for="(item, index) in visualData.rewardLevels" :key="`reward-level-${index}`" class="dynamic-row">
                <span class="row-label">V</span>
                <el-input-number v-model="item.level" :min="1" :precision="0" controls-position="right" />
                <span class="row-label">直属有效购买人数</span>
                <el-input-number
                  v-model="item.directValidBuyerCount"
                  :min="0"
                  :precision="0"
                  controls-position="right"
                />
                <el-button :icon="Delete" circle type="danger" link @click="removeGoldQuantRewardLevel(index)" />
              </div>
              <el-button type="primary" link :icon="Plus" @click="addGoldQuantRewardLevel" class="add-btn">
                添加奖励等级
              </el-button>
            </div>

            <el-divider content-position="left">奖励分成代数规则</el-divider>
            <div class="dynamic-list-container">
              <div v-for="(item, index) in visualData.rewardRules" :key="`reward-rule-${index}`" class="dynamic-row">
                <span class="row-label">V</span>
                <el-input-number v-model="item.level" :min="1" :precision="0" controls-position="right" />
                <span class="row-label">第</span>
                <el-input-number v-model="item.minGeneration" :min="1" :precision="0" controls-position="right" />
                <span class="row-label">至</span>
                <el-input-number
                  v-model="item.maxGeneration"
                  :min="1"
                  :precision="0"
                  placeholder="空为无上限"
                  controls-position="right"
                />
                <span class="row-label">代，比例</span>
                <el-input-number v-model="item.ratio" :precision="4" :step="0.01" :min="0" :max="1" />
                <el-button :icon="Delete" circle type="danger" link @click="removeGoldQuantRewardRule(index)" />
              </div>
              <el-button type="primary" link :icon="Plus" @click="addGoldQuantRewardRule" class="add-btn">
                添加奖励规则
              </el-button>
            </div>

            <el-divider content-position="left">分销等级规则</el-divider>
            <el-form-item :label="FIELD_MAP.distributionMaxGeneration">
              <el-input-number
                v-model="visualData.distributionMaxGeneration"
                :min="1"
                :precision="0"
                controls-position="right"
              />
            </el-form-item>
            <div class="dynamic-list-container">
              <div
                v-for="(item, index) in visualData.distributionLevels"
                :key="`distribution-level-${index}`"
                class="dynamic-row"
              >
                <span class="row-label">V</span>
                <el-input-number v-model="item.level" :min="1" :precision="0" controls-position="right" />
                <span class="row-label">团队有效窗口数</span>
                <el-input-number
                  v-model="item.teamValidWindowCount"
                  :min="0"
                  :precision="0"
                  controls-position="right"
                />
                <span class="row-label">比例</span>
                <el-input-number v-model="item.ratio" :precision="4" :step="0.01" :min="0" :max="1" />
                <el-button :icon="Delete" circle type="danger" link @click="removeGoldQuantDistributionLevel(index)" />
              </div>
              <el-button type="primary" link :icon="Plus" @click="addGoldQuantDistributionLevel" class="add-btn">
                添加分销等级
              </el-button>
            </div>
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

const MINER_TYPE_LABELS = {
  '0': '小型矿机日收益',
  '1': '中型矿机日收益',
  '2': '大型矿机日收益',
  '3': '特殊矿机日收益'
}

const truncateToSixDecimals = (value) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null
  }

  return Math.floor(numericValue * 1000000) / 1000000
}

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === '') return null
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

const normalizeMinerDailyProfits = (source = {}) => {
  const rawProfits =
    source.minerDailyProfits ||
    source.minerDailyProfit ||
    source.minerProfits ||
    source.minerProfit ||
    source.dailyProfits ||
    source.dailyProfit ||
    {}
  const normalized = {}

  ;['0', '1', '2', '3'].forEach((minerType) => {
    const current = rawProfits[minerType] ?? rawProfits[Number(minerType)]
    normalized[minerType] = current === undefined || current === null || current === '' ? null : truncateToSixDecimals(current)
  })

  return normalized
}

const normalizeFragmentToCardRates = (source = {}) => {
  const rawRates = source.fragmentToCardRates || {}
  const normalized = {}

  ;[1, 2, 3].forEach((cardId) => {
    const current = rawRates[cardId] ?? rawRates[String(cardId)]
    const parsed = Number(current)
    normalized[cardId] = Number.isFinite(parsed) && parsed > 0 ? parsed : null
  })

  return normalized
}

const normalizeActiveMinerGradeMode = (value) => {
  if (value === false || value === 'false') return false
  if (value === true || value === 'true') return true
  return null
}

const parseConfigValue = (value) => {
  if (!value) return {}
  if (typeof value === 'object') return value

  const normalizedText = String(value).replace(/([{,]\s*)(\d+)(\s*:)/g, '$1"$2"$3')
  const parsed = JSON.parse(normalizedText)

  if (typeof parsed === 'string') {
    return parseConfigValue(parsed)
  }

  return parsed || {}
}

const normalizeSmallAreaUnlimitedElectricityReward = (value) => {
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  return null
}

const normalizeMinerTiers = (tiers = []) => {
  if (!Array.isArray(tiers)) return []

  return tiers
    .map((tier) => ({
      grade: Number(tier?.grade),
      minCount: tier?.minCount === undefined || tier?.minCount === null || tier?.minCount === '' ? null : Number(tier.minCount),
      ratio:
        tier?.rewardRatio === undefined || tier?.rewardRatio === null || tier?.rewardRatio === ''
          ? tier?.ratio === undefined || tier?.ratio === null || tier?.ratio === ''
            ? null
            : Number(tier.ratio)
          : Number(tier.rewardRatio),
      rewardRatio:
        tier?.rewardRatio === undefined || tier?.rewardRatio === null || tier?.rewardRatio === ''
          ? tier?.ratio === undefined || tier?.ratio === null || tier?.ratio === ''
            ? null
            : Number(tier.ratio)
          : Number(tier.rewardRatio)
    }))
    .sort((prev, next) => {
      const prevCount = Number.isFinite(prev.minCount) ? prev.minCount : Number.MAX_SAFE_INTEGER
      const nextCount = Number.isFinite(next.minCount) ? next.minCount : Number.MAX_SAFE_INTEGER
      return prevCount - nextCount
    })
    .map((tier, index) => ({
      ...tier,
      grade: Number.isInteger(tier.grade) && tier.grade > 0 ? tier.grade : null
    }))
}

const normalizeGenerationPerformanceRatios = (ratios = []) => {
  const source = Array.isArray(ratios) ? ratios : []

  return source
    .map((item, index) => ({
      generation:
        Number.isInteger(Number(item?.generation)) && Number(item.generation) > 0 ? Number(item.generation) : null,
      performanceRatio:
        item?.performanceRatio === undefined || item?.performanceRatio === null || item?.performanceRatio === ''
          ? null
          : Number(item.performanceRatio)
    }))
    .sort((prev, next) => prev.generation - next.generation)
}

const sanitizeMinerSettings = (source = {}) => {
  return {
    ...source,
    activeMinerGradeMode: normalizeActiveMinerGradeMode(source.activeMinerGradeMode),
    smallAreaUnlimitedElectricityReward: normalizeSmallAreaUnlimitedElectricityReward(
      source.smallAreaUnlimitedElectricityReward
    ),
    tiers: normalizeMinerTiers(source.tiers),
    electricityGenerationPerformanceRatios: normalizeGenerationPerformanceRatios(
      source.electricityGenerationPerformanceRatios
    ),
    electricityRewardTime: source.electricityRewardTime || '',
    profitTime: source.profitTime || '',
    electricFee: toNullableNumber(source.electricFee),
    accelerationFee: toNullableNumber(source.accelerationFee),
    minerDailyProfits: normalizeMinerDailyProfits(source),
    fragmentToCardRate: toNullableNumber(source.fragmentToCardRate),
    fragmentToCardRates: normalizeFragmentToCardRates(source)
  }
}

const FIELD_MAP = {
  electricFee: '电费单价 (USDT)',
  accelerationFee: '加速包费用 (USDT)',
  profitTime: '矿机收益发放时间',
  electricityRewardTime: '电费分成结算时间',
  smallAreaUnlimitedElectricityReward: '小区不限代分成',
  rewardTiers: '等级与分成配置',
  electricityGenerationPerformanceRatios: '代数业绩比例配置',
  minAmount: '最低提现金额(USDT)',
  feeRate: '提现手续费率',
  uPerCoin: '一个币对应多少U',
  hostingFee: '托管费金额(USDT)',
  windowMaintenanceFee: '单个窗口维护费(USDT)',
  hostingDays: '托管费延长天数',
  maintenanceDays: '维护费延长天数',
  minerThreshold: '新购窗口最低矿机数',
  maxWindowCount: '每用户最多窗口数',
  distributionMaxGeneration: '分销最大计算代数'
}

const VISUAL_KEYS = ['MINER_SYSTEM_SETTINGS', 'WITHDRAW_SETTINGS', 'GOLD_QUANT_SETTINGS', 'GOLD_QUANT_COMMISSION_SETTINGS']

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
        const parsed = parseConfigValue(form.configValue)

        if (form.configKey === 'MINER_SYSTEM_SETTINGS') {
          visualData.value = sanitizeMinerSettings(parsed)
        } else if (form.configKey === 'GOLD_QUANT_SETTINGS') {
          visualData.value = sanitizeGoldQuantSettings(parsed)
        } else if (form.configKey === 'GOLD_QUANT_COMMISSION_SETTINGS') {
          visualData.value = sanitizeGoldQuantCommissionSettings(parsed)
        } else {
          visualData.value = sanitizeWithdrawSettings(parsed)
        }
      } catch (error) {
        console.error('JSON 解析失败:', error)
        visualData.value =
          form.configKey === 'MINER_SYSTEM_SETTINGS'
            ? sanitizeMinerSettings()
            : form.configKey === 'GOLD_QUANT_SETTINGS'
              ? sanitizeGoldQuantSettings()
              : form.configKey === 'GOLD_QUANT_COMMISSION_SETTINGS'
                ? sanitizeGoldQuantCommissionSettings()
                : sanitizeWithdrawSettings()
      }
    }
  } else {
    Object.assign(form, { id: null, configName: '', configKey: '', configValue: '', remark: '' })
    visualData.value = sanitizeMinerSettings()
  }

  showModal.value = true
}

const openGoldQuantConfig = () => {
  const existingConfig = configList.value.find((item) => item.configKey === 'GOLD_QUANT_SETTINGS')
  if (existingConfig) {
    openModal(existingConfig)
    return
  }

  Object.assign(form, {
    id: null,
    configName: '黄金量化参数配置',
    configKey: 'GOLD_QUANT_SETTINGS',
    configValue: '',
    remark: '托管费、窗口维护费、矿机门槛、窗口数量上限'
  })
  visualData.value = sanitizeGoldQuantSettings()
  showModal.value = true
}

const openGoldQuantCommissionConfig = () => {
  const existingConfig = configList.value.find((item) => item.configKey === 'GOLD_QUANT_COMMISSION_SETTINGS')
  if (existingConfig) {
    openModal(existingConfig)
    return
  }

  Object.assign(form, {
    id: null,
    configName: '黄金量化双分成规则配置',
    configKey: 'GOLD_QUANT_COMMISSION_SETTINGS',
    configValue: '',
    remark: '奖励分成、分销分成等级比例及分销最大代数'
  })
  visualData.value = sanitizeGoldQuantCommissionSettings()
  showModal.value = true
}

const handleConfigKeyChange = () => {
  if (form.id) return

  if (form.configKey === 'GOLD_QUANT_SETTINGS') {
    visualData.value = sanitizeGoldQuantSettings()
    form.configName = form.configName || '黄金量化参数配置'
    form.remark = form.remark || '托管费、窗口维护费、矿机门槛、窗口数量上限'
  } else if (form.configKey === 'GOLD_QUANT_COMMISSION_SETTINGS') {
    visualData.value = sanitizeGoldQuantCommissionSettings()
    form.configName = form.configName || '黄金量化双分成规则配置'
    form.remark = form.remark || '奖励分成、分销分成等级比例及分销最大代数'
  } else if (form.configKey === 'WITHDRAW_SETTINGS') {
    visualData.value = sanitizeWithdrawSettings()
  } else if (form.configKey === 'MINER_SYSTEM_SETTINGS') {
    visualData.value = sanitizeMinerSettings()
  }
}

const addTierRow = () => {
  if (!visualData.value.tiers) visualData.value.tiers = []
  visualData.value.tiers.push({ grade: null, minCount: null, ratio: null, rewardRatio: null })
}

const removeTierRow = (index) => {
  visualData.value.tiers.splice(index, 1)
  visualData.value.tiers = normalizeMinerTiers(visualData.value.tiers)
}

const addGenerationRatioRow = () => {
  if (!Array.isArray(visualData.value.electricityGenerationPerformanceRatios)) {
    visualData.value.electricityGenerationPerformanceRatios = []
  }
  visualData.value.electricityGenerationPerformanceRatios.push({
    generation: null,
    performanceRatio: null
  })
}

const removeGenerationRatioRow = (index) => {
  visualData.value.electricityGenerationPerformanceRatios.splice(index, 1)
}

const addGoldQuantRewardLevel = () => {
  if (!Array.isArray(visualData.value.rewardLevels)) visualData.value.rewardLevels = []
  visualData.value.rewardLevels.push({ level: null, directValidBuyerCount: null })
}

const removeGoldQuantRewardLevel = (index) => {
  visualData.value.rewardLevels.splice(index, 1)
}

const addGoldQuantRewardRule = () => {
  if (!Array.isArray(visualData.value.rewardRules)) visualData.value.rewardRules = []
  visualData.value.rewardRules.push({ level: null, minGeneration: null, maxGeneration: null, ratio: null })
}

const removeGoldQuantRewardRule = (index) => {
  visualData.value.rewardRules.splice(index, 1)
}

const addGoldQuantDistributionLevel = () => {
  if (!Array.isArray(visualData.value.distributionLevels)) visualData.value.distributionLevels = []
  visualData.value.distributionLevels.push({ level: null, teamValidWindowCount: null, ratio: null })
}

const removeGoldQuantDistributionLevel = (index) => {
  visualData.value.distributionLevels.splice(index, 1)
}

const validateMinerDailyProfits = () => {
  const profits = visualData.value?.minerDailyProfits || {}
  return ['0', '1', '2', '3'].find((key) => {
    const rawValue = profits[key]
    return rawValue === undefined || rawValue === null || rawValue === '' || !Number.isFinite(Number(rawValue)) || Number(rawValue) < 0
  })
}

const validateAndNormalizeMinerTiers = () => {
  // if (typeof visualData.value.activeMinerGradeMode !== 'boolean') {
  //   return '等级判断标准必须选择'
  // }

  // if (!Array.isArray(visualData.value.tiers) || visualData.value.tiers.length === 0) {
  //   return '等级与分成配置不能为空'
  // }

  const normalizedTiers = normalizeMinerTiers(visualData.value.tiers)
  const minCountSet = new Set()
  const gradeSet = new Set()

  for (const tier of normalizedTiers) {
    if (!Number.isInteger(tier.grade) || tier.grade < 1) {
      return '等级必须大于等于 1'
    }

    if (gradeSet.has(tier.grade)) {
      return '等级不允许重复'
    }

    if (!Number.isInteger(tier.minCount) || tier.minCount <= 0) {
      return `等级 ${tier.grade} 的矿机数量必须大于 0`
    }

    if (!Number.isFinite(tier.rewardRatio) || tier.rewardRatio < 0 || tier.rewardRatio > 1) {
      return `等级 ${tier.grade} 的分成比例必须在 0 到 1 之间`
    }

    if (minCountSet.has(tier.minCount)) {
      return '矿机数量门槛不允许重复'
    }

    gradeSet.add(tier.grade)
    minCountSet.add(tier.minCount)
  }

  visualData.value.tiers = normalizedTiers
  return ''
}

const validateAndNormalizeGenerationPerformanceRatios = () => {
  const normalizedRatios = normalizeGenerationPerformanceRatios(visualData.value.electricityGenerationPerformanceRatios)
  const generationSet = new Set()

  // if (!normalizedRatios.length) {
  //   return '代数业绩比例配置不能为空'
  // }

  for (const item of normalizedRatios) {
    if (!Number.isInteger(item.generation) || item.generation < 1) {
      return '代数必须为大于 0 的整数'
    }

    if (generationSet.has(item.generation)) {
      return '代数不允许重复'
    }

    if (!Number.isFinite(item.performanceRatio) || item.performanceRatio < 0 || item.performanceRatio > 1) {
      return `第 ${item.generation} 代业绩比例必须在 0 到 1 之间`
    }

    generationSet.add(item.generation)
  }

  visualData.value.electricityGenerationPerformanceRatios = normalizedRatios
  return ''
}

const sanitizeWithdrawSettings = (source = {}) => ({
  minAmount: toNullableNumber(source.minAmount),
  feeRate: toNullableNumber(source.feeRate),
  uPerCoin: toNullableNumber(source.uPerCoin)
})

const sanitizeGoldQuantSettings = (source = {}) => ({
  hostingFee: toNullableNumber(source.hostingFee),
  windowMaintenanceFee: toNullableNumber(source.windowMaintenanceFee),
  hostingDays: toNullableNumber(source.hostingDays),
  maintenanceDays: toNullableNumber(source.maintenanceDays),
  minerThreshold: toNullableNumber(source.minerThreshold),
  maxWindowCount: toNullableNumber(source.maxWindowCount)
})

const sanitizeGoldQuantCommissionSettings = (source = {}) => {
  return {
    rewardLevels: (Array.isArray(source.rewardLevels) ? source.rewardLevels : [])
      .map((item) => ({
        level: toNullableNumber(item.level),
        directValidBuyerCount: toNullableNumber(item.directValidBuyerCount)
      }))
      .sort((prev, next) => prev.level - next.level),
    rewardRules: (Array.isArray(source.rewardRules) ? source.rewardRules : [])
      .map((item) => ({
        level: toNullableNumber(item.level),
        minGeneration: toNullableNumber(item.minGeneration),
        maxGeneration:
          item.maxGeneration === null || item.maxGeneration === undefined || item.maxGeneration === ''
            ? null
            : toNullableNumber(item.maxGeneration),
        ratio: toNullableNumber(item.ratio)
      }))
      .sort((prev, next) => prev.minGeneration - next.minGeneration),
    distributionLevels: (Array.isArray(source.distributionLevels) ? source.distributionLevels : [])
      .map((item) => ({
        level: toNullableNumber(item.level),
        teamValidWindowCount: toNullableNumber(item.teamValidWindowCount),
        ratio: toNullableNumber(item.ratio)
      }))
      .sort((prev, next) => prev.level - next.level),
    distributionMaxGeneration: toNullableNumber(source.distributionMaxGeneration)
  }
}

const validatePositiveNumber = (value, label, allowZero = false) => {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    return `${label}必须${allowZero ? '大于等于' : '大于'} 0`
  }
  return ''
}

const validatePositiveInteger = (value, label, allowZero = false) => {
  if (!Number.isInteger(value) || (allowZero ? value < 0 : value <= 0)) {
    return `${label}必须为${allowZero ? '大于等于' : '大于'} 0 的整数`
  }
  return ''
}

const validateUniqueIntegerField = (list, field, label) => {
  const values = new Set()
  for (const item of list) {
    if (!Number.isInteger(item[field]) || item[field] <= 0) return `${label}必须为大于 0 的整数`
    if (values.has(item[field])) return `${label}不允许重复`
    values.add(item[field])
  }
  return ''
}

const validateRatio = (value, label) => {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return `${label}必须在 0 到 1 之间`
  }
  return ''
}

const validateAndNormalizeGoldQuantCommissionSettings = () => {
  const nextSettings = sanitizeGoldQuantCommissionSettings(visualData.value)

  // if (!nextSettings.rewardLevels.length) return '奖励等级规则不能为空'
  // if (!nextSettings.rewardRules.length) return '奖励分成代数规则不能为空'
  // if (!nextSettings.distributionLevels.length) return '分销等级规则不能为空'

  let validationMessage =
    validateUniqueIntegerField(nextSettings.rewardLevels, 'level', '奖励等级') ||
    validateUniqueIntegerField(nextSettings.rewardRules, 'level', '奖励规则等级') ||
    validateUniqueIntegerField(nextSettings.distributionLevels, 'level', '分销等级') ||
    validatePositiveInteger(nextSettings.distributionMaxGeneration, '分销最大计算代数')

  if (validationMessage) return validationMessage

  for (const item of nextSettings.rewardLevels) {
    validationMessage = validatePositiveInteger(item.directValidBuyerCount, `V${item.level} 直属有效购买人数`, true)
    if (validationMessage) return validationMessage
  }

  for (const item of nextSettings.rewardRules) {
    validationMessage =
      validatePositiveInteger(item.minGeneration, `V${item.level} 最小代数`) ||
      (item.maxGeneration === null ? '' : validatePositiveInteger(item.maxGeneration, `V${item.level} 最大代数`)) ||
      validateRatio(item.ratio, `V${item.level} 奖励分成比例`)

    if (validationMessage) return validationMessage
    if (item.maxGeneration !== null && item.maxGeneration < item.minGeneration) {
      return `V${item.level} 最大代数不能小于最小代数`
    }
  }

  for (const item of nextSettings.distributionLevels) {
    validationMessage =
      validatePositiveInteger(item.teamValidWindowCount, `V${item.level} 团队有效窗口数`, true) ||
      validateRatio(item.ratio, `V${item.level} 分销比例`)

    if (validationMessage) return validationMessage
  }

  visualData.value = nextSettings
  return ''
}

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

      const tierError = validateAndNormalizeMinerTiers()
      if (tierError) {
        ElMessage.error(tierError)
        return
      }

      const generationRatioError = validateAndNormalizeGenerationPerformanceRatios()
      if (generationRatioError) {
        ElMessage.error(generationRatioError)
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
    } else if (form.configKey === 'GOLD_QUANT_SETTINGS') {
      const nextGoldQuantSettings = sanitizeGoldQuantSettings(visualData.value)
      const validationMessage =
        validatePositiveNumber(nextGoldQuantSettings.hostingFee, '托管费金额', true) ||
        validatePositiveNumber(nextGoldQuantSettings.windowMaintenanceFee, '单个窗口维护费', true) ||
        validatePositiveInteger(nextGoldQuantSettings.hostingDays, '托管费延长天数') ||
        validatePositiveInteger(nextGoldQuantSettings.maintenanceDays, '维护费延长天数') ||
        validatePositiveInteger(nextGoldQuantSettings.minerThreshold, '新购窗口最低矿机数', true) ||
        validatePositiveInteger(nextGoldQuantSettings.maxWindowCount, '每用户最多窗口数')

      if (validationMessage) {
        ElMessage.error(validationMessage)
        return
      }

      visualData.value = nextGoldQuantSettings
    } else if (form.configKey === 'GOLD_QUANT_COMMISSION_SETTINGS') {
      const validationMessage = validateAndNormalizeGoldQuantCommissionSettings()
      if (validationMessage) {
        ElMessage.error(validationMessage)
        return
      }
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

.rule-alert {
  margin-bottom: 16px;
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
