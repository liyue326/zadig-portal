<template>
  <div class="env-config-container">
    <div class="primary-title" :style="{ 'margin-bottom' : showConfig ? '14px' : '0'}">
      <span>{{$t('environments.k8s.envConfigComp.envConfiguration')}}</span>
      <i
        style="margin-left: 10px; cursor: pointer;"
        :class="[showConfig ? 'el-icon-arrow-up' : 'el-icon-arrow-down']"
        @click="showConfig = !showConfig"
      ></i>
    </div>
    <div v-if="showConfig">
      <el-table v-show="curConfigInfo.length" :data="curConfigInfo" style="width: 90%; max-width: 800px; margin-bottom: 18px;">
        <el-table-column prop="name" :label="$t(`global.name`)"></el-table-column>
        <el-table-column :label="$t(`global.operation`)">
          <template slot-scope="{ row, $index }">
            <el-button type="text" @click="editConfig(row)">{{$t(`global.edit`)}}</el-button>
            <el-button type="text" @click="curConfigInfo.splice($index, 1)">{{$t(`global.delete`)}}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div>
        <el-button type="primary" size="small" @click="addEnvConfig" plain>{{$t(`global.add`)}}</el-button>
      </div>
    </div>
    <el-dialog :visible.sync="dialogVisible" width="60%" custom-class="env-config-dialog" append-to-body>
      <ImportConfig :importRepoInfo="repoConfig" :placeholder="$t('environments.k8s.envConfigComp.addEnvConfigurationPlaceholder')" />
      <div slot="footer">
        <el-button size="small" @click="handleConfig(false)">{{$t(`global.cancel`)}}</el-button>
        <el-button size="small" type="primary" @click="handleConfig(true)">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import ImportConfig from '@/components/projects/common/importConfig/index.vue'
export default {
  props: {
    envName: {
      default: 'default'
    }
  },
  data () {
    return {
      configInfo: {}, // all config information { envName: value }
      repoConfig: {}, // current edit config information
      dialogVisible: false,
      showConfig: false
    }
  },
  computed: {
    curConfigInfo () {
      const cur = this.configInfo[this.envName]
      if (!cur) {
        this.$set(this.configInfo, this.envName, [])
      }
      return this.configInfo[this.envName]
    }
  },
  methods: {
    handleConfig (save) {
      this.dialogVisible = false
      if (save) {
        this.repoConfig.initYaml = this.repoConfig.overrideYaml
      } else {
        this.repoConfig.overrideYaml = this.repoConfig.initYaml
      }
    },
    editConfig (current) {
      this.dialogVisible = true
      this.repoConfig = current
    },
    addEnvConfig () {
      const index = this.curConfigInfo.index || 1
      const next = {
        name: `${this.$t('environments.k8s.envConfigComp.configuration')} ${index}`,
        overrideYaml: '',
        initYaml: ''
      }
      this.curConfigInfo.push(next)
      this.curConfigInfo.index = index + 1
      this.editConfig(next)
    },
    getEnvConfig () {
      const filtered = {}
      for (const key in this.configInfo) {
        filtered[key] = this.configInfo[key]
          .filter(info => info.initYaml)
          .map(info => {
            const config = info.gitRepoConfig
            return {
              yaml_data: info.initYaml,
              git_repo_config: {
                branch: config.branch,
                codehost_id: config.codehostID,
                owner: config.owner,
                repo: config.repo,
                values_paths: config.valuesPaths,
                namespace: config.namespace
              },
              auto_sync: config.autoSync
            }
          })
      }
      return filtered
    }
  },
  components: {
    ImportConfig
  }
}
</script>

<style lang="less">
.env-config-dialog {
  .el-dialog__header {
    padding: 0;
  }

  .el-dialog__body {
    padding: 20px;
  }
}
</style>
