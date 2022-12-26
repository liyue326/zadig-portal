<template>
  <div class="env-config-container">
    <el-tabs v-model="currentConfig" @tab-click="handleClick" type="card">
      <el-tab-pane v-for="name in allConfig" :key="name" :label="name" :name="name"></el-tab-pane>
    </el-tabs>
    <div class="env-config-content">
      <CommonConfig ref="commonConfigRef" :currentType="currentConfig" @actionConfig="actionConfig" />
    </div>
    <el-dialog :visible.sync="dialogVisible" width="60%" custom-class="env-config-dialog" append-to-body>
      <ImportConfig :importRepoInfo="repoConfig" :cmOption="cmOption" :placeholder="placeholder" />
      <div slot="footer">
        <el-button size="small" :disabled="dialogBtnLoading" @click="dialogVisible = false" v-show="repoConfig.actionType !== 'view'">{{$t(`global.cancel`)}}</el-button>
        <el-button size="small" type="primary" :loading="dialogBtnLoading" @click="handleConfig">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>
    <VersionHistory ref="versionRef" @actionConfig="actionConfig" />
  </div>
</template>

<script>
import CommonConfig from '@/components/projects/env/env_detail/envConfig/commonConfig'
import ImportConfig from '@/components/projects/common/importConfig/index.vue'
import VersionHistory from './versionHistory.vue'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      currentConfig: '',
      allConfig: ['Ingress', 'ConfigMap', 'Secret', 'PVC'],
      dialogVisible: false,
      repoConfig: {},
      dialogBtnLoading: false,
      cmOption: {}
    }
  },
  methods: {
    handleClick () {
      this.$router.push({ query: { type: this.currentConfig } })
    },
    actionConfig (evt) {
      if (evt.actionType === 'history') {
        this.$refs.versionRef.showVersionList(
          evt.name,
          this.currentConfig,
          evt.services
        )
      } else {
        this.repoConfig = {
          actionType: evt.actionType,
          overrideYaml: evt.yamlData || '',

          restart_associated_svc: evt.actionType === 'edit',

          name: evt.name,
          services: evt.services,
          commonEnvCfgType: this.currentConfig,

          showParams: {
            title:
              evt.actionType === 'add'
                ? this.$t('environments.k8s.envConfigComp.addEnvConfiguration')
                : `${evt.actionType === 'view' ? this.$t('global.view') : this.$t('global.edit')} ${
                  evt.name
                } ${this.$t('environments.config.configuration')}`,

            showImport: evt.showImport || false,
            checkAssociated:
              this.currentConfig !== 'Ingress' && evt.actionType === 'edit'
          },
          gitRepoConfig: evt.gitRepoConfig
        }
        this.cmOption = {
          readOnly: evt.readOnly || false
        }
        this.dialogVisible = true
      }
    },
    handleConfig () {
      const actionType = this.repoConfig.actionType
      if (actionType === 'view') {
        this.dialogVisible = false
        return
      }

      let method = null

      const repoConfig = this.repoConfig.gitRepoConfig
      let payload = {
        yamlData: this.repoConfig.overrideYaml,
        gitRepoConfig: {
          branch: repoConfig.branch,
          codehost_id: repoConfig.codehostID,
          owner: repoConfig.owner,
          repo: repoConfig.repo,
          values_paths: repoConfig.valuesPaths,
          namespace: repoConfig.namespace
        },
        autoSync: repoConfig.autoSync || false
      }

      if (actionType === 'add') {
        method = 'createConfigByType'
      } else if (actionType === 'edit') {
        payload = {
          ...payload,
          name: this.repoConfig.name,
          restart_associated_svc: this.repoConfig.restart_associated_svc,
          services: this.repoConfig.services,

          // When editing, determine whether it is from a rollback operation by whether to display the import information
          fromRollback: !this.repoConfig.showParams.showImport
        }
        method = 'updateConfigByType'
      }
      this.dialogBtnLoading = true
      this.$refs.commonConfigRef[method](payload).then(err => {
        this.dialogBtnLoading = false
        if (!err) {
          this.dialogVisible = false
          this.$refs.versionRef.closeHistoryDialog()
        }
      })
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envName () {
      return this.$route.params.env_name
    },
    placeholder () {
      return this.$t('environments.config.pastePlaceholder', { currentConfig: this.currentConfig })
    }
  },
  created () {
    this.currentConfig = this.$route.query.type || this.allConfig[0]
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: this.$t('subTopbarMenu.environments'), url: '' },
        {
          title: this.envName,
          url: `/v1/projects/detail/${this.projectName}/envs/detail?envName=${this.envName}`
        },
        { title: this.$t('environments.config.configuration'), url: '' }
      ]
    })
  },
  components: {
    CommonConfig,
    ImportConfig,
    VersionHistory
  }
}
</script>

<style lang="less" scoped>
.env-config-container {
  flex: 1;
  padding: 20px;
  background: #fff;
  border-top: 1px solid #eee;

  .env-config-content {
    margin: 0;
  }
}
</style>

<style lang="less">
.env-config-dialog.el-dialog {
  .el-dialog__header {
    padding: 0;
  }

  .el-dialog__body {
    padding: 20px;
  }
}
</style>
