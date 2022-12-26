<template>
    <div v-loading="loading"
         :element-loading-text="$t(`global.loading`)"
         element-loading-spinner="iconfont iconfont-loading iconyingyongshezhi"
         class="setting-app-container">
      <!--apps-create-dialog-->
      <el-dialog :title="$t('sysSetting.packages.addPackage')"
                 width="55%"
                 :close-on-click-modal="false"
                 custom-class="create-app-dialog"
                 :visible.sync="dialogAppCreateFormVisible">
        <el-form ref="createApp"
                 :rules="rules"
                 :model="createApp"
                 label-position="left"
                 label-width="135px">
          <el-form-item :label="$t(`global.name`)"
                        prop="name">
            <el-input size="small"
                      v-model="createApp.name"></el-input>
          </el-form-item>
          <el-form-item :label="$t('sysSetting.packages.version')"
                        prop="version">
            <el-input size="small"
                      :placeholder="$t('sysSetting.packages.versionExample')"
                      v-model="createApp.version"></el-input>
          </el-form-item>
          <el-form-item label="Bin Path"
                        prop="bin_path">
            <el-input size="small"
                      placeholder="$HOME/install_pkg/bin"
                      v-model="createApp.bin_path"></el-input>
          </el-form-item>
          <el-form-item class="label-icon">
            <template #label>
              <span>{{$t('sysSetting.packages.enable')}}</span>
              <el-tooltip :content="$t('sysSetting.packages.enableTooltip')"
                          placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-checkbox v-model="createApp.enabled">{{$t('sysSetting.packages.enableCurrentPackage')}}</el-checkbox>
          </el-form-item>
          <el-form-item prop="download_path" class="label-icon">
            <template #label>
              <span>{{$t('sysSetting.packages.packageAddress')}}</span>
              <el-tooltip :content="$t('sysSetting.packages.packageAddressTooltip')"
                          placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-input size="small"
                      placeholder="http://domain/install_pkg.tar.gz"
                      v-model.trim="createApp.download_path"></el-input>
          </el-form-item>
          <el-form-item :label="$t('sysSetting.packages.installScript')"
                        prop="scripts">
            <Editor v-model="createApp.scripts"
                    lang="sh"
                    theme="monokai"
                    width="100%"
                    height="220"/>
          </el-form-item>
        </el-form>
        <div slot="footer"
             class="dialog-footer">
          <el-button size="small"
                     @click="dialogAppCreateFormVisible = false">{{$t(`global.cancel`)}}</el-button>
          <el-button :plain="true"
                     type="success"
                     size="small"
                     @click="appOperation('add')">{{$t(`global.save`)}}</el-button>
        </div>
      </el-dialog>
      <!--apps-create-dialog-->

      <!--apps-edit-dialog-->
      <el-dialog :title="$t('sysSetting.packages.editPackage',{name:swapApp.name,version:swapApp.version})"
                 width="55%"
                 custom-class="create-app-dialog"
                 :close-on-click-modal="false"
                 :visible.sync="dialogAppEditFormVisible">
        <el-form ref="updateApp"
                 :rules="rules"
                 :model="swapApp"
                 label-position="left"
                 label-width="135px">
          <el-form-item v-if="(typeof swapApp.bin_path)!=='undefined'"
                        label="Bin Path"
                        prop="bin_path">
            <el-input size="small"
                      v-model="swapApp.bin_path"></el-input>
          </el-form-item>
          <el-form-item v-if="(typeof swapApp.enabled)!=='undefined'" class="label-icon">
            <template #label>
              <span>{{$t('sysSetting.packages.enable')}}</span>
              <el-tooltip :content="$t('sysSetting.packages.enableTooltip')"
                          placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-checkbox v-model="swapApp.enabled">{{$t('sysSetting.packages.enableCurrentPackage')}}</el-checkbox>
          </el-form-item>
          <el-form-item v-if="(typeof swapApp.download_path)!=='undefined'"
                        prop="download_path"
                        class="label-icon">
            <template #label>
              <span>{{$t('sysSetting.packages.packageAddress')}}</span>
              <el-tooltip :content="$t('sysSetting.packages.packageAddressTooltip')"
                          placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-input size="small"
                      v-model.trim="swapApp.download_path"></el-input>
          </el-form-item>
          <el-form-item :label="$t('sysSetting.packages.installScript')"
                        prop="scripts">
            <Editor v-model="swapApp.scripts"
                    lang="sh"
                    theme="monokai"
                    width="100%"
                    height="220"/>
          </el-form-item>
        </el-form>
        <div slot="footer"
             class="dialog-footer">
          <el-button size="small"
                     @click="dialogAppEditFormVisible = false">{{$t(`global.cancel`)}}</el-button>
          <el-button size="small"
                     :plain="true"
                     type="success"
                     @click="appOperation('update')">{{$t(`global.save`)}}</el-button>
        </div>
      </el-dialog>
      <!--apps-edit-dialog-->
      <div class="section">
        <el-alert type="info"
                  :closable="false">
          <template>
            {{$t('sysSetting.packages.referToDoc')}}
            <el-link style="font-size: 14px; vertical-align: baseline;"
                     type="primary"
                     :href="`https://docs.koderover.com/zadig/settings/app/`"
                     :underline="false"
                     target="_blank">{{$t(`global.helpDoc`)}}</el-link>
          </template>
        </el-alert>
        <div class="sync-container">
          <el-button :plain="true"
                     @click="dialogAppCreateFormVisible=true"
                     size="small"
                     type="success">{{$t('global.add')}}</el-button>
          <span class="switch-span"
                :style="{color: proxyInfo.enable_application_proxy?'#0066ff':'#303133'}">{{$t('sysSetting.packages.enableProxy')}}</span>
          <el-switch size="small"
                     :value="proxyInfo.enable_application_proxy"
                     @change="changeProxy"></el-switch>
        </div>
        <div class="app-list">
          <el-collapse v-model="activeApps">
            <el-collapse-item v-for="(app,key) of appBucket" :key="key" :title="key" :name="key">
              <template slot="title">
                <span style="color: #4a4a4a; font-weight: 400; font-size: 16px;">{{key}}</span>
              </template>
              <el-table v-if="app.length > 0" :data="app"
                        style="width: 100%;">
                <el-table-column :label="$t('sysSetting.packages.version')">
                  <template slot-scope="scope">
                    <span>{{scope.row.version}}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('sysSetting.packages.enable')">
                  <template slot-scope="scope">
                    <i v-if="scope.row.enabled" style="color: #67c23a;" class="el-icon-circle-check"></i>
                    <i v-else style="color: #f56c6c;" class="el-icon-circle-close"></i>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('sysSetting.packages.updateTime')">
                  <template slot-scope="scope">
                    <i class="el-icon-time"></i>
                    <span style="margin-left: 5px;">{{$utils.convertTimestamp(scope.row.update_time)}}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('sysSetting.packages.updator')">
                  <template slot-scope="scope">
                    <span>{{scope.row.update_by }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t(`global.operation`)">
                  <template slot-scope="scope">
                    <el-button @click="appOperation('edit',scope.row)"
                               type="primary"
                               size="mini" plain>{{$t(`global.edit`)}}</el-button>
                    <el-button size="mini"
                               @click="deleteApp(scope.row)"
                               type="danger" plain>{{$t(`global.delete`)}}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-collapse-item>
          </el-collapse>

        </div>
      </div>
    </div>
</template>

<script>

import Editor from 'vue2-ace-bind'
import { getAllAppsAPI, createAppAPI, updateAppAPI, deleteAppAPI, getProxyConfigAPI, updateProxyConfigAPI } from '@api'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      proxyInfo: {
        id: '',
        type: '',
        address: '',
        port: undefined,
        username: '',
        password: '',
        enable_repo_proxy: false,
        enable_application_proxy: false
      },
      createApp: {
        scripts: '# tar -C $HOME -xzf ' + '$' + `{FILEPATH}` + '\n',
        env: [],
        bin_path: '',
        name: '',
        version: '',
        download_path: '',
        enabled: true
      },
      swapApp: {
        scripts: '',
        env: [],
        bin_path: '',
        name: '',
        version: '',
        download_path: '',
        enabled: true
      },
      appBucket: {},
      defaultVersion: {},
      dialogAppCreateFormVisible: false,
      dialogAppEditFormVisible: false,
      dialogAppDelVisible: false,
      loading: true,
      availableApps: [],
      activeApps: []
    }
  },
  computed: {
    rules () {
      return {
        name: [{ required: true, message: this.$t('sysSetting.packages.inputPackageName'), trigger: 'blur' }],
        version: [{ required: true, message: this.$t('sysSetting.packages.inputPackageVersion'), trigger: 'blur' }],
        scripts: [{ required: true, message: this.$t('sysSetting.packages.inputInstallScript'), trigger: 'blur' }],
        bin_path: [{ required: true, message: this.$t('sysSetting.packages.inputPackageBinPath'), trigger: 'blur' }]
      }
    }
  },
  methods: {
    appOperation (operate, currentApp) {
      if (operate === 'add') {
        this.$refs.createApp.validate((valid) => {
          if (valid) {
            this.dialogAppCreateFormVisible = false
            this.addApp(this.createApp)
          } else {
            return false
          }
        })
      } else if (operate === 'edit') {
        this.dialogAppEditFormVisible = true
        this.swapApp = currentApp
      } else if (operate === 'update') {
        this.$refs.updateApp.validate((valid) => {
          if (valid) {
            const app = this.swapApp
            this.dialogAppEditFormVisible = false
            this.updateApp(app)
          } else {
            return false
          }
        })
      } else if (operate === 'delete') {
        this.deleteApp(currentApp)
      } else if (operate === 'cancel') {
        this.getApps()
      }
    },
    resetForm (formName) {
      this.$refs[formName].resetFields()
    },
    addApp (data) {
      createAppAPI(data).then(res => {
        this.$message({
          message: this.$t('sysSetting.packages.addPackageSuccess'),
          type: 'success'
        })
        this.getApps()
        this.createApp = {
          scripts: '',
          env: [],
          bin_path: '',
          name: '',
          version: '',
          download_path: '',
          enabled: true
        }
      }).catch(() => {
        this.$message({
          message: this.$t('sysSetting.packages.addPackageFailed'),
          type: 'error'
        })
      }).then(() => {
        this.resetForm('createApp')
      })
    },
    updateApp (data) {
      updateAppAPI(data).then(response => {
        this.$message({
          message: this.$t('sysSetting.packages.updatePackageSuccess'),
          type: 'success'
        })
        this.getApps()
      }).catch(response => {
        this.$message({
          message: this.$t('sysSetting.packages.updatePackageFailed'),
          type: 'error'
        })
      }).then(() => {
        this.resetForm('updateApp')
      })
    },
    deleteApp (data) {
      this.$confirm(this.$t('sysSetting.packages.deleteTip', { name: data.name, version: data.version }), this.$t('global.tips'), {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(() => {
        deleteAppAPI(data).then(response => {
          this.getApps()
          this.$message({
            message: this.$t('sysSetting.packages.packageHasBeenDeleted'),
            type: 'success'
          })
        })
        this.getApps()
      }).catch(() => {
        this.$message({
          type: 'info',
          message: this.$t('sysSetting.packages.cancelDelete')
        })
      })
    },
    getApps () {
      this.loading = true
      const showAvailable = false
      getAllAppsAPI(showAvailable).then(
        response => {
          this.loading = false
          const apps = this.$utils.sortVersion(response, 'version', 'asc')
          const unsortAppBucket = {}
          this.appBucket = {}
          this.activeApps = []
          apps.forEach((app, index) => {
            unsortAppBucket[app.name] = []
          })
          apps.forEach((app, index) => {
            unsortAppBucket[app.name].push(app)
          })
          Object.keys(unsortAppBucket).sort().forEach(item => {
            this.appBucket[item] = unsortAppBucket[item]
          })
          for (const appName in this.appBucket) {
            if (Object.prototype.hasOwnProperty.call(this.appBucket, appName)) {
              this.appBucket[appName] = this.$utils.sortVersion(this.appBucket[appName], 'version', 'asc')
            }
          }
          for (const key in this.appBucket) {
            if (Object.prototype.hasOwnProperty.call(this.appBucket, key)) {
              this.activeApps.push(key)
            }
          }
        }
      )
    },
    changeProxy (value) {
      if (!this.proxyInfo.id || this.proxyInfo.type === 'no') {
        this.proxyInfo.enable_application_proxy = false
        this.$message.error(this.$t('sysSetting.packages.noProxy'))
        return
      }
      this.proxyInfo.enable_application_proxy = value
      updateProxyConfigAPI(this.proxyInfo.id, this.proxyInfo).then(response => {
        if (response.message === 'success') {
          const mess = value ? this.$t('sysSetting.packages.proxyIsEnabled') : this.$t('sysSetting.packages.proxyIsDisabled')
          this.$message({
            message: `${mess}`,
            type: 'success'
          })
        } else {
          this.$message.error(response.message)
        }
      }).catch(error => {
        this.proxyInfo.enable_application_proxy = !value
        this.$message.error(this.$t('sysSetting.packages.changeProxyFailed', { error: error }))
      })
    },
    getProxyConfig () {
      getProxyConfigAPI().then(response => {
        if (response.length > 0) {
          this.proxyInfo = Object.assign({}, this.proxyInfo, response[0])
        }
      }).catch(error => {
        this.$message.error(this.$t('sysSetting.packages.getProxyConfigurationFailed', { error: error }))
      })
    }
  },
  created () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t(`sidebarMenu.packages`), url: '' }] })
    this.getProxyConfig()
    this.getApps()
  },
  components: {
    Editor
  }
}
</script>

<style lang="less">
.setting-app-container {
  position: relative;
  flex: 1;
  height: 100%;
  padding: 15px 30px;
  overflow: auto;
  font-size: 13px;

  .create-app-dialog {
    .el-dialog__body {
      padding: 20px 5%;
    }
  }

  .section {
    margin-bottom: 56px;

    .sync-container {
      padding-top: 15px;
      padding-bottom: 15px;
      overflow: hidden;

      .switch-span {
        display: inline-block;
        height: 20px;
        margin-right: 5px;
        margin-left: 10px;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        vertical-align: middle;
        transition: color 0.5s;
      }

      .el-button--success.is-plain {
        color: @themeColor;
        background: #fff;
        border-color: @themeColor;
      }

      .el-button--success.is-plain:hover {
        color: @themeColor;
        background: #fff;
        border-color: @themeColor;
      }
    }

    .app-list {
      padding-bottom: 30px;

      .el-collapse-item__arrow {
        margin: 0 0 0 4px;
      }

      .el-collapse-item__header {
        border-bottom: none;
      }

      .el-collapse-item__content {
        padding-bottom: 0;
      }

      .el-collapse-item__wrap {
        border-bottom: none;
      }
    }
  }
}
</style>
