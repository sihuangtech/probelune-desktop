<script setup>
import { invoke } from "../services/desktopApi";
import { ref, watch } from "vue";
import storage from "../services/storage";
import i18n from "../services/i18nService";
const props = defineProps(["session", "nodes"]),
  emit = defineEmits(["imported"]);
const open = defineModel({ default: false }),
  selected = ref([]),
  nodeIds = ref([]),
  busy = ref(false),
  report = ref([]);
const favorites = ref(storage.getFavorites()),
  tr = (en, zh) => (i18n.currentLanguage.value.startsWith("zh") ? zh : en);
watch(open, (value) => {
  if (value) favorites.value = storage.getFavorites();
});
async function run() {
  busy.value = true;
  report.value = [];
  let existing;
  try {
    existing = await invoke("dashboard", "request", {
      id: props.session.id,
      path: "/monitors",
    });
  } catch (e) {
    report.value = [{ status: String(e) }];
    busy.value = false;
    return;
  }
  for (const f of selected.value) {
    try {
      if (existing.some((m) => m.check.target === f.address && !m.archived)) {
        report.value.push({
          target: f.address,
          status: tr("Already exists — skipped", "已存在，跳过"),
        });
        continue;
      }

      const isHTTP = /^https?:\/\//i.test(f.address),
        check = {
          type: isHTTP ? "http" : "ping",
          target: f.address,
          timeout: 10,
          count: 4,
          size: 32,
          max_loss: 0,
          method: "GET",
          expected_status: 200,
          follow_redirects: true,
        };
      await invoke("dashboard", "request", {
        id: props.session.id,
        path: "/monitors",
        method: "POST",
        body: {
          name: f.note || f.address,
          group: "Desktop imports",
          tags: [],
          check,
          node_ids: nodeIds.value,
          channel_ids: [],
          interval: 60,
          fail_threshold: 3,
          recover_threshold: 2,
          min_failed_nodes: 1,
          enabled: true,
          public: false,
        },
      });
      existing.push({ check: { target: f.address } });
      report.value.push({ target: f.address, status: tr("Created", "已创建") });
      favorites.value = favorites.value.filter((x) => x.id !== f.id);
    } catch (e) {
      report.value.push({ target: f.address, status: String(e) });
    }
  }
  selected.value = [];
  busy.value = false;
  emit("imported");
}
</script>
<template>
  <el-dialog
    v-model="open"
    :title="tr('Import local favorites', '导入本地收藏')"
    width="720px"
    ><p>
      {{
        tr(
          "URLs become HTTP monitors; hosts become ICMP monitors. Review the selection and destination nodes.",
          "URL 创建 HTTP 监测，主机创建 ICMP 监测。请核对收藏与执行节点。",
        )
      }}
    </p>
    <el-select
      v-model="nodeIds"
      multiple
      :placeholder="tr('Destination nodes', '执行节点')"
      style="width: 100%"
      ><el-option
        v-for="n in nodes.filter((n) => !n.revoked)"
        :key="n.id"
        :value="n.id"
        :label="n.name" /></el-select
    ><el-table :data="favorites" @selection-change="selected = $event"
      ><el-table-column type="selection" /><el-table-column
        prop="address"
        :label="tr('Target', '目标')" /><el-table-column
        prop="note"
        :label="tr('Name', '名称')" /></el-table
    ><el-button
      type="primary"
      :disabled="!selected.length || !nodeIds.length"
      :loading="busy"
      @click="run"
      >{{ tr("Create monitors", "创建监测") }}</el-button
    ><el-table v-if="report.length" :data="report"
      ><el-table-column prop="target" /><el-table-column
        prop="status" /></el-table
  ></el-dialog>
</template>
