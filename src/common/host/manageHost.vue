<template>
  <div
    v-loading="loading"
    element-loading-text="加载中..."
    element-loading-spinner="iconfont iconfont-loading iconzhuji"
    class="setting-host-container"
  >
    <!--Host-edit-dialog-->
    <el-dialog :title="title" :visible.sync="dialogHostFormVisible" custom-class="dialog-style" :close-on-click-modal="false" width="45%">
      <AddHost ref="add-host" :host="host"></AddHost>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogHostFormVisible = false">取 消</el-button>
        <el-button :plain="true" size="small" type="success" @click="hostOperation">保存</el-button>
      </div>
    </el-dialog>
    <!--Host-edit-dialog-->

    <!--Host-import-dialog-->
    <el-dialog :title="title" :visible.sync="dialogImportHostVisible" custom-class="dialog-style" :close-on-click-modal="false" width="35%">
      <ImportHosts ref="import-hosts" :originHosts="allHost" :type="type"></ImportHosts>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogImportHostVisible = false">取 消</el-button>
        <el-button :plain="true" size="small" type="success" @click="hostOperation">保存</el-button>
      </div>
    </el-dialog>
    <!--Host-import-dialog-->

    <div class="section">
      <el-alert type="info" :closable="false">
        <template>
          支持阿里云 ECS、腾讯云 CVM、华为云 ECS 等主机的接入和使用，详情可参考
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/vm-management/`"
            :underline="false"
            target="_blank"
          >帮助文档</el-link>
        </template>
      </el-alert>
      <div class="sync-container">
        <el-button size="small" :plain="true" @click="hostOperation('add')" type="success">新建</el-button>
        <el-button size="small" :plain="true" @click="hostOperation('import')" type="success">导入</el-button>
      </div>
      <div class="host-list">
        <template>
          <el-table :data="allHost" style="width: 100%;">
            <el-table-column label="主机名称">
              <template slot-scope="scope">
                <i :class="getProviderMap(scope.row.provider,'icon')"></i>
                <span>{{scope.row.name}}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态">
              <template slot-scope="{ row }">
                <el-tag
                  size="small"
                  effect="dark"
                  :type="row.status === 'normal' ? 'success' : 'danger'"
                >{{row.status === 'normal' ? '在线' : '离线'}}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="标签">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.label" size="small">{{scope.row.label}}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="IP">
              <template slot-scope="scope">
                <span>{{scope.row.ip}}</span>
              </template>
            </el-table-column>
            <el-table-column label="用户名">
              <template slot-scope="scope">
                <span>{{scope.row.user_name}}</span>
              </template>
            </el-table-column>
            <el-table-column width="240" label="操作">
              <template slot-scope="scope">
                <el-button @click="hostOperation('update',scope.row)" size="mini" type="primary" plain>编辑</el-button>
                <el-button @click="hostOperation('delete',scope.row)" size="mini" type="danger" plain>删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import AddHost from '@/components/projects/common/pm/addHost.vue'
import {
  getHostListAPI,
  getProjectHostListAPI,
  deleteHostAPI,
  deleteProjectHostAPI
} from '@api'
import { cloneDeep } from 'lodash'

const initHost = {
  name: '',
  provider: null,
  label: '',
  ip: '',
  port: 22,
  is_prod: false,
  user_name: '',
  private_key: '',
  probe: {
    probe_type: 'tcp',
    http_probe: {
      path: '',
      port: 22, // 1~65535
      timeout_second: 1, // 1~10
      response_flag: false, // delete
      response_success_flag: '',
      http_headers: [] // { name, value}
    }
  }
}
export default {
  name: 'Host',
  data () {
    return {
      allHost: [],
      host: null,
      addHostData: null,
      providerMap: {
        0: {
          icon: 'iconfont logo iconwuliji',
          name: '其他'
        },

        1: {
          icon: 'iconfont logo iconaliyun ',
          name: '阿里云 OSS'
        },
        2: {
          icon: 'iconfont logo icontengxunyun',
          name: '腾讯云 COS'
        },
        3: {
          icon: 'iconfont logo iconhuawei',
          name: '华为云 OBS'
        },
        4: {
          icon: 'iconfont logo iconaws',
          name: 'Amazon S3'
        }
      },
      dialogHostFormVisible: false,
      dialogImportHostVisible: false,
      operate: '',
      loading: false
    }
  },
  props: {
    type: {
      type: String,
      default: 'system'
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    title () {
      if (this.operate === 'add') {
        return '创建主机资源'
      } else if (this.operate === 'update') {
        return '修改主机资源'
      } else if (this.operate === 'import') {
        return '导入主机资源'
      } else {
        return ''
      }
    }
  },
  methods: {
    getProviderMap (name, type) {
      if (name && type) {
        return this.providerMap[name][type]
      } else {
        return this.providerMap[0].icon
      }
    },
    hostOperation (operate, current_host) {
      if (operate === 'add' || operate === 'update') {
        this.operate = operate
        this.dialogHostFormVisible = true
        operate === 'update' && (this.host = this.$utils.cloneObj(current_host))
      } else if (operate === 'delete') {
        const id = current_host.id
        this.$confirm(`确定要删除 ${current_host.name} ?`, '确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(({ value }) => {
          if (this.type === 'project') {
            deleteProjectHostAPI(id, this.projectName).then(res => {
              this.getHost()
              this.$message({
                message: '删除主机成功',
                type: 'success'
              })
            })
          } else {
            deleteHostAPI(id).then(res => {
              this.getHost()
              this.$message({
                message: '删除主机成功',
                type: 'success'
              })
            })
          }
        })
      } else if (operate === 'import') {
        this.operate = operate
        this.dialogImportHostVisible = true
      } else {
        if (this.operate === 'add' || this.operate === 'update') {
          const fn = this.operate === 'add' ? 'saveHost' : 'updateHost'
          this.$refs['add-host'][fn]().then(() => {
            this.dialogHostFormVisible = false
            this.dialogImportHostVisible = false
            this.getHost()
          })
        } else if (this.operate === 'import') {
          const fn = 'importHost'
          this.$refs['import-hosts'][fn]().then(() => {
            this.dialogImportHostVisible = false
            this.getHost()
          })
        }
      }
    },
    getHost () {
      this.loading = true
      const key = this.$utils.rsaEncrypt()
      if (this.type === 'project') {
        getProjectHostListAPI(key, this.projectName).then(res => {
          this.loading = false
          res.forEach(element => {
            // return val is hex
            element.private_key = window.atob(
              this.$utils.aesDecrypt(element.private_key)
            )
          })
          this.allHost = res
        })
      } else {
        getHostListAPI(key).then(res => {
          this.loading = false
          res.forEach(element => {
            // return val is hex
            element.private_key = window.atob(
              this.$utils.aesDecrypt(element.private_key)
            )
          })
          this.allHost = res
        })
      }
    }
  },
  watch: {
    dialogHostFormVisible (newV) {
      if (!newV) {
        if (this.operate === 'add') {
          this.addHostData = this.$utils.cloneObj(this.host)
        }
        this.$refs['add-host'].resetFields()
        this.host = this.$utils.cloneObj(this.addHostData)
      } else {
        if (this.host.probe.probe_type === 'tcp') {
          this.$set(
            this.host.probe,
            'http_probe',
            cloneDeep(initHost.probe.http_probe)
          )
        } else if (this.host.probe.http_probe) {
          this.$set(
            this.host.probe.http_probe,
            'response_flag',
            !!this.host.probe.http_probe.response_success_flag
          )
        }
      }
    }
  },
  created () {
    this.getHost()
    this.addHostData = this.host = this.$utils.cloneObj(initHost)
  },
  components: {
    AddHost
  }
}
</script>

<style lang="less">
.setting-host-container {
  position: relative;
  flex: 1;
  padding: 15px 30px;
  overflow: auto;
  font-size: 13px;

  .section {
    margin-bottom: 56px;

    .sync-container {
      padding-top: 15px;
      padding-bottom: 15px;
      overflow: hidden;

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

    .host-list {
      padding-bottom: 30px;

      .logo {
        font-size: 20px;
      }
    }
  }

  .dialog-style {
    .el-dialog__body {
      padding: 0 20px;
    }

    .el-form-item {
      margin-bottom: 15px;
    }
  }
}
</style>
