<template>
  <div class="integration-approval-container">
    <el-dialog
      :title="(operateType === 'add'?'添加':'编辑')+'审批'"
      :close-on-click-modal="false"
      custom-class="form-dialog"
      :visible.sync="dialogVisible"
    >
      <el-alert type="info" :closable="false">
        <slot>
          <span class="tips">
            - 具体配置详见
            <el-link
              style="font-size: 14px; vertical-align: baseline;"
              type="primary"
              :href="`https://docs.koderover.com/zadig/settings/approval/`"
              :underline="false"
              target="_blank"
            >帮助文档</el-link>
          </span>
          <span class="tips" v-if="checkRes === 'pass'">{{`- 保存当前配置后，前往飞书开发平台，配置应用的「事件订阅」-「请求地址」为`}}</span>
          <span class="tips code-line" v-if="checkRes === 'pass'">
            {{`${$utils.getOrigin()}/api/aslan/system/lark/${approvalInfo.app_id}/webhook`}}
            <span
              v-clipboard:copy="`${$utils.getOrigin()}/api/aslan/system/lark/${approvalInfo.app_id}/webhook`"
              v-clipboard:success="copyCommandSuccess"
              v-clipboard:error="copyCommandError"
              class="el-icon-document-copy copy"
            ></span>
          </span>
        </slot>
      </el-alert>
      <el-alert class="mg-t8 mg-b8" v-if="checkRes === 'fail'&&errorMessage" :title="errorMessage" type="error" :closable="false" show-icon></el-alert>
      <el-form :model="approvalInfo" @submit.native.prevent :rules="rules" ref="approval" label-position="left" label-width="120px">
        <el-form-item label="IM" prop="type">
          <el-radio-group v-model="approvalInfo.type">
            <el-radio label="lark">飞书</el-radio>
            <!-- <el-radio :label="$t(`webhookType.dingding`)" disabled></el-radio> -->
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="name" label="应用名称">
          <el-input v-model.trim="approvalInfo.name" placeholder="应用名称"></el-input>
        </el-form-item>
        <el-form-item prop="app_id" label="App ID">
          <el-input v-model.trim="approvalInfo.app_id" placeholder="App ID"></el-input>
        </el-form-item>
        <el-form-item prop="app_secret" label="App Secret">
          <el-input
            v-model.trim="approvalInfo.app_secret"
            placeholder="App Secret"
            @blur="validate"
            show-password
            type="text"
            :suffix-icon="showCheckIcon"
          ></el-input>
        </el-form-item>
        <el-form-item prop="encrypt_key" label="Encrypt Key">
          <el-input v-model.trim="approvalInfo.encrypt_key" show-password placeholder="Encrypt Key"></el-input>
          <div class="tip">由飞书进行校验，请确保正确</div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button
          :disabled="approvalInfo.name === ''||checkRes!=='pass'"
          type="primary"
          native-type="submit"
          size="small"
          @click="save()"
          class="start-create"
        >确定</el-button>
        <el-button plain native-type="submit" size="small" @click="cancel">取消</el-button>
      </div>
    </el-dialog>

    <div class="tab-container">
      <template>
        <el-alert type="info" :closable="false">
          <template>
            支持集成飞书审批流，提供在 IM 内部进行审批的能力，详情可参考
            <el-link
              style="font-size: 14px; vertical-align: baseline;"
              type="primary"
              :href="`https://docs.koderover.com/zadig/settings/approval/`"
              :underline="false"
              target="_blank"
            >帮助文档</el-link>。
          </template>
        </el-alert>
      </template>
      <div class="sync-container">
        <el-button size="small" type="primary" plain @click="operate({},'add')">添加</el-button>
      </div>
      <el-table :data="list" style="width: 100%;">
        <el-table-column label="IM" prop="typw" width="200">
          <template slot-scope="scope">
            <span>{{scope.row.type==='lark'?'飞书':''}}</span>
          </template>
        </el-table-column>
        <el-table-column label="应用名称" prop="name"></el-table-column>
        <el-table-column label="最后更新" prop="update_time">
          <template slot-scope="scope">{{$utils.convertTimestamp(scope.row.update_time)}}</template>
        </el-table-column>
        <el-table-column label="操作" width="300">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" plain @click="operate(scope.row,'edit')">编辑</el-button>
            <el-button type="danger" size="mini" @click="deleteApproval(scope.row)" plain>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script>
