<template>
  <div class="add-code-container">
    <el-alert :title="$t(`sysSetting.integration.gitProviders.notIntegrated`)" :closable="false" type="warning"></el-alert>
    <el-alert v-if="codeAdd.type === 'gitlab'" type="info" :closable="false">
      <slot>
        <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
        <span class="tips code-line">
          {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
          <span
            v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
            v-clipboard:success="copyCommandSuccess"
            v-clipboard:error="copyCommandError"
            class="el-icon-document-copy copy"
          ></span>
        </span>
        <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appPermissionCheckTip`)}}api、read_user、read_repository</span>
        <span class="tips">
          - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/codehost/gitlab/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-alert v-else-if="codeAdd.type === 'github'" type="info" :closable="false">
      <slot>
        <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
        <span class="tips code-line">
          {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
          <span
            v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
            v-clipboard:success="copyCommandSuccess"
            v-clipboard:error="copyCommandError"
            class="el-icon-document-copy copy"
          ></span>
        </span>
        <span class="tips">
          - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/codehost/github/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-alert v-else-if="codeAdd.type === 'gerrit'" type="info" :closable="false">
      <slot>
        <span class="tips">
          - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            href="https://docs.koderover.com/zadig/settings/codehost/gerrit/"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-alert v-else-if="codeAdd.type === 'gitee'" type="info" :closable="false">
      <slot>
        <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
        <span class="tips code-line">
          {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
          <span
            v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
            v-clipboard:success="copyCommandSuccess"
            v-clipboard:error="copyCommandError"
            class="el-icon-document-copy copy"
          ></span>
        </span>
        <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appPermissionCheckTip`)}}projects、groups、pull_requests、hook</span>
        <span class="tips">
          - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/codehost/gitee/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-alert v-if="codeAdd.type === 'gitee-enterprise'" type="info" :closable="false">
      <slot>
        <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
        <span class="tips code-line">
          {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
          <span
            v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
            v-clipboard:success="copyCommandSuccess"
            v-clipboard:error="copyCommandError"
            class="el-icon-document-copy copy"
          ></span>
        </span>
        <span
          class="tips"
        >- {{$t(`sysSetting.integration.gitProviders.appPermissionCheckTip`)}}projects、groups、pull_requests、hook、enterprises</span>
        <span class="tips">
          - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/codehost/gitee-enterprise/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-alert v-else-if="codeAdd.type === 'other'" type="info" :closable="false">
      <slot>
        <span class="tips">- {{$t(`sysSetting.integration.gitProviders.otherProviderTipFirst`)}}</span>
        <span class="tips">- {{$t(`sysSetting.integration.gitProviders.otherProviderTipSecond`)}}</span>
        <span class="tips">
          - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/codehost/others/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-form :model="codeAdd" :rules="codeRules" status-icon label-width="140px" label-position="left" class="mg-t32" ref="codeForm">
      <el-form-item :label="$t(`sysSetting.integration.gitProviders.provider`)" prop="type">
        <el-select v-model="codeAdd.type" filterable allow-create>
          <el-option label="GitLab" value="gitlab"></el-option>
          <el-option label="GitHub" value="github"></el-option>
          <el-option label="Gerrit" value="gerrit"></el-option>
          <el-option :label="$t(`sysSetting.integration.gitProviders.giteeCE`)" value="gitee"></el-option>
          <el-option v-if="hasPlutus" :label="$t(`sysSetting.integration.gitProviders.giteeEE`)" value="gitee-enterprise"></el-option>
          <el-option :label="$t(`sysSetting.integration.gitProviders.otherProvider`)" value="other"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`sysSetting.integration.gitProviders.providerAlias`)" prop="alias">
        <el-input v-model="codeAdd.alias" :placeholder="$t(`sysSetting.integration.gitProviders.providerAlias`)"></el-input>
      </el-form-item>
      <template v-if="codeAdd.type==='gitlab' || codeAdd.type ==='github'">
        <el-form-item v-if="codeAdd.type==='gitlab'" :label="$t(`sysSetting.integration.gitProviders.gitlabUrl`)" prop="address">
          <el-input v-model.trim="codeAdd.address" :placeholder="$t(`sysSetting.integration.gitProviders.gitlabUrl`)" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item :label="codeAdd.type==='gitlab'?'Application ID':'Client ID'" prop="application_id">
          <el-input
            v-model="codeAdd.application_id"
            :placeholder="codeAdd.type==='gitlab'?'Application ID':'Client ID'"
            auto-complete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="codeAdd.type==='gitlab'?'Secret':'Client Secret'" prop="client_secret">
          <el-input
            v-model="codeAdd.client_secret"
            show-password
            type="password"
            :placeholder="codeAdd.type==='gitlab'?'Secret':'Client Secret'"
            auto-complete="off"
          ></el-input>
        </el-form-item>
      </template>
      <template v-else-if="codeAdd.type==='gerrit'">
        <el-form-item :label="$t(`sysSetting.integration.gitProviders.gerritUrl`)" prop="address">
          <el-input v-model.trim="codeAdd.address" :placeholder="$t(`sysSetting.integration.gitProviders.gerritUrl`)" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`sysSetting.integration.gitProviders.username`)" prop="username">
          <el-input v-model="codeAdd.username" placeholder="Username" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`sysSetting.integration.gitProviders.password`)" prop="password">
          <el-input v-model="codeAdd.password" placeholder="Password" auto-complete="off"></el-input>
        </el-form-item>
      </template>
      <template v-else-if="codeAdd.type==='gitee'">
        <el-form-item label="Client ID" prop="application_id">
          <el-input v-model="codeAdd.application_id" placeholder="Client ID" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="Client Secret" prop="client_secret">
          <el-input
            v-model="codeAdd.client_secret"
            placeholder="Client Secret"
            show-password
            type="password"
            auto-complete="off"
          ></el-input>
        </el-form-item>
      </template>
      <template v-else-if="codeAdd.type==='gitee-enterprise'">
        <el-form-item :label="$t(`sysSetting.integration.gitProviders.giteeUrl`)" prop="address">
          <el-input v-model.trim="codeAdd.address" :placeholder="$t(`sysSetting.integration.gitProviders.giteeUrl`)" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="Client ID" prop="application_id">
          <el-input v-model="codeAdd.application_id" placeholder="Access Key" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="Client Secret" prop="client_secret">
          <el-input
            v-model="codeAdd.client_secret"
            placeholder="Client Secret"
            show-password
            type="password"
            auto-complete="off"
          ></el-input>
        </el-form-item>
      </template>
      <template v-else-if="codeAdd.type==='other'">
        <el-form-item :label="$t(`sysSetting.integration.gitProviders.authMethod`)" prop="auth_type">
          <el-select v-model="codeAdd.auth_type" filterable allow-create>
            <el-option label="SSH" value="SSH"></el-option>
            <el-option label="Access Token" value="PrivateAccessToken"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="codeAdd.auth_type"
          :label="$t(`sysSetting.integration.gitProviders.providerUrl`)"
          prop="address"
          :rules="{ required:true,validator: (codeAdd.auth_type === 'SSH' ? validateSSH : validateGitURL), trigger: ['change', 'blur'] }"
        >
          <el-input v-model="codeAdd.address" :placeholder="codeAdd.auth_type === 'SSH' ? 'git@example.com' : 'http(s)://example.com'"></el-input>
        </el-form-item>
        <el-form-item v-if="codeAdd.auth_type === 'SSH'" label="SSH Key" prop="ssh_key">
          <el-input v-model="codeAdd.ssh_key" placeholder="SSH Key" type="textarea" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item v-if="codeAdd.auth_type === 'PrivateAccessToken'" label="Access Token" prop="private_access_token">
          <el-input
            v-model="codeAdd.private_access_token"
            placeholder="Access Token"
            show-password
            type="password"
            auto-complete="off"
          ></el-input>
        </el-form-item>
      </template>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button
        type="primary"
        native-type="submit"
        size="small"
        class="start-create"
        @click="createCodeConfig"
      >{{(codeAdd.type==='gerrit'||codeAdd.type==='other')?$t(`global.confirm`):$t(`sysSetting.integration.gitProviders.goToAuthorization`)}}</el-button>
      <el-button plain native-type="submit" size="small" @click="cancel">{{$t(`global.cancel`)}}</el-button>
    </div>
  </div>
