<template>
  <div
    v-loading="loading"
    :element-loading-text="$t(`global.loading`)"
    element-loading-spinner="iconfont iconfont-loading iconfenzucopy"
    class="setting-profile-container"
  >
    <el-dialog :title="$t(`profile.changePassword`)" class="modifiled-pwd" :visible.sync="modifiedPwdDialogVisible" center>
      <div class="modifiled-pwd-container">
        <el-form label-position="top" label-width="100px" :rules="pwdRules" ref="passwordForm" :model="pwd">
          <el-form-item :label="$t(`profile.oldPassword`)" prop="oldPassword">
            <el-input size="small" show-password v-model="pwd.oldPassword"></el-input>
          </el-form-item>
          <el-form-item :label="$t(`profile.newPassword`)" prop="newPassword">
            <el-input size="small" show-password v-model="pwd.newPassword"></el-input>
          </el-form-item>
          <el-form-item :label="$t(`profile.confirmNewPassword`)" prop="confirmPassword">
            <el-input size="small" show-password v-model="pwd.confirmPassword"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="cancelUpdateUserInfo" plain>{{$t(`global.cancel`)}}</el-button>
        <el-button size="small" type="primary" @click="updateUserInfo" plains>{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="$t(`profile.changeMail`)" class="modifiled-mail" :visible.sync="modifiedMailDialogVisible" center>
      <div class="modifiled-mail-container">
        <el-form label-position="top" label-width="120px" :rules="mailRules" ref="mailForm" :model="mail">
          <el-form-item :label="$t(`profile.oldMail`)">
            <span v-if="currentEditUserInfo">{{currentEditUserInfo.email}}</span>
          </el-form-item>
          <el-form-item :label="$t(`profile.newMail`)" prop="newMail">
            <el-input v-model="mail.newMail" size="small" :placeholder="$t(`profile.inputMail`)"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="cancelUpdateMail" plain>{{$t(`global.cancel`)}}</el-button>
        <el-button size="small" type="primary" @click="updateMail">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="$t(`profile.changePhone`)" class="modifiled-phone" :visible.sync="modifiedPhoneDialogVisible" center>
      <div class="modifiled-phone-container">
        <el-form label-position="top" label-width="100px" :rules="phoneRules" ref="phoneForm" :model="phone">
          <el-form-item :label="$t(`profile.oldPhone`)" prop="oldPhone">
            <span v-if="currentEditUserInfo">{{currentEditUserInfo.phone}}</span>
          </el-form-item>
          <el-form-item :label="$t(`profile.newPhone`)" prop="newPhone">
            <el-input size="small" v-model="phone.newPhone"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="cancelUpdatePhone" plain>{{$t(`global.cancel`)}}</el-button>
        <el-button size="small" type="primary" @click="updatePhone" plains>{{$t(`global.confirm`)}}</el-button>
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
            <span v-if="currentEditUserInfo.name" class="mail">{{currentEditUserInfo.name}}</span>
            <el-tag v-if="role.includes('admin')" size="mini" type="primary">{{$t(`profile.admin`)}}</el-tag>
            <el-tag v-else size="mini" type="primary">{{$t(`profile.user`)}}</el-tag>
          </div>

          <div class="info-details">
            <table class="table profile-table">
              <tbody>
                <template>
                  <tr>
                    <td>{{$t(`profile.lastAccessedOn`)}}</td>
                    <td class>{{$utils.convertTimestamp(currentEditUserInfo.last_login_time)}}</td>
                  </tr>
                </template>
                <tr v-if="currentEditUserInfo.identity_type">
                  <td>
                    <span>{{$t(`profile.source`)}}</span>
                  </td>
                  <td>
                    <span>
                      <i class="iconfont" :class="'icon'+currentEditUserInfo.identity_type"></i>
                      <span>{{identityTypeMap[currentEditUserInfo.identity_type]}}</span>
                    </span>
                  </td>
                </tr>
                <tr v-if="currentEditUserInfo.identity_type ==='system'">
                  <td>
                    <span>{{$t(`profile.updatePassword`)}}</span>
                  </td>
                  <td>
                    <el-button class="edit-password" @click="modifiedPwd" type="text">{{$t(`profile.clickToChange`)}}</el-button>
                  </td>
                </tr>
                <tr v-if="currentEditUserInfo.identity_type ==='system'">
                  <td>
                    <span>{{$t(`profile.updateMail`)}}</span>
                  </td>
                  <td>
                    <span>{{currentEditUserInfo.email}}</span>
                    <el-button class="edit-password" @click="modifiedMail" type="text">{{$t(`profile.clickToChange`)}}</el-button>
                  </td>
                </tr>
                <tr v-if="currentEditUserInfo.identity_type ==='system'">
                  <td>
                    <span>{{$t(`profile.updatePhone`)}}</span>
                  </td>
                  <td>
                    <span>{{currentEditUserInfo.phone}}</span>
                    <el-button class="edit-password" @click="modifiedPhone" type="text">{{$t(`profile.clickToChange`)}}</el-button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span>API Token</span>
                    <HelpLink :inline="true" :keyword="{location:'个人中心',key:'APIToken'}" />
                  </td>
                  <td>
                    <el-input size="mini" readonly type="text" v-model="currentEditUserInfo.token">
                      <el-button
                        v-clipboard:copy="currentEditUserInfo.token"
                        v-clipboard:success="copySuccess"
                        v-clipboard:error="copyError"
                        slot="append"
                        size="mini"
                        icon="el-icon-document-copy"
                      >{{$t(`global.copy`)}}</el-button>
                    </el-input>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span>{{$t(`profile.notificationSetting`)}}</span>
                  </td>
                  <td>
                    <el-checkbox
                      v-model="workflowNoti.pipelinestatus"
                      @change="saveSubscribe()"
                      true-label="*"
                      false-label
                    >{{$t(`profile.workflowStatusChanged`)}}</el-checkbox>
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
  updateCurrentUserMailAPI,
  getSubscribeAPI,
  saveSubscribeAPI
} from '@api'
import { cloneDeep } from 'lodash'
import { mapState } from 'vuex'

