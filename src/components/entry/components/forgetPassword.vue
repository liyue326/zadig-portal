<template>
  <div>
    <div v-if="currentStep === 'account'">
      <h1 class="title">{{$t(`login.resetPassword`)}}</h1>
      <h2 class="subtitle">{{$t(`login.inputUsername`)}}</h2>
      <el-form :model="retrieveForm" :rules="retrieveRules" ref="retrieveForm">
        <el-form-item prop="account">
          <el-input v-model="retrieveForm.account" :placeholder="$t(`login.username`)"></el-input>
        </el-form-item>
      </el-form>
      <el-button :loading="checkUserLoading" type="submit" class="btn-md btn-theme btn-block login-btn" @click="nextStep">{{$t(`login.next`)}}</el-button>
    </div>
    <div v-else-if="currentStep === 'sendmail'">
      <h2 class="title">{{$t(`login.resetPassword`)}}</h2>
      <p class="subtitle">{{$t(`login.resetLinkTip`)}}</p>
      <p class="content">{{mail}}</p>
    </div>
    <div v-else-if="currentStep === 'setpass'">
      <h1 class="title">{{$t(`login.setNewPassword`)}}</h1>
      <h2 class="subtitle">{{$t(`login.inputNewPass`)}}</h2>
      <el-form :model="form" ref="form" :rules="rules">
        <el-form-item prop="password">
          <el-input type="password" v-model="form.password" :placeholder="$t(`login.inputNewPass`)" show-password></el-input>
        </el-form-item>
        <el-form-item prop="checkPass">
          <el-input type="password" v-model="form.checkPass" :placeholder="$t(`login.inputNewPassAgain`)" show-password :minlength="8"></el-input>
        </el-form-item>
      </el-form>
      <el-button type="submit" @click="submit" class="btn-md btn-theme btn-block login-btn">{{$t(`login.confirmReset`)}}</el-button>
    </div>
  </div>
</template>
<script>
import { retrievePasswordAPI, changePasswordAPI } from '@api'
export default {
  name: 'forgetpassword',
  props: {
    openLogin: Function,
    retrieveToken: String
  },
  data () {
    return {
      mail: '',
      checkUserLoading: false,
      form: {
        password: null,
        checkPass: null
      },
      retrieveForm: {
        account: ''
      },
      currentStep: 'account'
    }
  },
  computed: {
    rules () {
      const validatePass = (rule, value, callback) => {
        if (!value) {
          callback(new Error(this.$t(`login.inputPass`)))
        } else if (value.length < 8) {
          callback(new Error(this.$t(`login.passwordLength`)))
        } else {
          if (this.form.checkPass) {
            this.$refs.form.validateField('checkPass')
          }
          callback()
        }
      }
      const validateConfirmedPass = (rule, value, callback) => {
        if (!value) {
          callback(new Error(this.$t(`login.inputNewPassAgain`)))
        } else if (value.length < 8) {
          callback(new Error(this.$t(`login.passwordLength`)))
        } else if (value !== this.form.password) {
          callback(new Error(this.$t(`login.passwordDontMatch`)))
        } else {
          callback()
        }
      }
      return {
        password: [{ validator: validatePass, trigger: 'change' }],
        checkPass: [{ validator: validateConfirmedPass, trigger: 'change' }]
      }
    },
    retrieveRules () {
      return {
        account: [{ required: true, message: this.$t(`login.inputUsername`), trigger: 'blur' }]
      }
    }
  },
  methods: {
    nextStep () {
      this.$refs.retrieveForm.validate(async valid => {
        if (valid) {
          this.checkUserLoading = true
          const res = await retrievePasswordAPI(this.retrieveForm.account).catch((error) => {
            this.checkUserLoading = false
            console.log(error)
          })
          if (res) {
            this.checkUserLoading = false
            this.currentStep = 'sendmail'
            this.mail = res.email
          }
        }
      })
    },
    async submit () {
      this.$refs.form.validate(async valid => {
        if (valid) {
          const res = await changePasswordAPI({ password: this.form.password, token: this.retrieveToken }).catch(error =>
            console.log(error)
          )
          if (res) {
            this.$message.success(this.$t(`login.resetSuccess`))
            this.openLogin()
          }
        }
      })
    }
  },
  watch: {
    retrieveToken (new_val, old_val) {
      if (new_val) {
        this.currentStep = 'setpass'
      }
    }
  }
}
</script>
<style lang="less" scoped>
h1,
h2 {
  margin: 0;
}

.title {
  color: #303133;
  font-weight: 600;
  font-size: 24px;
  text-align: left;
}

.subtitle {
  margin: 10px 0 25px;
  color: #8590a6;
  font-weight: 400;
  font-size: 15px;
  text-align: left;
}

.content {
  color: #606266;
  font-weight: 500;
  font-size: 17px;
  text-align: left;
}

.btn-theme {
  color: #fff;
  background: @themeColor;
  border: none;
}

.input {
  background: #fff !important;
}

.btn-theme:hover {
  background: #0066ffc2;
}

.btn-md {
  width: 100%;
  padding: 12px 30px 11px 30px;
  font-weight: 400;
  font-size: 14px;
  letter-spacing: 1px;
  border-radius: 4px;
  cursor: pointer;
}

/deep/ .el-input-group__append {
  background-color: rgb(232, 240, 254);
  cursor: pointer;
}
</style>
