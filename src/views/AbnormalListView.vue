<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Refresh, Cpu, Warning, 
  Check, Timer, Bell, Connection, User, Setting 
} from '@element-plus/icons-vue'
import { getAbnormalList, postManualSuccess } from "../api/abnormal.js"

// --- 1. 状态映射 (适配后端 Enum 类) ---

// 异常主状态 (err_status)
const abnormalStatusMap = {
  2000: { text: '正常', type: 'info' },
  4000: { text: '待自动处理', type: 'warning' },
  4001: { text: '需人工处理', type: 'danger' },
  2001: { text: '自动处理成功', type: 'success' },
  2002: { text: '人工处理成功', type: 'success' }
}

// 人工处理子状态 (err_submit_manual_status)
const manualStatusMap = {
  2000: { text: '人工已提交', type: 'info' },
  4000: { text: '提交异常', type: 'danger' },
  4002: { text: '处理成功', type: 'success' }
}

// --- 2. 状态定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const serviceOptions = ref([])
const columnComments = ref({})

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  serviceName: '',
  errStatus: null // 对应 AbnormalStatus.code
})

// --- 3. 核心逻辑 ---

const getList = async () => {
  loading.value = true
  try {
    const res = await getAbnormalList(queryParams)
    const result = typeof res === 'string' ? JSON.parse(res) : res
    if (result.code === 200 || result.records) {
      const data = result.data || result
      tableData.value = data.records
      total.value = data.total
      serviceOptions.value = data.serviceNames
      columnComments.value = data.columnComments
    }
  } catch (e) {
    ElMessage.error("获取异常数据失败")
  } finally {
    loading.value = false
  }
}

// 翻译字段名
const translateKey = (tableName, key) => {
  return columnComments.value[tableName]?.[key] || key
}

// 过滤掉不需要在详情描述中重复展示的系统字段
const isCoreField = (key) => {
  const cores = [
    'id', 'table', 'serviceName', 'err_status', 'manualSuccessRoute', 
    'chain_response', 'create_time', 'update_time', 'err_start_time',
    'err_retry_count', 'err_manual_notify_count', 'err_next_remind_staff_time',
    'err_submit_manual_status', 'err_min_interval', 'err_timeout'
  ];
  return cores.includes(key);
}

// 人工成功回调
const handleManualSuccess = (row) => {
  ElMessageBox.confirm(
    `确定手动完成该笔异常吗？\n业务模块：${row.serviceName}\n来源表：${row.table} (ID: ${row.id})`,
    '人工确认成功',
    {
      confirmButtonText: '确认成功',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true
    }
  ).then(async () => {
    try {
      loading.value = true
      const res = await postManualSuccess(row.manualSuccessRoute, row.id)
      const result = typeof res === 'string' ? JSON.parse(res) : res
      if (result.code === 200) {
        ElMessage.success("已标记为人工处理成功")
        getList()
      }
    } finally {
      loading.value = false
    }
  })
}

// 格式化时间显示
const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').split('.')[0]
}