export default {
  data () {
    return {
      currentEditUserInfo: null,
      pwd: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      mail: {
        newMail: ''
      },
      phone: {
        oldPhone: '',
        newPhone: ''
      },
      loading: false,
      modifiedPwdDialogVisible: false,
      modifiedMailDialogVisible: false,
      modifiedPhoneDialogVisible: false,
      workflowNoti: {}
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
        message: this.$t(`profile.copiedToClipboard`),
        type: 'success'
      })
    },
    copyError (event) {
      this.$message({
        message: this.$t(`profile.copyFailed`),
        type: 'error'
      })
    },
    modifiedPwd () {
      this.modifiedPwdDialogVisible = true
    },
    modifiedMail () {
      this.modifiedMailDialogVisible = true
    },
    modifiedPhone () {
      this.modifiedPhoneDialogVisible = true
    },
    updateUserInfo () {
      this.$refs.passwordForm.validate(valid => {
        if (valid) {
          const id = this.currentEditUserInfo.uid
          const payload = {
            oldPassword: this.pwd.oldPassword,
            newPassword: this.pwd.newPassword
          }
          updateCurrentUserInfoAPI(id, payload).then(res => {
            this.$message({
              message: this.$t(`profile.passwordChangedSuccessfully`),
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
    updateMail () {
      this.$refs.mailForm.validate(valid => {
        if (valid) {
          const id = this.currentEditUserInfo.uid
          const payload = cloneDeep(this.currentEditUserInfo)
          payload.email = this.mail.newMail
          updateCurrentUserMailAPI(id, payload).then(res => {
            this.$message({
              message: this.$t(`profile.mailChangedSuccessfully`),
              type: 'success'
            })
            this.getCurrentUserInfo()
            this.cancelUpdateMail()
            this.mail = {
              newMail: ''
            }
          })
        } else {
          return false
        }
      })
    },
    updatePhone () {
      this.$refs.phoneForm.validate(valid => {
        if (valid) {
          const id = this.currentEditUserInfo.uid
          const params = {
            name: this.currentEditUserInfo.name,
            phone: this.phone.newPhone
          }
          updateCurrentUserMailAPI(id, params).then(res => {
            this.$message({
              message: this.$t(`profile.phoneChangedSuccessfully`),
              type: 'success'
            })
            this.modifiedPhoneDialogVisible = false
            this.getCurrentUserInfo()
            this.phone = {
              newPhone: ''
            }
          })
        } else {
          return false
        }
      })
    },
    cancelUpdateUserInfo () {
      this.$refs.passwordForm.resetFields()
      this.modifiedPwdDialogVisible = false
    },
    cancelUpdateMail () {
      this.$refs.mailForm.resetFields()
      this.modifiedMailDialogVisible = false
    },
    cancelUpdatePhone () {
      this.$refs.phoneForm.resetFields()
      this.modifiedPhoneDialogVisible = false
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
          message: this.$t(`profile.notificationSettingSavedSuccessfully`),
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
    }),
    identityTypeMap () {
      return {
        github: 'GitHub',
        system: this.$t(`profile.system`),
        ldap: 'OpenLDAP',
        oauth: 'OAuth'
      }
    },
    pwdRules () {
      const validateNewPass = (rule, value, callback) => {
        if (value === '') {
          callback(new Error(this.$t(`profile.inputNewPass`)))
        } else {
          if (this.pwd.confirmPassword !== '') {
            this.$refs.ruleForm.validateField('confirmPassword')
          }
          callback()
        }
      }
      const validateConfirmPass = (rule, value, callback) => {
        if (value === '') {
          callback(new Error(this.$t(`profile.inputNewPassAgain`)))
        } else if (value !== this.pwd.newPassword) {
          callback(new Error(this.$t(`profile.passwordDontMatch`)))
        } else {
          callback()
        }
      }
      return {
        oldPassword: [
          {
            required: true,
            message: this.$t(`profile.inputOldPass`),
            trigger: 'blur'
          }
        ],
        newPassword: [
          { required: true, validator: validateNewPass, trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, validator: validateConfirmPass, trigger: 'blur' }
        ]
      }
    },
    mailRules () {
      return {
        newMail: [
          { required: true, message: this.$t(`profile.inputMail`), trigger: 'blur' },
          {
            type: 'email',
            message: this.$t(`profile.pleaseCheckMail`),
            trigger: ['blur', 'change']
          }
        ]
      }
    },
    phoneRules () {
      const validatePhone = (rule, value, callback) => {
        if (value === '') {
          callback(new Error(this.$t(`profile.inputPhone`)))
        } else {
          if (
            !/^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/.test(
              value
            )
          ) {
            callback(new Error(this.$t(`profile.pleaseCheckPhone`)))
          } else {
            callback()
          }
        }
      }
      return {
        newPhone: [
          { required: true, message: this.$t(`profile.inputPhone`), trigger: 'blur' },
          {
            type: 'tel',
            message: this.$t(`profile.pleaseCheckPhone`),
            trigger: ['blur', 'change'],
            validator: validatePhone
          }
        ]
      }
    }
  },
  created () {
    bus.$emit('set-topbar-title', {
      breadcrumb: [{ title: this.$t(`profile.profile`), url: '' }]
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

.modifiled-mail {
  .modifiled-mail-container {
    width: 300px;
    margin: 0 auto;
  }
}

.modifiled-phone {
  .modifiled-phone-container {
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

            .edit-password {
              padding: 0;
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
