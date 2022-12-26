<template>
  <div
    v-loading="loading"
    :element-loading-text="$t(`global.loading`)"
    element-loading-spinner="iconfont iconfont-loading iconhelmrepo"
    class="setting-helm-container"
  >
    <!--helm-create-dialog-->
    <el-dialog
      :title="$t(`sysSetting.helmRepo.addHelmChartRepo`)"
      :visible.sync="dialogHelmCreateFormVisible"
      :close-on-click-modal="false"
      custom-class="dialog-style"
      width="35%"
    >
      <el-form ref="helm" :rules="rules" label-width="110px" label-position="left" tab-position="left" :model="helm">
        <el-form-item label="URL" prop="url">
          <el-input size="small" :placeholder="$t(`sysSetting.helmRepo.urlPlaceholder`)" v-model.trim="helm.url"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`sysSetting.helmRepo.repoName`)" prop="repo_name">
          <el-input size="small" :placeholder="$t(`sysSetting.helmRepo.inputRepoName`)" v-model="helm.repo_name"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`sysSetting.helmRepo.username`)" prop="username">
          <el-input size="small" :placeholder="$t(`sysSetting.helmRepo.inputUsername`)" v-model="helm.username"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`sysSetting.helmRepo.password`)" prop="password">
          <el-input size="small" type="passsword" v-if="dialogHelmCreateFormVisible" show-password  :placeholder="$t(`sysSetting.helmRepo.inputPassword`)" v-model="helm.password"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogHelmCreateFormVisible = false">{{$t(`global.cancel`)}}</el-button>
        <el-button :plain="true" type="success" size="small" @click="repoOperation('add')">{{$t(`global.save`)}}</el-button>
      </div>
    </el-dialog>
    <!--helm-create-dialog-->

    <!--helm-edit-dialog-->
    <el-dialog
      :title="$t(`sysSetting.helmRepo.editHelmChartRepo`)"
      :visible.sync="dialogHelmEditFormVisible"
      :close-on-click-modal="false"
      custom-class="dialog-style"
      width="35%"
    >
      <el-form ref="swapHelm" :rules="rules" label-position="left" label-width="110px" tab-position="left" :model="swapHelm">
        <el-form-item label="URL" prop="url">
          <el-input size="small" :placeholder="$t(`sysSetting.helmRepo.urlPlaceholder`)" v-model="swapHelm.url"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`sysSetting.helmRepo.repoName`)" prop="repo_name">
          <el-input size="small" :placeholder="$t(`sysSetting.helmRepo.inputRepoName`)" v-model="swapHelm.repo_name"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`sysSetting.helmRepo.username`)" prop="username">
          <el-input size="small" :placeholder="$t(`sysSetting.helmRepo.inputUsername`)" v-model="swapHelm.username"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`sysSetting.helmRepo.password`)" prop="password">
          <el-input size="small"  type="passsword"
                    show-password :placeholder="$t(`sysSetting.helmRepo.inputPassword`)" v-model="swapHelm.password"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogHelmEditFormVisible = false">{{$t(`global.cancel`)}}</el-button>
        <el-button :plain="true" type="success" size="small" @click="repoOperation('update')">{{$t(`global.save`)}}</el-button>
      </div>
    </el-dialog>
    <!--helm-edit-dialog-->
    <div class="section">
      <el-alert type="info" :closable="false">
        <template>
          {{$t(`sysSetting.helmRepo.referToDoc`)}}
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/helm/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </template>
      </el-alert>
      <div class="sync-container">
        <el-button :plain="true" @click="dialogHelmCreateFormVisible=true" size="small" type="success">{{$t('global.add')}}</el-button>
      </div>
      <div class="helm-list">
        <template>
          <el-table :data="allHelmRepos" style="width: 100%;">
            <el-table-column label="URL" prop="url"></el-table-column>
            <el-table-column :label="$t(`sysSetting.helmRepo.repoName`)" prop="repo_name"></el-table-column>
            <el-table-column :label="$t(`sysSetting.helmRepo.username`)" prop="username"></el-table-column>
            <el-table-column :label="$t(`sysSetting.helmRepo.lastModified`)">
              <template slot-scope="scope">
                <span>{{ $utils.convertTimestamp(scope.row.updated_at) }}</span>
                <span>{{ scope.row.update_by }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t(`global.operation`)">
              <template slot-scope="scope">
                <el-button @click="repoOperation('edit',scope.row)" type="primary" size="mini" plain>{{$t(`global.edit`)}}</el-button>
                <el-button @click="repoOperation('delete',scope.row)" size="mini" type="danger" plain>{{$t(`global.delete`)}}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getHelmRepoAPI,
  createHelmAPI,
  updateHelmAPI,
  deleteHelmAPI
} from '@api'
import bus from '@utils/eventBus'

