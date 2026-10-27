<script setup>
import { invoke } from "../services/desktopApi";
import { ref } from "vue";
import { ElMessage } from "element-plus";
import i18n from "../services/i18nService";
const emit = defineEmits(["connected"]),
  open = defineModel({ default: false });
const form = ref({ url: "", username: "", password: "", allowHttp: false }),
  busy = ref(false),
  error = ref("");
const tr = (en, zh) => (i18n.currentLanguage.value.startsWith("zh") ? zh : en);
async function connect() {
  busy.value = true;
  error.value = "";
  try {
    const value = await invoke("dashboard", "connect", form.value);
    form.value.password = "";
    emit("connected", value);
    open.value = false;
    if (!value.persistent)
      ElMessage.warning(
        tr(
          "OS keychain unavailable: session is held only in memory.",
          "系统密钥环不可用，会话仅保存在内存中。",
        ),
      );
  } catch (e) {
    error.value = String(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <el-dialog
    v-model="open"
    :title="tr('Connect dashboard', '连接面板')"
    width="480px"
    ><el-form label-position="top" @submit.prevent="connect"
      ><el-form-item :label="tr('Dashboard URL', '面板地址')"
        ><el-input
          v-model="form.url"
          placeholder="https://monitor.example.com" /></el-form-item
      ><el-form-item :label="tr('Username', '用户名')"
        ><el-input v-model="form.username" /></el-form-item
      ><el-form-item :label="tr('Password', '密码')"
        ><el-input
          v-model="form.password"
          type="password"
          show-password /></el-form-item
      ><el-checkbox v-model="form.allowHttp">{{
        tr(
          "Allow unencrypted HTTP on a trusted network",
          "允许受信任网络内的明文 HTTP",
        )
      }}</el-checkbox
      ><el-alert v-if="error" :title="error" type="error" :closable="false" />
      <div style="margin-top: 20px">
        <el-button type="primary" native-type="submit" :loading="busy">{{
          tr("Connect", "连接")
        }}</el-button>
      </div></el-form
    ></el-dialog
  >
</template>
