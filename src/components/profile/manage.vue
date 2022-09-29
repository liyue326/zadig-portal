<template>
  <div
    v-loading="loading"
    element-loading-text="加载中..."
    element-loading-spinner="iconfont iconfont-loading iconfenzucopy"
    class="setting-profile-container"
  >
    <el-dialog title="修改密码" :fullscreen="true" class="modifiled-pwd" :visible.sync="modifiedPwdDialogVisible" center>
      <div class="modifiled-pwd-container">
        <el-form label-position="top" label-width="100px" :rules="rules" ref="ruleForm" :model="pwd">
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input show-password v-model="pwd.oldPassword"></el-input>
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input show-password v-model="pwd.newPassword"></el-input>
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input show-password v-model="pwd.confirmPassword"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelUpdateUserInfo">取 消</el-button>
        <el-button type="primary" @click="updateUserInfo">确 定</el-button>
      </span>
    </el-dialog>
    <div v-if="currentEditUserInfo" class="section">
      <div class="Box">
        <div class="row">
          <div class="edit-columns">
            <div class="ember-view">
              <span class="avatar iconfont iconvery-user"></span>
            </div>
          </div>
          <div class="info-tag">
            <span  class="username">{{currentEditUserInfo.name}}</span>
            <el-tag v-if="role.includes('admin')" size="mini" type="primary">管理员</el-tag>
            <el-tag v-else size="mini" type="primary">普通用户</el-tag>
          </div>

          <div class="info-details">
            <table class="table profile-table">
              <tbody>
                <template>
                  <tr>
                    <td>最近登录</td>
                    <td class>{{$utils.convertTimestamp(currentEditUserInfo.last_login_time)}}</td>
                  </tr>
                </template>
                <!-- <tr>
                  <td>
                    <span>Kube Config</span>
                    <HelpLink :inline="true"
                                 :keyword="{location:'个人中心',key:'KubeConfig'}"></HelpLink>
                  </td>
                  <td class="">
                    <el-button @click="downloadConfig()"
                               type="text">点击下载</el-button>
                  </td>
                </tr>-->
                <tr v-if="currentEditUserInfo.identity_type">
                  <td>
                    <span>用户来源</span>
                  </td>
                  <td>
                    <span >
                      <i class="iconfont" :class="'icon'+currentEditUserInfo.identity_type"></i>
                      <span>{{identityTypeMap[currentEditUserInfo.identity_type]}}</span>
                    </span>
                  </td>
                </tr>
                <tr v-if="currentEditUserInfo.identity_type ==='system'">
                  <td>
                    <span>修改密码</span>
                  </td>
                  <td>
                    <el-button @click="modifiedPwd" type="text">点击修改</el-button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span>API Token</span>
                    <HelpLink :inline="true" :keyword="{location:'个人中心',key:'APIToken'}" />
                  </td>
                  <td>
                    <el-input size="small" placeholder readonly type="text" v-model="currentEditUserInfo.token">
                      <el-button
                        v-clipboard:copy="currentEditUserInfo.token"
                        v-clipboard:success="copySuccess"
                        v-clipboard:error="copyError"
                        slot="append"
                        icon="el-icon-document-copy"
                      >复制</el-button>
                    </el-input>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span>通知设置</span>
                  </td>
                  <td>
                    <el-checkbox v-model="workflowNoti.pipelinestatus" @change="saveSubscribe()" true-label="*" false-label>工作流状态变更</el-checkbox>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import bus from '@utils/eventBus'
import HelpLink from './common/helpLink.vue'
import {
  getCurrentUserInfoAPI,
  updateCurrentUserInfoAPI,
  getSubscribeAPI,
  saveSubscribeAPI,
  downloadConfigAPI
} from '@api'
import { mapState } from 'vuex'

