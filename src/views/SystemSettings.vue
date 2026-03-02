<template>
  <div class="page-container">
    <!-- 1. 顶部标题 -->
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">GLOBAL SYSTEM CONFIGURATION</p>
        <h1>系统全局配置</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="openModal()">新增配置项</el-button>
      </div>
    </header>

    <!-- 2. 搜索过滤 -->
    <div class="filter-card animate-up">
      <el-input
        v-model="queryParams.configKey"
        placeholder="搜索配置键 (Key)..."
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

    <!-- 3. 配置列表 -->
    <section class="content-panel animate-up">
      <el-table :data="configList" border stripe v-loading="loading">
        <el-table-column label="配置名称" width="180">
          <template #default="scope">
            <span class="config-name">{{ scope.row.configName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="配置键 (Key)" width="220">
          <template #default="scope">
            <code class="code-tag">{{ scope.row.configKey }}</code>
          </template>
        </el-table-column>

        <el-table-column label="配置数值 (Value)" min-width="300">
          <template #default="scope">
            <div class="value-preview" @click="openModal(scope.row)">
              {{ formatPreview(scope.row.configValue) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="作用说明" min-width="200" />

        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openModal(scope.row)">编辑</el-button>
            <!-- <el-divider direction="vertical" />
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button> -->
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

    <!-- 4. 可视化编辑弹窗 -->
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
            <el-form-item label="配置键 (Key)">
              <el-input v-model="form.configKey" :disabled="!!form.id" placeholder="UNIQUE_KEY" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="作用说明/备注">
          <el-input v-model="form.remark" placeholder="描述此配置的具体用途" />
        </el-form-item>

        <!-- 可视化逻辑分发 -->
        <div class="visual-form-wrapper">
          <div class="form-divider">
            <span>{{ isVisualMode ? '可视化表单模式' : '普通文本模式' }}</span>
          </div>

          <!-- A. 矿机参数设置可视化 -->
          <div v-if="form.configKey === 'MINER_SYSTEM_SETTINGS'" class="custom-form-box">
            <el-divider content-position="left">基础参数设置</el-divider>
            
            <!-- 第一排：核心费用与兑换比例 -->
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.electricFee">
                  <el-input-number v-model="visualData.electricFee" :precision="2" :step="0.1" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.accelerationFee">
                  <el-input-number v-model="visualData.accelerationFee" :precision="2" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.fragmentToCardRate">
                  <el-input-number v-model="visualData.fragmentToCardRate" :precision="0" :min="1" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第二排：时间设置 -->
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.profitTime">
                  <el-time-picker v-model="visualData.profitTime" value-format="HH:mm:ss" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="FIELD_MAP.electricityRewardTime">
                  <el-time-picker v-model="visualData.electricityRewardTime" value-format="HH:mm:ss" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">分成与阶梯奖励配置</el-divider>

            <el-row :gutter="40">
              <!-- 1. 电费分成阶梯 -->
              <el-col >
                <el-form-item :label="FIELD_MAP.rewardTiers">
                  <div class="dynamic-list-container">
                    <div v-for="(tier, index) in visualData.tiers" :key="index" class="dynamic-row">
                      <span class="row-label">满</span>
                      <el-input-number v-model="tier.minCount" :min="0" :precision="0" controls-position="right"  />
                      <span class="row-label">台, 奖</span>
                      <el-input-number v-model="tier.ratio" :precision="3" :step="0.01" :max="1" :min="0" />
                      <el-button :icon="Delete" circle type="danger" link @click="removeTierRow(index)" />
                    </div>
                    <el-button type="primary" link :icon="Plus" @click="addTierRow" class="add-btn">添加阶梯门槛</el-button>
                  </div>
                </el-form-item>
              </el-col>

              <!-- 2. 分销比例 -->
              <!-- <el-col :span="12">
                <el-form-item :label="FIELD_MAP.distributionRatios">
                  <div class="dynamic-list-container">
                    <div v-for="(item, index) in tempRatios" :key="index" class="dynamic-row">
                      <span class="row-label">第</span>
                      <el-input v-model="item.level" placeholder="层级" style="width: 60px" />
                      <span class="row-label">层比例:</span>
                      <el-input-number v-model="item.ratio" :precision="3" :step="0.01" :max="1" :min="0" style="width: 100px" />
                      <el-button :icon="Delete" circle type="danger" link @click="removeRatioRow(index)" />
                    </div>
                    <el-button type="primary" link :icon="Plus" @click="addRatioRow" class="add-btn">添加分销层级</el-button>
                  </div>
                </el-form-item>
              </el-col> -->
            </el-row>
          </div>

          <!-- B. 提现参数可视化 -->
          <div v-else-if="form.configKey === 'WITHDRAW_SETTINGS'" class="custom-form-box">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="FIELD_MAP.minAmount">
                  <el-input-number v-model="visualData.minAmount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="FIELD_MAP.feeRate">
                  <el-input-number v-model="visualData.feeRate" :precision="3" :max="1" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- C. 默认普通文本编辑 -->
          <div v-else>
            <el-form-item label="配置值内容 (JSON/Text)">
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
import { ref, reactive, onMounted, computed } from 'vue';
import { Search, Plus, Refresh, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as configApi from '../api/systemConfig';

// 1. 配置映射表
const FIELD_MAP = {
  electricFee: "电费单价 (USDT)",
  accelerationFee: "加速包价格 (USDT)",
  profitTime: "矿机执行结算时间",
  electricityRewardTime: "电费分成结算时间",
  distributionRatios: "分销分润比例 (Map)",
  rewardTiers: "下级电费分成阶梯",
  minAmount: "起提金额 (USDT)",
  feeRate: "提现手续费率",
  fragmentToCardRate: "碎片兑换比例 (张/卡)"
};

// 开启可视化编辑的 Key
const VISUAL_KEYS = ['MINER_SYSTEM_SETTINGS', 'WITHDRAW_SETTINGS'];

// 2. 状态变量
const loading = ref(false);
const showModal = ref(false);
const configList = ref([]);
const total = ref(0);
const visualData = ref({});    
const tempRatios = ref([]);    

const queryParams = reactive({ page: 1, size: 10, configKey: '' });
const form = reactive({ id: null, configName: '', configKey: '', configValue: '', remark: '' });

// 3. 计算属性：当前是否为可视化模式
const isVisualMode = computed(() => VISUAL_KEYS.includes(form.configKey));

// 4. 获取列表数据
const fetchList = async () => {
  loading.value = true;
  try {
    const res = await configApi.getConfigPage(queryParams);
    if (res && res.records) {
      configList.value = res.records;
      total.value = res.total;
    }
  } finally {
    loading.value = false;
  }
};

// 5. 打开并解析弹窗数据
const openModal = (row = null) => {
  if (row) {
    Object.assign(form, JSON.parse(JSON.stringify(row)));
    
    if (isVisualMode.value) {
      try {
        // 自动修复：处理非标准 JSON 字符串（处理 Map 类型的数字 Key）
        const fixedStr = form.configValue.replace(/([{,]\s*)(\d+)(\s*:)/g, '$1"$2"$3');
        const parsed = JSON.parse(fixedStr);
        
        // 初始化/修复后端新增字段默认值
        if (!parsed.tiers) parsed.tiers = [];
        if (!parsed.electricityRewardTime) parsed.electricityRewardTime = "23:50:00";
        if (!parsed.profitTime) parsed.profitTime = "23:59:00";
        if (parsed.fragmentToCardRate === undefined) parsed.fragmentToCardRate = 100;
        
        visualData.value = parsed;
        
        // 处理 Map 结构映射到 UI 列表
        if (form.configKey === 'MINER_SYSTEM_SETTINGS' && visualData.value.distributionRatios) {
          tempRatios.value = Object.entries(visualData.value.distributionRatios).map(([k, v]) => ({
            level: k, ratio: v
          }));
        } else {
          tempRatios.value = []; 
        }
      } catch (e) {
        console.error("JSON 解析失败:", e);
        visualData.value = { tiers: [], fragmentToCardRate: 100 };
        tempRatios.value = [];
      }
    }
  } else {
    // 新增项初始化
    Object.assign(form, { id: null, configName: '', configKey: '', configValue: '', remark: '' });
    visualData.value = { 
      tiers: [], 
      distributionRatios: {}, 
      fragmentToCardRate: 100,
      profitTime: "23:59:00",
      electricityRewardTime: "23:50:00",
      electricFee: 0,
      accelerationFee: 0
    };
    tempRatios.value = [];
  }
  showModal.value = true;
};

// 分层分润比例 (Map 结构处理)
const addRatioRow = () => {
  tempRatios.value.push({ level: (tempRatios.value.length + 1).toString(), ratio: 0 });
};
const removeRatioRow = (index) => {
  tempRatios.value.splice(index, 1);
};

// 电费分成阶梯 (List 结构处理)
const addTierRow = () => {
  if (!visualData.value.tiers) visualData.value.tiers = [];
  visualData.value.tiers.push({ minCount: 0, ratio: 0 });
};
const removeTierRow = (index) => {
  visualData.value.tiers.splice(index, 1);
};

// 提交逻辑
const submitForm = async () => {
  if (isVisualMode.value) {
    if (form.configKey === 'MINER_SYSTEM_SETTINGS') {
      const ratioMap = {};
      tempRatios.value.forEach(item => {
        if (item.level) ratioMap[item.level] = item.ratio;
      });
      visualData.value.distributionRatios = ratioMap;
    }
    form.configValue = JSON.stringify(visualData.value);
  }

  try {
    await configApi.saveOrUpdateConfig(form);
    ElMessage.success('配置已保存成功');
    showModal.value = false;
    fetchList();
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  }
};

const handleQuery = () => { queryParams.page = 1; fetchList(); };

const formatPreview = (val) => {
  if (!val) return '-';
  return val.length > 60 ? val.substring(0, 60) + '...' : val;
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除配置项 [${row.configName}] 吗?`, '危险操作', { 
    type: 'error',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  }).then(async () => {
    await configApi.deleteConfig(row.id);
    ElMessage.success('删除成功');
    fetchList();
  }).catch(() => {});
};

onMounted(fetchList);
</script>

<style scoped>
.page-container { padding: 20px; }
.page-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: flex-end; 
  margin-bottom: 24px; 
}
.header-left h1 { font-size: 24px; margin: 5px 0 0; color: var(--el-text-color-primary); }
.eyebrow { font-size: 12px; color: var(--el-text-color-placeholder); letter-spacing: 1.5px; text-transform: uppercase; }

.filter-card { 
  display: flex; 
  gap: 12px; 
  background: var(--el-bg-color); 
  padding: 16px; 
  border-radius: 8px; 
  border: 1px solid var(--el-border-color-light); 
  margin-bottom: 20px; 
}
.search-input { width: 320px; }

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
.value-preview:hover { border-color: var(--el-color-primary); background: var(--el-fill-color); }

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
.add-btn { width: fit-content; margin-top: 5px; }

.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }

.animate-up { animation: fadeInUp 0.4s ease-out; }
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.config-name { font-weight: 600; }
</style>