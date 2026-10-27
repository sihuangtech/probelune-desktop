<script setup>
import { invoke } from "../services/desktopApi";
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { ElMessage } from "element-plus";
import i18n from "../services/i18nService";
import DashboardConnection from "../components/DashboardConnection.vue";
import FavoriteImport from "../components/FavoriteImport.vue";
import RemoteDiagnostics from "../components/RemoteDiagnostics.vue";
const tr = (en, zh) => (i18n.currentLanguage.value.startsWith("zh") ? zh : en);
const sessions = ref([]),
  selected = ref(""),
  connect = ref(false),
  importOpen = ref(false),
  data = ref({ monitors: [], nodes: [], incidents: [], summary: {} }),
  error = ref(""),
  updated = ref("");
const session = computed(() =>
    sessions.value.find((s) => s.id === selected.value),
  ),
  canEdit = computed(() => session.value && session.value.role !== "viewer");
let timer,
  busy = false;
async function load() {
  sessions.value = await invoke("dashboard", "list");
  if (!sessions.value.some((s) => s.id === selected.value))
    selected.value = sessions.value[0]?.id || "";
}
async function refresh() {
  if (!session.value || busy) return;
  busy = true;
  const id = selected.value;
  try {
    const value = await invoke("dashboard", "request", {
      id,
      path: "/overview",
    });
    if (id === selected.value) {
      data.value = value;
      error.value = "";
      updated.value = new Date().toLocaleTimeString();
    }
  } catch (e) {
    error.value = String(e);
  } finally {
    busy = false;
  }
}
watch(selected, () => {
  data.value = { monitors: [], nodes: [], incidents: [], summary: {} };
  updated.value = "";
  void refresh();
});
onMounted(async () => {
  await load();
  await refresh();
  timer = setInterval(refresh, 4000);
});
onUnmounted(() => clearInterval(timer));
async function connected(s) {
  await load();
  selected.value = s.id;
  await refresh();
}
async function disconnect() {
  try {
    const result = await invoke("dashboard", "disconnect", {
      id: selected.value,
    });
    if (result.warning) ElMessage.warning(result.warning);
    await load();
  } catch (e) {
    ElMessage.error(String(e));
  }
}
function openDashboard() {
  window.electronAPI.openExternal(session.value.url);
}
</script>
<template>
  <div class="remote-page">
    <header>
      <div>
        <p class="remote-label">PROBELUNE · OBSERVATION NETWORK</p>
        <h1>{{ tr("Dashboard connections", "面板连接") }}</h1>
      </div>
      <el-button type="primary" @click="connect = true"
        >+ {{ tr("Connect instance", "连接实例") }}</el-button
      >
    </header>
    <el-empty
      v-if="!sessions.length"
      :description="
        tr(
          'Connect a self-hosted dashboard to observe your nodes. Local diagnostics are always available.',
          '连接自部署面板查看节点。本机诊断始终独立可用。',
        )
      "
    /><template v-if="session"
      ><section class="remote-card">
        <div class="remote-actions">
          <el-select v-model="selected" style="width: 360px"
            ><el-option
              v-for="s in sessions"
              :key="s.id"
              :value="s.id"
              :label="s.url + ' · ' + s.username" /></el-select
          ><el-button @click="openDashboard">{{
            tr("Open web console", "打开网页控制台")
          }}</el-button
          ><el-button v-if="canEdit" @click="importOpen = true">{{
            tr("Import favorites", "导入收藏")
          }}</el-button
          ><el-button text type="danger" @click="disconnect">{{
            tr("Disconnect", "断开连接")
          }}</el-button>
        </div>
        <p>
          {{ tr("Last updated", "最近更新") }} {{ updated || "—" }} ·
          {{ session.role }}
        </p>
        <el-alert
          v-if="error"
          :title="
            tr(
              'Disconnected; showing last known data. ',
              '已断连，展示上次数据。',
            ) + error
          "
          type="warning"
          :closable="false"
        /><el-table :data="data.monitors"
          ><el-table-column
            prop="name"
            :label="tr('Monitor', '监测')"
          /><el-table-column
            prop="check.target"
            :label="tr('Target', '目标')"
          /><el-table-column
            prop="status"
            :label="tr('Status', '状态')"
          /><el-table-column :label="tr('Locations', '位置')"
            ><template #default="{ row }"
              ><el-tag
                v-for="s in row.states"
                :key="s.node_id"
                :type="
                  s.status === 'healthy'
                    ? 'success'
                    : s.status === 'failed'
                      ? 'danger'
                      : 'info'
                "
                style="margin: 3px"
                >{{ data.nodes.find((n) => n.id === s.node_id)?.name }} ·
                {{ s.status }}</el-tag
              ></template
            ></el-table-column
          ></el-table
        >
      </section>
      <RemoteDiagnostics
        v-if="canEdit"
        :key="session.id"
        :session="session"
        :nodes="data.nodes" /><FavoriteImport
        v-model="importOpen"
        :session="session"
        :nodes="data.nodes"
        @imported="refresh" /></template
    ><DashboardConnection v-model="connect" @connected="connected" />
  </div>
</template>
<style scoped>
.remote-page {
  max-width: 1400px;
  margin: auto;
}
.remote-page header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0 30px;
}
.remote-label {
  letter-spacing: 0.14em;
  font-size: 11px;
  color: #087f73;
}
.remote-card {
  background: var(--el-bg-color);
  padding: 24px;
  border-radius: 14px;
  margin-bottom: 24px;
}
.remote-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
