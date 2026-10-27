<template>
  <PageContainer>
    <template #header>
      <PageHeader
        :title="$t('pages.httpTest')"
        :loading="loading"
        @start-test="startTest"
        @clear-results="clearResults"
        @from-favorites="showFavorites = true"
      />
    </template>

    <!-- 输入区域 -->
    <AddressInputList
      v-model="urlList"
      :title="$t('form.urlList')"
      :placeholder="$t('placeholder.enterUrl')"
      :add-button-text="$t('buttons.add') + 'URL'"
      value-key="url"
      @batch-add="showBatchAdd = true"
      @from-favorites="showFavorites = true"
    />

    <!-- 测试选项 -->
    <el-form :model="form" label-position="top">
      <el-form-item :label="$t('form.testOptions')">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="$t('form.method')">
              <el-select v-model="form.method" :placeholder="$t('placeholder.selectMethod')">
                <el-option :label="$t('testOptions.getMethod')" value="GET" />
                <el-option :label="$t('testOptions.postMethod')" value="POST" />
                <el-option :label="$t('testOptions.headMethod')" value="HEAD" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('form.timeout') + '(' + $t('common.seconds') + ')'">
              <el-input-number
                v-model="form.timeout"
                :min="1"
                :max="60"
                :step="1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('form.retries')">
              <el-input-number
                v-model="form.retries"
                :min="0"
                :max="5"
                :step="1"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>

    <!-- 结果表格 -->
    <ResultsTable
      :data="results"
      :columns="tableColumns"
      address-key="url"
      @add-to-favorites="addToFavorites"
    >
      <template #status="{ row }">
        <el-tag
          :type="getStatusType(row.status)"
          size="small"
        >
          {{ row.status }}
        </el-tag>
      </template>
    </ResultsTable>

    <template #dialogs>
      <!-- 收藏夹对话框 -->
      <FavoritesDialog
        v-model="showFavorites"
        @selected="handleFavoritesSelected"
      />

      <!-- 批量添加对话框 -->
      <BatchAddDialog
        v-model="showBatchAdd"
        :title="$t('buttons.batchAdd') + 'URL'"
        :placeholder="$t('placeholder.batchAdd')"
        @confirm="handleBatchAdd"
      />
    </template>
  </PageContainer>
</template>

<script setup>
import { ref, reactive, inject } from 'vue'
import { ElMessage } from 'element-plus'
import storageService from '../services/storage'
import {
  PageContainer,
  PageHeader,
  AddressInputList,
  ResultsTable,
  FavoritesDialog,
  BatchAddDialog
} from '../components'

// 注入国际化服务
const $t = inject('$t')

// URL列表
const urlList = ref([
  { id: Date.now(), url: '' }
])

// 表单数据
const form = reactive({
  method: 'GET',
  timeout: 10,
  retries: 1
})

// 状态变量
const loading = ref(false)
const results = ref([])
const showFavorites = ref(false)
const showBatchAdd = ref(false)

// 表格列配置
const tableColumns = [
  { prop: 'url', label: $t('table.url'), width: 300 },
  { prop: 'status', label: $t('table.status'), width: 100, slot: 'status' },
  {
    prop: 'responseTime',
    label: $t('table.responseTime'),
    width: 120,
    formatter: (value) => `${value} ms`
  },
  { prop: 'contentLength', label: $t('table.contentLength'), width: 120 },
  { prop: 'contentType', label: $t('table.contentType') }
]

// 获取状态码类型
const getStatusType = (status) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  if (status >= 400) return 'danger'
  return 'info'
}

// 开始测试
const startTest = async () => {
  const validUrls = urlList.value
    .map(item => item.url.trim())
    .filter(url => url)

  if (validUrls.length === 0) {
    ElMessage.warning($t('messages.pleaseAddUrl'))
    return
  }

  loading.value = true
  results.value = []

  try {
    const tempResults = []

    for (const url of validUrls) {
      try {
        console.log('正在测试URL:', url)

        // 使用 IPC 调用主进程执行 HTTP 测试
        const result = await window.electronAPI.invoke('http-test', {
          url,
          method: form.method,
          timeout: form.timeout * 1000,
          retries: form.retries,
          headers: {}
        })

        tempResults.push({
          url: result.url,
          status: result.status,
          responseTime: result.responseTime,
          contentLength: result.contentLength,
          contentType: result.contentType
        })
      } catch (error) {
        console.error('测试失败:', error)
        tempResults.push({
          url,
          status: 'Error',
          responseTime: '-',
          contentLength: '-',
          contentType: '-',
          error: error.message
        })
        ElMessage.error(`${$t('messages.testFailed')} ${url}: ${error.message}`)
      }
    }

    results.value = tempResults
    storageService.addHistory({type:'http',results:tempResults,options:{method:form.method,timeout:form.timeout,retries:form.retries}})
    console.log('测试完成，结果:', results.value)
  } catch (error) {
    console.error('测试过程出错:', error)
    ElMessage.error($t('messages.testFailed') + '：' + error.message)
  } finally {
    loading.value = false
  }
}

// 清除结果
const clearResults = () => {
  results.value = []
}

// 添加到收藏夹
const addToFavorites = (url) => {
  try {
    const success = storageService.addFavorite({
      address: url,
      note: $t('messages.addedFromPage', { page: $t('pages.httpTest') })
    })

    if (success) {
      ElMessage.success($t('messages.addToFavorites'))
    } else {
      ElMessage.warning($t('messages.alreadyInFavorites'))
    }
  } catch (error) {
    console.error('添加收藏失败:', error)
    ElMessage.error($t('messages.saveFailed') + '：' + error.message)
  }
}

// 处理收藏夹选择
const handleFavoritesSelected = (selectedItems) => {
  selectedItems.forEach(item => {
    urlList.value.push({
      id: Date.now() + Math.random(),
      url: item.address
    })
  })
}

// 处理批量添加
const handleBatchAdd = (urls) => {
  urls.forEach(url => {
    urlList.value.push({
      id: Date.now() + Math.random(),
      url
    })
  })
}
</script>

<style scoped>
/* 页面特定样式可以在这里添加 */
</style>
