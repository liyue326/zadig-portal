<template>
  <el-dialog title="更新全局服务变量" :visible.sync="updateHelmEnvVarDialogVisible" width="60%" :before-close="cancelUpdateHelmEnvVar">
    <div class="env-container">
      <EnvValues v-if="updateHelmEnvVarDialogVisible" ref="envValuesRef" :envName="envName" :defaultEnvsValues.sync="defaultEnvsValues"/>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" type="primary" :loading="updateHelmEnvVarLoading" @click="updateHelmEnvVar()">更新</el-button>
      <el-button size="small" @click="cancelUpdateHelmEnvVar()">取 消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import EnvValues from '../common/updateHelmEnvVariable.vue'
import { updateHelmEnvVarAPI } from '@/api'
export default {
  name: 'updateHelmVarDialog',
  props: {
    fetchAllData: Function,
    projectName: String,
    envName: String
  },
  components: {
    EnvValues
  },
  data () {
    return {
      updateHelmEnvVarDialogVisible: false,
      updateHelmEnvVarLoading: false,
      defaultEnvsValues: {}
    }
  },
  methods: {
    openDialog () {
      this.updateHelmEnvVarDialogVisible = true
    },
    async updateHelmEnvVar () {
      const res = await this.$refs.envValuesRef.validate().catch(err => {
        console.log(err)
      })
      if (!res) {
        return
      }
      const envValues = this.defaultEnvsValues[this.envName]
      const payload = {
        defaultValues: envValues.envValue || '',
        valuesData: envValues.gitRepoConfig
          ? {
            autoSync: envValues.gitRepoConfig.autoSync,
            yamlSource: 'repo',
            gitRepoConfig: envValues.gitRepoConfig
          }
          : null
      }
      this.updateHelmEnvVarLoading = true
      updateHelmEnvVarAPI(this.projectName, this.envName, payload)
        .then(() => {
          this.updateHelmEnvVarLoading = false
          this.updateHelmEnvVarDialogVisible = false
          this.fetchAllData()
          this.$message({
            message: '更新全局服务变量成功，请等待服务升级',
            type: 'success'
          })
        })
        .catch(() => {
          this.updateHelmEnvVarLoading = false
        })
    },
    cancelUpdateHelmEnvVar (done) {
      this.updateHelmEnvVarDialogVisible = false
      this.defaultEnvsValues = {}
      done && done()
    }
  }
}
</script>

<style lang="less" scoped>
/deep/.el-dialog {
  .el-dialog__body {
    padding: 0 10px 20px;

    .env-container {
      margin: 5px 30px;
    }
  }
}
</style>