export default {
  data () {
    return {
      allHelmRepos: [],
      helm: {
        repo_name: '',
        url: '',
        username: '',
        password: ''
      },
      swapHelm: {
        repo_name: '',
        url: '',
        username: '',
        password: ''
      },
      dialogHelmCreateFormVisible: false,
      dialogHelmEditFormVisible: false,
      loading: false
    }
  },
  computed: {
    rules () {
      const protocolValid = (rule, value, callback) => {
        if (!/^(http|https|acr):\/\//.test(value.trim())) {
          callback(new Error(this.$t('sysSetting.helmRepo.protocolCheck')))
        } else {
          callback()
        }
      }
      return {
        url: [
          {
            required: true,
            message: this.$t('sysSetting.helmRepo.inputUrl'),
            trigger: 'blur'
          },
          {
            validator: protocolValid,
            trigger: ['blur', 'change']
          }
        ],
        repo_name: [{ required: true, message: this.$t('sysSetting.helmRepo.inputRepoName'), trigger: 'blur' }],
        username: [
          { required: true, message: this.$t('sysSetting.helmRepo.inputUsername'), trigger: 'blur' }
        ],
        password: [{ required: true, message: this.$t('sysSetting.helmRepo.inputPassword'), trigger: 'blur' }]
      }
    }
  },
  methods: {
    repoOperation (operate, current_repo) {
      if (operate === 'add') {
        this.$refs.helm.validate(valid => {
          if (valid) {
            const payload = this.helm
            this.dialogHelmCreateFormVisible = false
            this.addHelm(payload)
          } else {
            return false
          }
        })
      } else if (operate === 'edit') {
        this.swapHelm = this.$utils.cloneObj(current_repo)
        this.dialogHelmEditFormVisible = true
      } else if (operate === 'update') {
        this.$refs.swapHelm.validate(valid => {
          if (valid) {
            const id = this.swapHelm.id
            const payload = this.swapHelm
            this.dialogHelmEditFormVisible = false
            this.updateHelm(id, payload)
          } else {
            return false
          }
        })
      } else if (operate === 'delete') {
        const id = current_repo.id
        this.$confirm(this.$t('sysSetting.helmRepo.deleteTip', { repoName: current_repo.repo_name }), this.$t('sysSetting.helmRepo.confirm'), {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          type: 'warning'
        }).then(({ value }) => {
          deleteHelmAPI(id).then(res => {
            this.getHelmRepo()
            this.$message({
              message: this.$t('sysSetting.helmRepo.repoHasBeenDeleted'),
              type: 'success'
            })
          })
        })
      }
    },
    addHelm (payload) {
      createHelmAPI(payload).then(res => {
        this.$refs.helm.resetFields()
        this.getHelmRepo()
        this.$message({
          type: 'success',
          message: this.$t('sysSetting.helmRepo.addRepoSuccess')
        })
      })
    },
    updateHelm (id, payload) {
      updateHelmAPI(id, payload).then(res => {
        this.$refs.swapHelm.resetFields()
        this.getHelmRepo()
        this.$message({
          type: 'success',
          message: this.$t('sysSetting.helmRepo.updateRepoSucces')
        })
      })
    },
    getHelmRepo () {
      this.loading = true
      const key = this.$utils.rsaEncrypt()
      getHelmRepoAPI(key).then(res => {
        this.loading = false
        res.forEach(item => {
          item.password = this.$utils.aesDecrypt(item.password)
        })
        this.allHelmRepos = res
      })
    }
  },
  mounted () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t(`sidebarMenu.helmRepo`), url: '' }] })
    this.getHelmRepo()
  }
}
</script>

<style lang="less">
.setting-helm-container {
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

    .helm-list {
      padding-bottom: 30px;
    }

    .dialog-style {
      .el-dialog__body {
        padding: 0 20px;
      }
    }
  }
}
</style>