export default {
  data () {
    const validateNewPass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入新密码'))
      } else {
        if (this.pwd.confirmPassword !== '') {
          this.$refs.ruleForm.validateField('confirmPassword')
        }
        callback()
      }
    }
    const validateConfirmPass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入新密码'))
      } else if (value !== this.pwd.newPassword) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }
    return {
      identityTypeMap: {
        github: 'GitHub',
        system: '系统创建',
        ldap: 'OpenLDAP',
        oauth: 'OAuth'
      },
      currentEditUserInfo: null,
      pwd: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      loading: false,
      modifiedPwdDialogVisible: false,
      workflowNoti: {},
      rules: {
        oldPassword: [
          { required: true, message: '请输入旧密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, validator: validateNewPass, trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, validator: validateConfirmPass, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    async getCurrentUserInfo () {
      this.loading = true
      const res = await getCurrentUserInfoAPI(this.userinfo.uid).catch(error =>
        console.log(error)
      )
      if (res) {
        this.loading = false
        this.currentEditUserInfo = res
      }
    },
    copySuccess (event) {
      this.$message({
        message: '已成功复制到剪贴板',
        type: 'success'
      })
    },
    copyError (event) {
      this.$message({
        message: '复制失败',
        type: 'error'
      })
    },
    modifiedPwd () {
      this.modifiedPwdDialogVisible = true
    },
    updateUserInfo () {
      this.$refs.ruleForm.validate(valid => {
        if (valid) {
          const id = this.currentEditUserInfo.uid
          const payload = {
            oldPassword: this.pwd.oldPassword,
            newPassword: this.pwd.newPassword
          }
          updateCurrentUserInfoAPI(id, payload).then(res => {
            this.$message({
              message: '密码修改成功',
              type: 'success'
            })
            this.cancelUpdateUserInfo()
            this.pwd = {
              oldPassword: '',
              newPassword: '',
              confirmPassword: ''
            }
          })
        } else {
          return false
        }
      })
    },
    cancelUpdateUserInfo () {
      this.$refs.ruleForm.resetFields()
      this.modifiedPwdDialogVisible = false
    },
    downloadConfig () {
      this.$message({
        message: '获取配置中，请稍候...',
        type: 'info'
      })
      downloadConfigAPI().then(res => {
        this.$message({
          message: '配置获取完毕，下载后请按照文档使用',
          type: 'success'
        })
        const content = res
        const fileName = 'config'
        const aTag = document.createElement('a')
        const blob = new Blob([content], { type: 'binary/octet-stream' })
        if (aTag.download !== undefined) {
          aTag.setAttribute('href', window.URL.createObjectURL(blob))
          aTag.setAttribute('download', fileName)
          document.body.appendChild(aTag)
          aTag.click()
          document.body.removeChild(aTag)
        }
      })
    },
    getSubscribe () {
      getSubscribeAPI().then(res => {
        this.convertData(res)
      })
    },
    saveSubscribe () {
      const payload = this.workflowNoti
      payload.type = 2
      saveSubscribeAPI(payload).then(res => {
        this.$message({
          message: '通知设置保存成功',
          type: 'success'
        })
        this.getSubscribe()
      })
    },
    convertData (info) {
      if (info.length !== 0) {
        info.forEach(element => {
          if (element.type === 2) {
            this.workflowNoti = element
          }
        })
      }
    }
  },
  computed: {
    ...mapState({
      userinfo: state => state.login.userinfo,
      role: state => state.login.role
    })
  },
  created () {
    bus.$emit('set-topbar-title', {
      breadcrumb: [{ title: '账号设置', url: '' }]
    })
    this.getSubscribe()
    this.getCurrentUserInfo()
  },
  components: {
    HelpLink
  }
}
</script>

<style lang="less">
.modifiled-pwd {
  .modifiled-pwd-container {
    width: 300px;
    margin: 0 auto;
  }
}

.setting-profile-container {
  position: relative;
  flex: 1;
  padding: 60px 20px;
  overflow: auto;
  font-size: 13px;
  background-color: @globalBackgroundColor;

  .section {
    margin-bottom: 56px;

    .Box {
      padding: 20px 20px;
      background: #fff;
      border: 1px solid #f1f1f1;
      border-radius: 6px;

      .username {
        font-weight: 300;
        font-size: 18px;
      }

      .avatar {
        width: 40px;
        height: 40px;
        margin-bottom: 10px;
        border-radius: 50%;
      }

      .edit-columns {
        overflow: hidden;

        .ember-view {
          float: left;
          width: 300px;

          .avatar {
            color: @themeColor;
            font-size: 40px;
          }
        }

        .edit-profile {
          float: right;
          width: 200px;
          margin-top: 15px;
        }
      }

      .info-details {
        h6 {
          margin-top: 28px;
          margin-bottom: 10px;
          font-weight: 500;
          font-size: 16px;
        }

        .profile-table {
          width: 100%;
          margin-top: 15px;
          color: #666f80;

          tr td {
            padding: 15px 8px;
          }

          tbody > tr > td,
          thead > tr > td {
            padding-left: 0;
            border-top: 1px solid #e6e9f0;

            .download-desc {
              color: #666f80;
              cursor: pointer;

              &:hover {
                color: @themeColor;
              }
            }
          }

          tr td:nth-of-type(1) {
            width: 50%;
          }

          tr:first-of-type td {
            border-top: 0;
          }
        }
      }
    }
  }
}
</style>
