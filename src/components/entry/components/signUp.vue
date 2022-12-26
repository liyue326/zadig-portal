<template>
  <div>
    <div>
      <h1 class="title">{{$t(`signUp.signUp`)}}</h1>
      <h2 class="subtitle">{{$t(`signUp.inputUserInfo`)}}</h2>
      <el-form :model="signUpForm" ref="signUpForm" :rules="rules" label-position="left" label-width="90px">
        <el-form-item :label="$t(`signUp.username`)" prop="account">
          <el-input v-model="signUpForm.account" :placeholder="$t(`signUp.inputUsername`)"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`signUp.nickname`)" prop="name">
          <el-input v-model="signUpForm.name" :placeholder="$t(`signUp.inputNickname`)"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`signUp.mail`)" prop="email">
          <el-input type="email" v-model.trim="signUpForm.email" :placeholder="$t(`signUp.inputMail`)"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`signUp.password`)" prop="password">
          <el-input v-model="signUpForm.password" :placeholder="$t(`signUp.inputPass`)"></el-input>
        </el-form-item>
      </el-form>
      <el-button type="submit" @click="submit" class="btn-md btn-theme btn-block login-btn">{{$t(`signUp.signUp`)}}</el-button>
    </div>
  </div>
</template>
<script>
import { userSignUpAPI } from '@api'
export default {
  name: 'signUp',
  props: {
    openLogin: Function
  },
  data () {
    return {
      mail: '',
      signUpForm: {
        name: '',
        account: '',
        password: '',
        email: '',
        phone: ''
      }
    }
  },
  computed: {
    rules () {
      return {
        account: [
          {
            type: 'string',
            required: true,
            message: this.$t(`signUp.inputUsername`),
            trigger: 'blur'
          }
        ],
        email: [
          {
            type: 'string',
            required: true,
            message: this.$t(`signUp.inputMail`),
            trigger: 'blur'
          },
          {
            type: 'email',
            message: this.$t(`signUp.inputMailCheck`),
            trigger: ['blur', 'change']
          }
        ],
        name: [
          {
            type: 'string',
            required: true,
            message: this.$t(`signUp.inputNickname`),
            trigger: 'blur'
          }
        ],
        password: [
          {
            type: 'string',
            required: true,
            message: this.$t(`signUp.inputPass`),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  methods: {
    async submit () {
      this.$refs.signUpForm.validate(async valid => {
        if (valid) {
          const payload = this.signUpForm
          const res = await userSignUpAPI(payload).catch(error =>
            console.log(error)
          )
          if (res) {
            this.$message.success(this.$t(`signUp.signUpSuccess`))
            this.openLogin()
          }
        }
      })
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