onMounted(() => getList())
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">EXCEPTION CORE</p>
        <h2 class="title">异常记录管理</h2>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="getList" :loading="loading">刷新列表</el-button>
      </div>
    </header>

    <!-- 搜索栏 -->
    <section class="search-panel">
      <el-form :model="queryParams" inline>
        <el-form-item label="服务模块">
          <el-select v-model="queryParams.serviceName" placeholder="全部模块" clearable style="width: 200px">
            <el-option v-for="item in serviceOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常状态">
          <el-select v-model="queryParams.errStatus" placeholder="选择状态" clearable style="width: 180px">
            <!-- 对应后端 AbnormalStatus 枚举 -->
            <el-option v-for="(v, k) in abnormalStatusMap" :key="k" :label="v.text" :value="Number(k)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="queryParams.pageNum = 1; getList()">查询</el-button>
          <el-button @click="queryParams.serviceName=''; queryParams.errStatus=null; getList()">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <!-- 主表格 -->
    <section class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <!-- 详情展开 -->
        <el-table-column type="expand">
          <template #default="props">
            <div class="detail-wrapper">
              <!-- 核心控制参数描述 -->
              <el-descriptions title="调度参数" :column="4" size="small" border class="mb-20">
                <el-descriptions-item label="主状态">
                  <el-tag :type="abnormalStatusMap[props.row.err_status]?.type" size="small">
                    {{ abnormalStatusMap[props.row.err_status]?.text }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="人工状态">
                  <el-tag v-if="props.row.err_submit_manual_status" :type="manualStatusMap[props.row.err_submit_manual_status]?.type" size="small">
                    {{ manualStatusMap[props.row.err_submit_manual_status]?.text }}
                  </el-tag>
                  <span v-else>--</span>
                </el-descriptions-item>
                <el-descriptions-item label="重试间隔">{{ props.row.err_min_interval || 0 }}s</el-descriptions-item>
                <el-descriptions-item label="超时限制">{{ props.row.err_timeout || 0 }}s</el-descriptions-item>
              </el-descriptions>

              <!-- 动态业务数据展示 -->
              <el-descriptions title="业务原始字段" :column="3" size="small" border>
                <template v-for="(val, key) in props.row" :key="key">
                  <el-descriptions-item 
                    v-if="!isCoreField(key) && val !== null" 
                    :label="translateKey(props.row.table, key)"
                  >
                    <span :class="{ 'tx-hash': key === 'tx_id' }">{{ val }}</span>
                  </el-descriptions-item>
                </template>
              </el-descriptions>

              <!-- 链上响应回执 -->
              <div v-if="props.row.chain_response" class="chain-box">
                <p class="chain-title"><el-icon><Connection /></el-icon> 链上响应原始 JSON</p>
                <pre class="code-block">{{ JSON.parse(props.row.chain_response) }}</pre>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 主表列 -->
        <el-table-column prop="id" label="ID" width="70" align="center" />
        
        <el-table-column label="服务模块" min-width="160">
          <template #default="{row}">
            <div class="service-cell">
              <el-icon class="icon"><Cpu /></el-icon>
              <div class="texts">
                <span class="main">{{ row.serviceName }}</span>
                <span class="sub">{{ row.table }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="主状态" width="130" align="center">
          <template #default="{row}">
            <el-tag :type="abnormalStatusMap[row.err_status]?.type" effect="dark">
              {{ abnormalStatusMap[row.err_status]?.text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="处理进度" width="160">
          <template #default="{row}">
            <div class="progress-cell">
              <div class="item">
                <span class="label">重试次数:</span>
                <el-tag size="small" round :type="row.err_retry_count > 5 ? 'danger' : 'info'">{{ row.err_retry_count }}</el-tag>
              </div>
              <div class="item">
                <span class="label">通知人工:</span>
                <el-tag size="small" round type="warning">{{ row.err_manual_notify_count }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="时间节点" width="220">
          <template #default="{row}">
            <div class="time-info">
              <p><el-icon><Timer /></el-icon> 发生: {{ formatTime(row.err_start_time) }}</p>
              <p v-if="row.err_next_remind_staff_time" class="remind">
                <el-icon><Bell /></el-icon> 提醒: {{ formatTime(row.err_next_remind_staff_time) }}
              </p>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="scope">
            <!-- 逻辑：只有当状态是 需人工处理(4001) 或 待自动(4000) 时，才显示操作 -->
            <el-button 
              v-if="scope.row.err_status >= 4000"
              type="danger" 
              link 
              :icon="Check" 
              @click="handleManualSuccess(scope.row)"
            >
              手动成功
            </el-button>
            <el-tag v-else type="success" link>已结单</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-box">
        <el-pagination 
          v-model:current-page="queryParams.pageNum" 
          :total="total" 
          :page-size="queryParams.pageSize"
          layout="total, prev, pager, next" 
          @current-change="getList" 
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 样式完美适配暗黑/亮色模式 */
.page-header { margin-bottom: 24px; }
.eyebrow { color: var(--el-color-primary); font-size: 12px; font-weight: bold; margin-bottom: 4px; letter-spacing: 1px; }
.title { margin: 0; font-size: 24px; color: var(--el-text-color-primary); }

.search-panel { 
  background: var(--el-bg-color); 
  padding: 24px; 
  border-radius: 12px; 
  border: 1px solid var(--el-border-color-light); 
  margin-bottom: 20px;
  box-shadow: var(--el-box-shadow-light);
}

.table-container { 
  background: var(--el-bg-color); 
  padding: 20px; 
  border-radius: 12px; 
  border: 1px solid var(--el-border-color-light); 
  box-shadow: var(--el-box-shadow-light);
}

/* 服务模块单元格 */
.service-cell { display: flex; align-items: center; gap: 12px; }
.service-cell .icon { font-size: 20px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); padding: 8px; border-radius: 8px; }
.service-cell .texts { display: flex; flex-direction: column; }
.service-cell .main { font-weight: bold; font-size: 14px; color: var(--el-text-color-primary); }
.service-cell .sub { font-size: 11px; color: var(--el-text-color-placeholder); }

/* 进度单元格 */
.progress-cell .item { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.progress-cell .label { font-size: 12px; color: var(--el-text-color-secondary); }

/* 时间单元格 */
.time-info { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.6; }
.time-info p { margin: 0; display: flex; align-items: center; gap: 4px; }
.time-info .remind { color: var(--el-color-warning); margin-top: 2px; }

/* 详情区域 */
.detail-wrapper { padding: 20px; background: var(--el-fill-color-blank); border-radius: 8px; }
.mb-20 { margin-bottom: 20px; }
.tx-hash { font-family: 'Courier New', monospace; color: var(--el-color-success); font-weight: bold; background: var(--el-color-success-light-9); padding: 2px 6px; border-radius: 4px; }

/* 代码块样式 */
.chain-box { margin-top: 20px; }
.chain-title { font-size: 13px; font-weight: bold; color: var(--el-text-color-primary); margin-bottom: 8px; }
.code-block { 
  background: #1a1a1a; color: #addb67; padding: 16px; border-radius: 8px; 
  font-family: 'Cascadia Code', monospace; font-size: 12px; line-height: 1.5;
  overflow-x: auto; white-space: pre-wrap; border: 1px solid #333;
}

.pagination-box { margin-top: 24px; display: flex; justify-content: flex-end; }
</style>