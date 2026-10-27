<script setup>
import { invoke } from "../services/desktopApi";
import { ref, onUnmounted } from "vue";
import i18n from "../services/i18nService";
const props = defineProps(["session", "nodes"]);
const tr = (en, zh) => (i18n.currentLanguage.value.startsWith("zh") ? zh : en);
const type = ref("http"),
  target = ref(""),
  nodeIds = ref([]),
  local = ref(true),
  results = ref([]),
  jobs = ref([]),
  busy = ref(false),
  error = ref("");
const call = (path, method = "GET", body) =>
  invoke("dashboard", "request", { id: props.session.id, path, method, body });
let timer;
onUnmounted(() => clearInterval(timer));
async function run() {
  busy.value = true;
  error.value = "";
  results.value = [];
  jobs.value = [];
  clearInterval(timer);
  try {
    const check = {
      type: type.value,
      target: target.value,
      timeout: 10,
      count: 4,
      size: 32,
      method: "GET",
      expected_status: 200,
      dns_record: "A",
      follow_redirects: false,
    };
    if (nodeIds.value.length) {
      jobs.value = await call("/diagnostics", "POST", {
        check,
        node_ids: nodeIds.value,
      });
      timer = setInterval(poll, 2000);
    }
    if (local.value) {
      const start = performance.now();
      let value;
      try {
        if (type.value === "http")
          value = await invoke("http-test", {
            url: target.value,
            method: "GET",
            timeout: 10000,
          });
        else if (type.value === "ping")
          value = await invoke("ping-test", {
            host: target.value,
            count: 4,
            size: 32,
            timeout: 3,
          });
        else value = await invoke("dns-test", target.value, "A", "default");
        const success =
          type.value === "http"
            ? value.status === 200
            : type.value === "ping"
              ? value.loss === 0
              : value.success;
        results.value.push({
          location: tr("This computer", "本机"),
          status: success ? "success" : "failure",
          latency: Math.round(performance.now() - start),
          data: value,
        });
      } catch (e) {
        results.value.push({
          location: tr("This computer", "本机"),
          status: "error",
          data: String(e),
        });
      }
    }
  } catch (e) {
    error.value = String(e);
  } finally {
    busy.value = false;
  }
}
async function poll() {
  try {
    const items = await call("/diagnostics");
    const own = items.filter((i) => jobs.value.some((j) => j.id === i.job.id));
    results.value = results.value.filter((r) => !r.jobId);
    for (const i of own)
      results.value.push({
        jobId: i.job.id,
        location:
          props.nodes.find((n) => n.id === i.job.node_id)?.name ||
          i.job.node_id,
        status: i.result?.status || i.job.status,
        latency: i.result?.latency_ms,
        data: i.result,
      });
    if (
      own.length === jobs.value.length &&
      own.every((i) => ["done", "cancelled", "expired"].includes(i.job.status))
    )
      clearInterval(timer);
  } catch (e) {
    error.value = String(e);
    clearInterval(timer);
  }
}
async function cancel() {
  for (const job of jobs.value)
    await call("/diagnostics/" + job.id + "/cancel", "POST", {});
  await poll();
}
function exportResults() {
  const a = document.createElement("a"),
    url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            results.value.map(({ location, status, latency, jobId }) => ({
              location,
              status,
              latency,
              jobId,
            })),
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
  a.href = url;
  a.download = "probelune-comparison.json";
  a.click();
  URL.revokeObjectURL(url);
}
</script>
<template>
  <section class="remote-card">
    <h2>{{ tr("Local & remote comparison", "本地与远程对照") }}</h2>
    <p>
      {{
        tr(
          "One-off diagnostics never change continuous monitor state.",
          "即时诊断不会改变持续监测状态。",
        )
      }}
    </p>
    <el-form inline @submit.prevent="run"
      ><el-form-item
        ><el-select v-model="type" style="width: 110px"
          ><el-option value="http" label="HTTP" /><el-option
            value="ping"
            label="ICMP" /><el-option
            value="dns"
            label="DNS" /></el-select></el-form-item
      ><el-form-item
        ><el-input
          v-model="target"
          :placeholder="type === 'http' ? 'https://example.com' : 'example.com'"
          style="width: 280px" /></el-form-item
      ><el-form-item
        ><el-select
          v-model="nodeIds"
          multiple
          style="width: 240px"
          :placeholder="tr('Remote nodes', '远程节点')"
          ><el-option
            v-for="n in nodes.filter((n) => n.enabled && !n.revoked)"
            :key="n.id"
            :value="n.id"
            :label="n.name" /></el-select></el-form-item
      ><el-form-item
        ><el-checkbox v-model="local">{{
          tr("This computer", "本机")
        }}</el-checkbox></el-form-item
      ><el-form-item
        ><el-button
          native-type="submit"
          type="primary"
          :loading="busy"
          :disabled="!target || (!local && !nodeIds.length)"
          >{{ tr("Run", "开始") }}</el-button
        ></el-form-item
      ></el-form
    ><el-alert v-if="error" :title="error" type="error" /><el-table
      :data="results"
      ><el-table-column
        prop="location"
        :label="tr('Location', '位置')"
      /><el-table-column
        prop="status"
        :label="tr('Status', '状态')"
      /><el-table-column prop="latency" label="ms" /><el-table-column
        type="expand"
        ><template #default="{ row }">
          <pre style="white-space: pre-wrap">{{
            JSON.stringify(row.data, null, 2)
          }}</pre>
        </template></el-table-column
      ></el-table
    ><el-button v-if="jobs.length" @click="cancel">{{
      tr("Cancel remote jobs", "取消远程任务")
    }}</el-button
    ><el-button v-if="results.length" @click="exportResults">{{
      tr("Export JSON", "导出 JSON")
    }}</el-button>
  </section>
</template>
