<template>
  <div>
    <div>
      <h1 class="title">用户注册</h1>
      <h2 class="subtitle">请输入新用户信息</h2>
      <el-form :model="signUpForm" ref="signUpForm" :rules="rules" label-position="left" label-width="80px">
        <el-form-item label="用户名" prop="account">
          <el-input v-model="signUpForm.account" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="name">
          <el-input v-model="signUpForm.name" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input type="email" v-model.trim="signUpForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="signUpForm.password" placeholder="请输入密码"></el-input>
        </el-form-item>
      </el-form>
      <el-button type="submit" @click="submit" class="btn-md btn-theme btn-block login-btn">注册</el-button>
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
      },
      rules: {
        account: [
          {
            type: 'string',
            required: true,
            message: '请输入用户名',
            trigger: 'blur'
          }
        ],
        email: [
          {
            type: 'string',
            required: true,
            message: '请输入邮箱',
            trigger: 'blur'
          },
          {
            type: 'email',
            message: '请输入正确的邮箱地址',
            trigger: ['blur', 'change']
          }
        ],
        name: [
          {
            type: 'string',
            required: true,
            message: '请输入昵称',
            trigger: 'blur'
          }
        ],
        password: [
          {
            type: 'string',
            required: true,
            message: '请输入密码',
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
            window.console.log(error)
          )
          if (res) {
            this.$message.success('用户注册成功')
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
