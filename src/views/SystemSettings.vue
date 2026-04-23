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
      <el-input
        v-model="queryParams.configName"
        placeholder="搜索配置名称..."
        class="search-input"
        clearable
        @change="handleQuery"
      />
      <el-button :icon="Refresh" @click="handleQuery">刷新列表</el-button>
    </div>

    <section class="content-panel animate-up">
      <el-table :data="configList" border stripe v-loading="loading">
        <el-table-column label="配置名称" width="180">
          <template #default="{ row }">
            <span class="config-name">{{ row.configName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="配置键(Key)" width="240">
          <template #default="{ row }">
            <code class="code-tag">{{ row.configKey }}</code>
          </template>
        </el-table-column>

        <el-table-column label="配置值(Value)" min-width="320">
          <template #default="{ row }">
            <div class="value-preview" @click="openModal(row)">
              {{ formatPreview(row.configValue) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="配置说明" min-width="160" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />

        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openModal(row)">编辑</el-button>
            <el-button
              link
              type="danger"
              :disabled="row.configKey === MINER_CONFIG_KEY"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @current-change="fetchList"
          @size-change="handleQuery"
        />
      </div>
    </section>

    <el-dialog
      v-model="showModal"
      :title="form.id ? '编辑系统配置' : '新增配置项'"
      width="960px"
      destroy-on-close
    >
      <el-form :model="form" label-position="top">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="配置名称">
              <el-input v-model="form.configName" placeholder="例如：矿机全局参数配置" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="配置键(Key)">
              <el-input v-model="form.configKey" :disabled="!!form.id" placeholder="MINER_SYSTEM_SETTINGS" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="配置说明">
              <el-input v-model="form.description" placeholder="配置说明" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="备注">
              <el-input v-model="form.remark" placeholder="描述该配置项的业务用途" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="visual-form-wrapper">
          <div class="form-divider">
            <span>{{ isVisualMode ? '可视化表单模式' : '普通文本模式' }}</span>
          </div>

          <div v-if="form.configKey === MINER_CONFIG_KEY" class="custom-form-box">
            <el-divider content-position="left">基础参数设置</el-divider>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item :label="FIELD_MAP.electricFee">
                  <el-input-number
                    v-model="visualData.electricFee"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item :label="FIELD_MAP.profitTime">
                  <el-time-picker v-model="visualData.profitTime" value-format="HH:mm:ss" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item :label="FIELD_MAP.electricityRewardTime">
                  <el-time-picker
                    v-model="visualData.electricityRewardTime"
                    value-format="HH:mm:ss"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
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

            <el-divider content-position="left">等级与电费分成</el-divider>

            <el-form-item :label="FIELD_MAP.rewardTiers">
              <div class="dynamic-list-container">
                <div v-for="(tier, index) in visualData.tiers" :key="index" class="dynamic-row">
                  <span class="row-label">满</span>
                  <el-input-number
                    v-model="tier.minCount"
                    :min="1"
                    :precision="0"
                    controls-position="right"
                    class="number-input-medium"
                  />
                  <span class="row-label">台，等级</span>
                  <el-input-number
                    v-model="tier.grade"
                    :min="1"
                    :precision="0"
                    controls-position="right"
                    class="number-input-small"
                  />
                  <span class="row-label">，分成比例</span>
                  <el-input-number
                    v-model="tier.rewardRatio"
                    :precision="4"
                    :step="0.01"
                    :max="1"
                    :min="0"
                    controls-position="right"
                    class="number-input-medium"
                  />
                  <el-button :icon="Delete" circle type="danger" link @click="removeTierRow(index)" />
                </div>
                <el-button type="primary" link :icon="Plus" @click="addTierRow" class="add-btn">
                  添加等级
                </el-button>
              </div>
            </el-form-item>

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
                    class="number-input-small"
                  />
                  <span class="row-label">代，业绩比例</span>
                  <el-input-number
                    v-model="item.performanceRatio"
                    :precision="4"
                    :step="0.05"
                    :max="1"
                    :min="0"
                    controls-position="right"
                    class="number-input-medium"
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
              <el-col :xs="24" :sm="8">
                <el-form-item :label="FIELD_MAP.minAmount">
                  <el-input-number v-model="visualData.minAmount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="8">
                <el-form-item :label="FIELD_MAP.feeRate">
                  <el-input-number v-model="visualData.feeRate" :precision="3" :max="1" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="8">
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
              <el-input
                v-model="form.configValue"
                type="textarea"
                :rows="10"
                placeholder="请输入字符串内容；如果是 JSON 配置，请输入 JSON 字符串"
              />
            </el-form-item>
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="showModal = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">确认并保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Plus, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as configApi from '../api/systemConfig'

const MINER_CONFIG_KEY = 'MINER_SYSTEM_SETTINGS'

const DEFAULT_MINER_SETTINGS = {
  profitTime: '23:59:00',
  electricityRewardTime: '23:50:00',
  electricFee: 40,
  smallAreaUnlimitedElectricityReward: false,
  tiers: [
    { grade: 1, minCount: 10, rewardRatio: 0.05 },
    { grade: 2, minCount: 50, rewardRatio: 0.08 }
  ],
  electricityGenerationPerformanceRatios: [
    { generation: 1, performanceRatio: 1 },
    { generation: 2, performanceRatio: 0.7 },
    { generation: 3, performanceRatio: 0.5 },
    { generation: 4, performanceRatio: 0.2 }
  ]
}

const DEFAULT_WITHDRAW_SETTINGS = {
  minAmount: 10,
  feeRate: 0.05,
  uPerCoin: 1
}

const FIELD_MAP = {
  electricFee: '单台矿机电费',
  profitTime: '每日矿机收益时间',
  electricityRewardTime: '每日电费分成时间',
  smallAreaUnlimitedElectricityReward: '小区不限代分成',
  rewardTiers: '等级配置',
  electricityGenerationPerformanceRatios: '代数业绩比例配置',
  minAmount: '最低提现金额(USDT)',
  feeRate: '提现手续费率',
  uPerCoin: '一个币对应多少U'
}

const VISUAL_KEYS = [MINER_CONFIG_KEY, 'WITHDRAW_SETTINGS']

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const configList = ref([])
const total = ref(0)
const visualData = ref({})

const queryParams = reactive({ page: 1, size: 10, configKey: '', configName: '' })
const form = reactive({
  id: null,
  configName: '',
  configKey: '',
  configValue: '',
  description: '',
  remark: ''
})

const isVisualMode = computed(() => VISUAL_KEYS.includes(form.configKey))

const clone = (value) => JSON.parse(JSON.stringify(value))

const toFiniteNumber = (value, fallback = 0) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

const normalizeBoolean = (value, fallback = false) => {
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return fallback
}

const parseConfigValue = (value) => {
  if (!value) return {}
  if (typeof value === 'object') return value
  return JSON.parse(value.replace(/([{,]\s*)(\d+)(\s*:)/g, '$1"$2"$3'))
}

const normalizeMinerTiers = (tiers = DEFAULT_MINER_SETTINGS.tiers) => {
  const source = Array.isArray(tiers) && tiers.length ? tiers : DEFAULT_MINER_SETTINGS.tiers

  return source
    .map((tier, index) => ({
      grade: Number.isInteger(Number(tier?.grade)) && Number(tier.grade) > 0 ? Number(tier.grade) : index + 1,
      minCount: tier?.minCount === undefined || tier?.minCount === null || tier?.minCount === '' ? null : Number(tier.minCount),
      rewardRatio:
        tier?.rewardRatio === undefined || tier?.rewardRatio === null || tier?.rewardRatio === ''
          ? Number(tier?.ratio)
          : Number(tier.rewardRatio)
    }))
    .sort((prev, next) => prev.grade - next.grade)
}

const normalizeGenerationPerformanceRatios = (ratios = DEFAULT_MINER_SETTINGS.electricityGenerationPerformanceRatios) => {
  const source = Array.isArray(ratios) && ratios.length ? ratios : DEFAULT_MINER_SETTINGS.electricityGenerationPerformanceRatios

  return source
    .map((item, index) => ({
      generation:
        Number.isInteger(Number(item?.generation)) && Number(item.generation) > 0 ? Number(item.generation) : index + 1,
      performanceRatio:
        item?.performanceRatio === undefined || item?.performanceRatio === null || item?.performanceRatio === ''
          ? null
          : Number(item.performanceRatio)
    }))
    .sort((prev, next) => prev.generation - next.generation)
}

const sanitizeMinerSettings = (source = {}) => ({
  profitTime: source.profitTime || DEFAULT_MINER_SETTINGS.profitTime,
  electricityRewardTime: source.electricityRewardTime || DEFAULT_MINER_SETTINGS.electricityRewardTime,
  electricFee: toFiniteNumber(source.electricFee, DEFAULT_MINER_SETTINGS.electricFee),
  smallAreaUnlimitedElectricityReward: normalizeBoolean(
    source.smallAreaUnlimitedElectricityReward,
    DEFAULT_MINER_SETTINGS.smallAreaUnlimitedElectricityReward
  ),
  tiers: normalizeMinerTiers(source.tiers),
  electricityGenerationPerformanceRatios: normalizeGenerationPerformanceRatios(
    source.electricityGenerationPerformanceRatios
  )
})

const sanitizeWithdrawSettings = (source = {}) => ({
  minAmount: toFiniteNumber(source.minAmount, DEFAULT_WITHDRAW_SETTINGS.minAmount),
  feeRate: toFiniteNumber(source.feeRate, DEFAULT_WITHDRAW_SETTINGS.feeRate),
  uPerCoin: toFiniteNumber(source.uPerCoin, DEFAULT_WITHDRAW_SETTINGS.uPerCoin)
})

const extractPageData = (res) => {
  const pageData = res?.records ? res : res?.data
  return {
    records: Array.isArray(pageData?.records) ? pageData.records : [],
    total: Number(pageData?.total ?? 0)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await configApi.getConfigPage(queryParams)
    const pageData = extractPageData(res)
    configList.value = pageData.records
    total.value = pageData.total
  } finally {
    loading.value = false
  }
}

const openModal = (row = null) => {
  if (row) {
    Object.assign(form, {
      id: row.id ?? null,
      configName: row.configName ?? '',
      configKey: row.configKey ?? '',
      configValue: row.configValue ?? '',
      description: row.description ?? '',
      remark: row.remark ?? ''
    })

    if (isVisualMode.value) {
      try {
        const parsed = parseConfigValue(form.configValue)
        visualData.value = form.configKey === MINER_CONFIG_KEY ? sanitizeMinerSettings(parsed) : sanitizeWithdrawSettings(parsed)
      } catch (error) {
        console.error('JSON 解析失败:', error)
        visualData.value = form.configKey === MINER_CONFIG_KEY ? sanitizeMinerSettings() : sanitizeWithdrawSettings()
        ElMessage.warning('当前配置值不是合法 JSON，已加载默认表单')
      }
    }
  } else {
    Object.assign(form, {
      id: null,
      configName: '',
      configKey: '',
      configValue: '',
      description: '',
      remark: ''
    })
    visualData.value = sanitizeMinerSettings(clone(DEFAULT_MINER_SETTINGS))
  }

  showModal.value = true
}

const addTierRow = () => {
  if (!Array.isArray(visualData.value.tiers)) visualData.value.tiers = []
  const maxGrade = visualData.value.tiers.reduce((max, tier) => Math.max(max, Number(tier.grade) || 0), 0)
  visualData.value.tiers.push({ grade: maxGrade + 1, minCount: null, rewardRatio: null })
}

const removeTierRow = (index) => {
  visualData.value.tiers.splice(index, 1)
}

const addGenerationRatioRow = () => {
  if (!Array.isArray(visualData.value.electricityGenerationPerformanceRatios)) {
    visualData.value.electricityGenerationPerformanceRatios = []
  }
  const maxGeneration = visualData.value.electricityGenerationPerformanceRatios.reduce(
    (max, item) => Math.max(max, Number(item.generation) || 0),
    0
  )
  visualData.value.electricityGenerationPerformanceRatios.push({
    generation: maxGeneration + 1,
    performanceRatio: null
  })
}

const removeGenerationRatioRow = (index) => {
  visualData.value.electricityGenerationPerformanceRatios.splice(index, 1)
}

const validateUniquePositiveIntegers = (items, key, duplicateMessage, invalidMessage) => {
  const valueSet = new Set()

  for (const item of items) {
    const value = Number(item[key])
    if (!Number.isInteger(value) || value <= 0) return invalidMessage
    if (valueSet.has(value)) return duplicateMessage
    valueSet.add(value)
  }

  return ''
}

const validateMinerSettings = () => {
  const nextSettings = sanitizeMinerSettings(visualData.value)

  if (!nextSettings.profitTime) return '每日矿机收益时间不能为空'
  if (!nextSettings.electricityRewardTime) return '每日电费分成时间不能为空'
  if (!Number.isFinite(nextSettings.electricFee) || nextSettings.electricFee < 0) return '单台矿机电费必须大于等于 0'

  if (!nextSettings.tiers.length) return '等级配置不能为空'

  const tierKeyError = validateUniquePositiveIntegers(
    nextSettings.tiers,
    'grade',
    '等级不允许重复',
    '等级必须为大于 0 的整数'
  )
  if (tierKeyError) return tierKeyError

  const minCountError = validateUniquePositiveIntegers(
    nextSettings.tiers,
    'minCount',
    '矿机数量门槛不允许重复',
    '团队有效矿机数量门槛必须为大于 0 的整数'
  )
  if (minCountError) return minCountError

  for (const tier of nextSettings.tiers) {
    if (!Number.isFinite(tier.rewardRatio) || tier.rewardRatio < 0 || tier.rewardRatio > 1) {
      return `等级 ${tier.grade} 的分成比例必须在 0 到 1 之间`
    }
  }

  if (!nextSettings.electricityGenerationPerformanceRatios.length) return '代数业绩比例配置不能为空'

  const generationError = validateUniquePositiveIntegers(
    nextSettings.electricityGenerationPerformanceRatios,
    'generation',
    '代数不允许重复',
    '代数必须为大于 0 的整数'
  )
  if (generationError) return generationError

  for (const item of nextSettings.electricityGenerationPerformanceRatios) {
    if (!Number.isFinite(item.performanceRatio) || item.performanceRatio < 0 || item.performanceRatio > 1) {
      return `第 ${item.generation} 代业绩比例必须在 0 到 1 之间`
    }
  }

  visualData.value = nextSettings
  return ''
}

const submitForm = async () => {
  if (!form.configKey.trim()) {
    ElMessage.error('配置键不能为空')
    return
  }

  if (isVisualMode.value) {
    if (form.configKey === MINER_CONFIG_KEY) {
      const errorMessage = validateMinerSettings()
      if (errorMessage) {
        ElMessage.error(errorMessage)
        return
      }
    } else if (form.configKey === 'WITHDRAW_SETTINGS') {
      const nextWithdrawSettings = sanitizeWithdrawSettings(visualData.value)
      if (!Number.isFinite(nextWithdrawSettings.uPerCoin) || nextWithdrawSettings.uPerCoin <= 0) {
        ElMessage.error('一个币对应多少U必须大于 0')
        return
      }

      visualData.value = nextWithdrawSettings
    }

    form.configValue = JSON.stringify(visualData.value)
  } else if (typeof form.configValue !== 'string') {
    form.configValue = String(form.configValue ?? '')
  }

  saving.value = true
  try {
    await configApi.saveOrUpdateConfig({ ...form })
    ElMessage.success('配置已保存成功')
    showModal.value = false
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row) => {
  if (row.configKey === MINER_CONFIG_KEY) {
    ElMessage.warning('不建议删除矿机全局参数配置')
    return
  }

  try {
    await ElMessageBox.confirm(`确定删除配置「${row.configName || row.configKey}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await configApi.deleteConfig(row.id)
    ElMessage.success('配置已删除')
    fetchList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleQuery = () => {
  queryParams.page = 1
  fetchList()
}

const formatPreview = (value) => {
  if (!value) return '-'
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > 80 ? `${text.substring(0, 80)}...` : text
}

onMounted(() => {
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
  flex-wrap: wrap;
  gap: 12px;
  background: var(--el-bg-color);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  margin-bottom: 20px;
}

.search-input {
  width: 280px;
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

.rule-alert {
  margin-bottom: 16px;
}

.dynamic-list-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--el-fill-color-lighter);
  padding: 15px;
  border-radius: 6px;
  min-height: 72px;
  width: 100%;
}

.dynamic-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.row-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.number-input-small {
  width: 110px;
}

.number-input-medium {
  width: 160px;
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

@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .search-input {
    width: 100%;
  }
}
</style>