import {
  getApprovalListAPI,
  createApprovalAPI,
  updateApprovalAPI,
  deleteApprovalAPI,
  checkApprovalConfigAPI
} from '@api'
import HelpLink from '../../profile/common/helpLink.vue'
import { cloneDeep } from 'lodash'
export default {
  data () {
    return {
      list: [],
      dialogVisible: false,
      errorMessage: '',
      checkRes: '',
      approvalInfo: {
        type: 'lark',
        name: '',
        app_id: '',
        app_secret: '',
        encrypt_key: ''
      },
      operateType: 'add',
      rules: {
        type: {
          required: true,
          message: '请选择自定义账号系统类型',
          trigger: ['blur', 'change']
        },
        name: {
          required: true,
          message: '请填写名称',
          trigger: ['blur', 'change']
        },
        app_id: {
          required: true,
          message: '请填写 App ID',
          trigger: ['blur', 'change']
        },
        app_secret: {
          required: true,
          message: '请填写 App Secret',
          trigger: ['blur', 'change']
        },
        encrypt_key: {
          required: true,
          message: '请填写 Encrypt Key',
          trigger: ['blur', 'change']
        }
      }
    }
  },
  computed: {
    name () {
      return this.approvalInfo.name
    },
    showCheckIcon () {
      if (this.checkRes === 'pass') {
        return 'el-icon-success'
      } else if (this.checkRes === 'fail') {
        return 'el-icon-error'
      } else {
        return ''
      }
    }
  },
  methods: {
    validate () {
      const { type, app_id, app_secret } = this.approvalInfo
      const params = { type, app_id, app_secret }
      checkApprovalConfigAPI(params)
        .then(res => {
          if (res && res.message === 'success') {
            this.checkRes = 'pass'
          }
        })
        .catch(error => {
          this.checkRes = 'fail'
          this.errorMessage = error.response.data.description
        })
    },
    operate (row = {}, type) {
      this.dialogVisible = true
      if (type === 'edit') {
        this.approvalInfo = cloneDeep(row)
        this.validate()
      } else {
        this.approvalInfo = {
          type: 'lark',
          name: '',
          app_id: '',
          app_secret: '',
          encrypt_key: ''
        }
      }
      this.operateType = type
    },
    copyCommandSuccess (event) {
      this.$message({
        message: '地址已成功复制到剪贴板',
        type: 'success'
      })
    },
    copyCommandError (event) {
      this.$message({
        message: '地址复制失败',
        type: 'error'
      })
    },
    getList () {
      getApprovalListAPI().then(res => {
        this.list = res
      })
    },
    save () {
      this.$refs.approval.validate(valid => {
        if (valid) {
          const {
            type,
            name,
            app_id,
            app_secret,
            encrypt_key,
            id
          } = this.approvalInfo
          const params = { type, name, app_id, app_secret, encrypt_key }
          if (this.operateType === 'edit') {
            updateApprovalAPI(id, params).then(res => {
              this.getList()
              this.dialogVisible = false
            })
          } else {
            createApprovalAPI(params).then(res => {
              this.getList()
              this.dialogVisible = false
            })
          }
          this.resetFields()
        }
      })
    },
    cancel () {
      this.resetFields()
      this.dialogVisible = false
    },
    resetFields () {
      this.$refs.approval.resetFields()
      this.checkRes = ''
    },
    deleteApproval (row) {
      this.$confirm(`确定要删除 ${row.name} 吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteApprovalAPI(row.id).then(res => {
          this.getList()
          this.$message({
            message: '删除成功',
            type: 'success'
          })
        })
      })
    }
  },
  components: {
    HelpLink
  },
  mounted () {
    this.getList()
  }
}
</script>

<style lang="less" scoped>
.integration-approval-container {
  position: relative;
  flex: 1;
  overflow: auto;
  font-size: 13px;

  /deep/ .form-dialog {
    width: 550px;

    .el-dialog__header {
      padding: 15px;
      text-align: center;
      border-bottom: 1px solid #e4e4e4;

      .el-dialog__close {
        font-size: 10px;
      }
    }

    .el-dialog__body {
      padding: 30px 20px;
      color: #606266;
      font-size: 14px;

      .el-form-item {
        margin-bottom: 15px;

        .tip {
          margin-top: -8px;
          color: @primary;
        }
      }
    }

    .el-select {
      width: 100%;
    }

    .el-input {
      display: inline-block;
    }

    .tips {
      display: block;

      &.code-line {
        display: inline-block;
        padding-left: 10px;
        color: #333;
        font-size: 14px;
        word-wrap: break-word;
        word-break: break-all;
        background-color: #ddd;
        border-radius: 2px;

        .copy {
          font-size: 16px;
          cursor: pointer;

          &:hover {
            color: @themeColor;
          }
        }
      }
    }
  }
}

/deep/ .el-icon-success {
  margin-left: 10px;
  color: @success;
  font-size: 20px;
}

/deep/ .el-icon-error {
  display: block;
  margin-left: 10px;
  color: red;
  font-size: 20px;
}
</style>
