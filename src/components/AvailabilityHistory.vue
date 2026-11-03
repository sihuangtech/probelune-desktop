<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { invoke } from '../services/desktopApi';
import i18n from '../services/i18nService';
const props = defineProps(['session', 'monitors']);
const tr = (en, zh) => i18n.currentLanguage.value.startsWith('zh') ? zh : en;
const selected = ref(''), minutes = ref(15), hours = ref(24), data = ref(null), detail = ref(null), error = ref('');
let timer, busy = false, active = true;
const percent = v => v == null ? '—' : v.toFixed(1) + '%';
const date = v => new Date(v * 1000).toLocaleString();
watch(() => props.monitors, monitors => { if (!monitors.some(m => m.id === selected.value)) selected.value = monitors[0]?.id || ''; });
watch(selected, () => { data.value = null; detail.value = null; void refresh(); });
async function refresh() {
  if (!selected.value || busy) return;
  if (!Number.isInteger(hours.value) || hours.value < 1 || hours.value > 720 || !Number.isInteger(minutes.value) || minutes.value < 5 || minutes.value > 1440 || minutes.value % 5 || Math.ceil(hours.value * 60 / minutes.value) > 2016) { error.value = tr('Use 5-minute multiples, 1–720 hours and at most 2016 cells.', '粒度为 5 分钟倍数，范围 1—720 小时，最多 2016 个色块。'); return; }
  busy = true;
  const id = selected.value, resolution = minutes.value, range = hours.value;
  try {
    const value = await invoke('dashboard', 'request', { id: props.session.id, path: `/monitors/${id}/uptime?hours=${range}&bucket_minutes=${resolution}` });
    if (active && id === selected.value && resolution === minutes.value && range === hours.value) { data.value = value; error.value = ''; }
  } catch (e) { if (active) error.value = String(e); }
  finally { busy = false; if (active && (id !== selected.value || resolution !== minutes.value || range !== hours.value)) void refresh(); }
}
onMounted(() => { selected.value = props.monitors[0]?.id || ''; timer = setInterval(refresh, 30000); });
onUnmounted(() => { active = false; clearInterval(timer); });
</script>
<template>
  <section class="remote-card">
    <h2>{{ tr('Availability history', '可用性历史') }}</h2>
    <div class="history-settings">
      <el-select v-model="selected" style="width:240px"><el-option v-for="m in monitors" :key="m.id" :value="m.id" :label="m.name" /></el-select>
      <label>{{ tr('Hours', '回看小时数') }}<el-input-number v-model="hours" :min="1" :max="720" /></label>
      <label>{{ tr('Minutes per cell', '色块分钟数') }}<el-input-number v-model="minutes" :min="5" :max="1440" :step="5" step-strictly /></label>
      <el-button @click="refresh">{{ tr('Apply', '应用') }}</el-button>
    </div>
    <el-alert v-if="error" :title="error" type="warning" :closable="false" />
    <template v-if="data"><p>{{ tr('Availability', '可用率') }} {{ percent(data.availability) }} / {{ tr('Coverage', '覆盖率') }} {{ percent(data.coverage) }}</p>
      <div class="availability-cells" role="group" :aria-label="tr('Availability history','可用性历史')"><button v-for="cell in data.cells" :key="cell.at" :class="cell.status" :title="`${date(cell.at)}: ${cell.status}, ${percent(cell.availability)}, ${percent(cell.coverage)}`" :aria-label="`${date(cell.at)}: ${cell.status}`" @click="detail = cell" /></div>
      <p class="history-legend">{{ tr('Green: healthy. Orange/red: failed checks. Hatching: incomplete coverage. Grey: no valid observations.', '绿：正常；橙红：检查失败；斜纹：覆盖不足；灰：无有效数据。') }}</p>
    </template>
    <el-dialog :model-value="!!detail" @close="detail = null" :title="tr('Window details', '时段详情')" width="560px"><template v-if="detail"><p>{{ date(detail.at) }} — {{ date(detail.end) }}</p><p>{{ tr('Availability', '可用率') }} {{ percent(detail.availability) }} / {{ tr('Coverage', '覆盖率') }} {{ percent(detail.coverage) }}</p><p>{{ tr('Success / failure / error', '成功 / 失败 / 错误') }}: {{ detail.success }} / {{ detail.failed }} / {{ detail.errors }}</p><p>{{ tr('Expected samples', '应执行样本') }}: {{ detail.expected }}</p></template></el-dialog>
  </section>
</template>
<style scoped>
.history-settings { display:flex; gap:12px; flex-wrap:wrap; align-items:end; margin-bottom:16px; }
label { display:grid; gap:5px; font-size:12px; }
.availability-cells { display:grid; grid-template-columns:repeat(auto-fill,minmax(8px,1fr)); gap:3px; }
.availability-cells button { height:28px; border:0; border-radius:2px; background:#d9e1df; cursor:pointer; }
.availability-cells button:focus-visible { outline:2px solid #183d37; outline-offset:2px; }
.availability-cells .healthy { background:#19967e; }.availability-cells .partial { background:#d9a23d; }.availability-cells .down { background:#cb5753; }.availability-cells .incomplete { background:repeating-linear-gradient(135deg,#8bbeb1 0 3px,#dcebe5 3px 6px); }
.history-legend { font-size:12px; color:#63747a; margin-top:12px; }
</style>