</template>
<script>
import { createCodeSourceAPI } from '@api'
import { mapState } from 'vuex'
export default {
  data () {
    return {
      codeAdd: {
        name: '',
        type: 'gitlab',
        address: '',
        access_token: '',
        application_id: '',
        client_secret: '',
        alias: '',
        auth_type: ''
      }
    }
  },
  computed: {
    codeRules () {
      return {
        type: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.selectProvider`
          ),
          trigger: ['blur']
        },
        address: [
          {
            required: true,
            trigger: ['blur', 'change'],
            message: this.$t(`sysSetting.integration.gitProviders.inputAddress`)
          }
        ],
        access_token: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.inputAccessToken`
          ),
          trigger: ['blur']
        },
        application_id: {
          required: true,
          message: this.$t(`sysSetting.integration.gitProviders.inputAppId`),
          trigger: ['blur']
        },
        client_secret: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.inputclientSecret`
          ),
          trigger: ['blur']
        },
        username: {
          required: true,
          message: this.$t(`sysSetting.integration.gitProviders.inputUsername`),
          trigger: ['blur']
        },
        password: {
          required: true,
          message: this.$t(`sysSetting.integration.gitProviders.inputPass`),
          trigger: ['blur']
        },
        alias: {
          required: true,
          message: this.$t(`sysSetting.integration.gitProviders.inputAlias`),
          trigger: ['blur']
        },
        auth_type: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.selectAuthMethod`
          ),
          trigger: ['blur', 'change']
        },
        ssh_key: {
          required: true,
          message: this.$t(`sysSetting.integration.gitProviders.inputSSHKey`),
          trigger: ['blur', 'change']
        },
        private_access_token: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.inputPrivateAccessToken`
          ),
          trigger: ['blur', 'change']
        }
      }
    },
    validateSSH () {
      const validateSSH = (rule, value, callback) => {
        if (value === '') {
          callback(
            new Error(
              this.$t(
                `sysSetting.integration.gitProviders.inputOtherProviderUrl`
              )
            )
          )
        } else {
          const reg = /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z0-9]{2,14}(:[1-9]\d{0,4})?/
          if (!reg.test(value)) {
            callback(
              new Error(
                this.$t(
                  `sysSetting.integration.gitProviders.checkOtherProviderUrl`
                )
              )
            )
          } else {
            callback()
          }
        }
      }
      return validateSSH
    },
    validateGitURL () {
      const validateGitURL = (rule, value, callback) => {
        if (value === '') {
          callback(
            new Error(
              this.$t(
                `sysSetting.integration.gitProviders.inputOtherProviderUrl`
              )
            )
          )
        } else {
          const reg = /^((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/
          if (!reg.test(value)) {
            callback(
              new Error(
                this.$t(`sysSetting.integration.gitProviders.inputAddress`)
              )
            )
          } else {
            callback()
          }
        }
      }
      return validateGitURL
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  methods: {
    clearValidate (ref) {
      this.$refs[ref].clearValidate()
    },
    cancel () {
      this.$emit('cancel', true)
    },
    createCodeConfig () {
      this.$refs.codeForm.validate(valid => {
        if (valid) {
          const payload = this.codeAdd
          const redirectUrl = window.location.href
          const provider = this.codeAdd.type
          if (provider === 'github') {
            payload.address = 'https://github.com'
          } else if (provider === 'gitee') {
            payload.address = 'https://gitee.com'
          } else if (provider === 'other') {
            // Add newline to the end of the ssh key
            const sshKeyLastCharacter = payload.ssh_key.charAt(
              payload.ssh_key.length - 1
            )
            if (sshKeyLastCharacter !== '\n') {
              payload.ssh_key = payload.ssh_key + '\n'
            }
          }
          createCodeSourceAPI(payload).then(res => {
            const codehostId = res.id
            this.$message({
              message: this.$t(
                `sysSetting.integration.gitProviders.addProviderSuccess`
              ),
              type: 'success'
            })
            if (
              payload.type === 'gitlab' ||
              payload.type === 'gitee' ||
              payload.type === 'gitee-enterprise' ||
              payload.type === 'github'
            ) {
              this.goToCodeHostAuth(codehostId, redirectUrl)
            }
            this.handleCodeCancel()
          })
        } else {
          return false
        }
      })
    },
    goToCodeHostAuth (codehostId, redirectUrl) {
      window.location.href = `/api/v1/codehosts/${codehostId}/auth?redirect_url=${redirectUrl}`
    },
    copyCommandSuccess (event) {
      this.$message({
        message: this.$t(`sysSetting.integration.gitProviders.copyAddrSuccess`),
        type: 'success'
      })
    },
    copyCommandError (event) {
      this.$message({
        message: this.$t(`sysSetting.integration.gitProviders.copyAddrFailed`),
        type: 'error'
      })
    }
  },
  watch: {
    'codeAdd.type' (val) {
      this.$refs.codeForm.clearValidate()
    }
  }
}
</script>
<style lang="less">
.add-code-container {
  padding: 10px 15px;
  font-size: 13px;

  .el-select {
    width: 100%;
  }

  .tips {
    display: block;

    &.code-line {
      display: inline-block;
      padding-left: 10px;
      color: #ecf0f1;
      font-size: 14px;
      word-wrap: break-word;
      word-break: break-all;
      background-color: #334851;
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
</style>
