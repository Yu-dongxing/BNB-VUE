<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { 
  Search, Refresh, Plus, Edit, Delete, 
  Check, ArrowLeft, Management 
} from '@element-plus/icons-vue'
import { 
  getBatchList, addBatch, updateBatch, 
  deleteBatch, activeBatch 
} from "../api/card.js"

// --- 数据定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  page: 1,
  size: 10,
  batchName: '',
  batchNo: '',
  status: null,
  isCurrent: null
})

// 弹窗控制
const dialog = reactive({
  visible: false,
  title: '',
  type: 'add'
})

const calculatePercentage = (sold, total) => {
  if (!total || total <= 0) return 0;
  const percentage = (sold / total) * 100;
  
  // 如果有销量但百分比太小（比如 0.001%），返回 0.1 以便进度条有一点点颜色
  if (sold > 0 && percentage < 0.1) return 0.1;
  
  // 保留两位小数，并确保最高不超过 100
  return Math.min(parseFloat(percentage.toFixed(2)), 100);
}

// 表单数据
const cardForm = reactive({
  id: null,
  batchName: '',
  batchNo: '',
  totalSupply: 0,
  unitPrice: 0,
  status: 1,
  remark: ''
})

const formRef = ref(null)
const rules = {
  batchName: [{ required: true, message: '请输入批次名称', trigger: 'blur' }],
  batchNo: [{ required: true, message: '请输入批次编号', trigger: 'blur' }],
  totalSupply: [{ required: true, message: '请输入发行总量', trigger: 'blur' }],
  unitPrice: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

// --- 逻辑方法 ---

const getList = async () => {
  loading.value = true
  try {
    const res = await getBatchList(queryParams)
    const result = typeof res === 'string' ? JSON.parse(res) : res
    if (result.code === 200) {
      tableData.value = result.data.records
      total.value = result.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { queryParams.page = 1; getList(); }

const resetQuery = () => {
  queryParams.batchName = ''; queryParams.batchNo = '';
  queryParams.status = null; queryParams.isCurrent = null;
  handleSearch()
}

// 打开新增/编辑弹窗
const openDialog = (type, row) => {
  dialog.type = type
  dialog.title = type === 'add' ? '新增发行批次' : '编辑批次'
  if (type === 'edit') {
    Object.assign(cardForm, row)
  } else {
    Object.assign(cardForm, { id: null, batchName: '', batchNo: '', totalSupply: 1000, unitPrice: 1, status: 1, remark: '' })
  }
  dialog.visible = true
}

const submitForm = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      const apiCall = dialog.type === 'add' ? addBatch : updateBatch
      const res = await apiCall(cardForm)
      const result = typeof res === 'string' ? JSON.parse(res) : res
      if (result.code === 200) {
        ElMessage.success(result.message)
        dialog.visible = false
        getList()
      }
    }
  })
}

// 激活批次
const handleActive = (row) => {
  ElMessageBox.confirm(`确定要激活批次 "${row.batchName}" 吗？激活后其他批次将自动取消激活。`, '系统提示', {
    type: 'warning'
  }).then(async () => {
    const res = await activeBatch(row.id)
    const result = typeof res === 'string' ? JSON.parse(res) : res
    if (result.code === 200) {
      ElMessage.success('激活成功')
      getList()
    }
  })
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除该批次吗？', '警告', { type: 'error' }).then(async () => {
    const res = await deleteBatch(row.id)
    const result = typeof res === 'string' ? JSON.parse(res) : res
    if (result.code === 200) {
      ElMessage.success('删除成功')
      getList()
    }
  })
}

onMounted(() => getList())
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <p class="eyebrow">卡牌发行管理</p>
      </div>
      <div class="header-actions">
        <el-button @click="$router.push('/')" :icon="ArrowLeft">返回首页</el-button>
        <el-button type="primary" :icon="Plus" @click="openDialog('add')">新增批次</el-button>
      </div>
    </header>
<!--     <el-alert
      title="数据免责声明"
      type="warning"
      description="该界面的已售卡牌数据仅作为系统内部业务记录参考，实际卡牌持有量及交易记录请以区块链链上查询数据为准。"
      show-icon
      :closable="false"
      class="data-disclaimer"
    /> -->

    <!-- 筛选栏 -->
    <section class="search-panel">
      <el-form :model="queryParams" inline>
        <el-form-item label="批次名称">
          <el-input v-model="queryParams.batchName" placeholder="批次名" clearable />
        </el-form-item>
        <el-form-item label="批次编号">
          <el-input v-model="queryParams.batchNo" placeholder="BNO." clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="启用状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <!-- 表格 -->
    <section class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column label="激活状态" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.isCurrent === 1" type="success" effect="dark">当前激活</el-tag>
            <el-tag v-else type="info" effect="plain">未激活</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="batchName" label="批次名称" />
        <el-table-column prop="batchNo" label="批次编号"/>
        <el-table-column prop="unitPrice" label="单价(USDT)" >
          <template #default="scope">
            <span class="price-text">{{ scope.row.unitPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column label="销售进度 (已售/总量)" width="220">
  <template #default="scope">
    <div class="progress-box">
      <!-- 使用 calculatePercentage 方法 -->
      <!-- 增加 :format 属性来自定义显示文字 -->
      <el-progress 
        :percentage="calculatePercentage(scope.row.soldCount, scope.row.totalSupply)" 
        :stroke-width="14"
        :status="scope.row.inventory === 0 ? 'exception' : (scope.row.isCurrent ? 'success' : '')"
      />
      <div class="progress-info">
        <span class="count-text">{{ scope.row.soldCount }} / {{ scope.row.totalSupply }}</span>
        <span class="percent-text">{{ ((scope.row.soldCount / scope.row.totalSupply) * 100).toFixed(2) }}%</span>
      </div>
    </div>
  </template>
</el-table-column>
        <el-table-column prop="inventory" label="剩余库存" width="100" align="center" />
        <el-table-column label="启用状态" width="100" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0" disabled />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button link type="success" :icon="Check" :disabled="scope.row.isCurrent === 1" @click="handleActive(scope.row)">激活</el-button>
            <el-button link type="primary" :icon="Edit" @click="openDialog('edit', scope.row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-box">
        <el-pagination v-model:current-page="queryParams.page" :total="total" layout="total, prev, pager, next" @current-change="getList" />
      </div>
    </section>

    <!-- 表单弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px">
      <el-form :model="cardForm" :rules="rules" ref="formRef" >
        <el-form-item label="批次名称" prop="batchName">
          <el-input v-model="cardForm.batchName" />
        </el-form-item>
        <el-form-item label="发行总量" prop="totalSupply">
          <el-input-number v-model="cardForm.totalSupply" :min="1" />
        </el-form-item>
        <el-form-item label="剩余库存" prop="inventory">
          <el-input-number v-model="cardForm.inventory" :min="1" />
        </el-form-item>
        <!-- :disabled="dialog.type === 'edit'" -->
        <el-form-item label="销售单价" prop="unitPrice">
          <el-input-number v-model="cardForm.unitPrice" :precision="2" :step="0.1" :min="0" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-radio-group v-model="cardForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="cardForm.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
.search-panel { background: var(--el-bg-color); padding: 20px; border-radius: 12px; border: 1px solid var(--el-border-color-light); margin-bottom: 20px; }
.table-container { background: var(--el-bg-color); padding: 20px; border-radius: 12px; border: 1px solid var(--el-border-color-light); }
.price-text { font-weight: bold; color: var(--el-color-warning); }
.progress-box { width: 100%; padding: 4px 0; }
.progress-info { display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px; color: var(--el-text-color-secondary); }
</style>