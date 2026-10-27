<template>
  <el-container class="app-container">
    <el-header>
      <el-menu mode="horizontal" router>
        <el-menu-item index="/dashboard"><el-icon><Monitor /></el-icon>Probelune</el-menu-item>
        <el-menu-item index="/">
          <el-icon><Search /></el-icon>
          {{ $t('nav.ipLookup') }}
        </el-menu-item>
        <el-menu-item index="/ping">
          <el-icon><Connection /></el-icon>
          Ping{{ $t('nav.test') || '测试' }}
        </el-menu-item>
        <el-menu-item index="/http">
          <el-icon><Monitor /></el-icon>
          {{ $t('nav.http') }}
        </el-menu-item>
        <el-menu-item index="/dns">
          <el-icon><Share /></el-icon>
          {{ $t('nav.dns') }}
        </el-menu-item>
        <el-menu-item index="/mtr">
          <el-icon><Histogram /></el-icon>
          {{ $t('nav.mtr') }}
        </el-menu-item>
        <el-menu-item index="/traceroute">
          <el-icon><Position /></el-icon>
          {{ $t('nav.traceroute') }}
        </el-menu-item>
        <el-menu-item index="/favorites">
          <el-icon><Star /></el-icon>
          {{ $t('nav.favorites') }}
        </el-menu-item>
        <el-menu-item index="/settings" class="settings-menu">
          <el-icon><Setting /></el-icon>
          {{ $t('nav.settings') }}
        </el-menu-item>
      </el-menu>
    </el-header>

    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script setup>
import { inject } from 'vue'
import { Search, Connection, Monitor, Share, Histogram, Position, Star, Setting } from '@element-plus/icons-vue'

// 注入国际化服务
const $t = inject('$t')
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.el-header {
  padding: 0;
  border-bottom: 1px solid #dcdfe6;
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
}

.el-menu-item [class^="el-icon-"] {
  margin-right: 5px;
  vertical-align: middle;
}

/* 深色主题下的主要区域 */
html.dark .el-main {
  background-color: #1a1a1a;
}

html.dark .el-header {
  border-bottom-color: #4c4d4f;
}
</style>
