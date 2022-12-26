<template>
  <div class="login">
    <div class="container-fluid">
      <el-row type="flex">
        <el-col :xs="24" :sm="24" :md="13" :lg="13" class="form-section">
          <div class="login-inner-form" v-show="!showForgotPassword && !showSignUp">
            <div class="details">
              <header>
                <a href="#">
                  <img v-if="bigLogoUrl" :src="bigLogoUrl" alt="logo" />
                  <img v-else src="@assets/icons/logo/default-logo.png" alt="logo" />
                </a>
              </header>
              <section>
                <el-form :model="loginForm" status-icon :rules="rules" ref="loginForm" label-position="left" hide-required-asterisk>
                  <el-form-item label="用户名" prop="account">
                    <el-input v-model="loginForm.account" placeholder="请输入用户名" autocomplete="off"></el-input>
                  </el-form-item>
                  <el-form-item label="密码" prop="password">
                    <el-input
                      type="password"
                      @keyup.enter.native="login"
                      v-model="loginForm.password"
                      autocomplete="off"
                      placeholder="请输入密码"
                      show-password
                    ></el-input>
                  </el-form-item>
                </el-form>
                <el-button type="submit" @click="login" v-loading="loading" class="btn-md btn-theme login-btn">登录</el-button>
              </section>
              <div class="bottom">
                <a @click="showForgotPassword = true">找回密码</a>
                <span v-if="showRegistration" class="divide">|</span>
                <a v-if="showRegistration" @click="showSignUp = true">注册</a>
              </div>
            </div>
          </div>
          <div class="login-inner-form" v-show="showForgotPassword">
            <ForgetPassword :openLogin="checkLogin" :retrieveToken="retrieveToken" />
          </div>
          <div class="login-inner-form" v-show="showSignUp">
            <SignUp :openLogin="afterSignUp" />
          </div>
        </el-col>
        <el-col class="bg-img none-992" :xs="0" :sm="0" :md="11" :lg="11">
          <div class="information">
            <h3>{{showCopywriting.title}}</h3>
            <p>{{showCopywriting.content}}</p>
          </div>
        </el-col>
      </el-row>
    </div>
    <footer>
      <div class="copyright">
        筑栈（上海）信息技术有限公司 KodeRover ©{{moment().format('YYYY')}}
        <el-tooltip>
          <div slot="content">
            <span v-if="processEnv.VERSION">Version: {{processEnv.VERSION}}</span>
            <br />
            <span v-if="processEnv.BUILD_TIME">Build Time: {{moment.unix(processEnv.BUILD_TIME).format('YYYYMMDDHHmm')}}</span>
            <br />
            <span v-if="processEnv.TAG">Tag: {{processEnv.TAG}}</span>
          </div>
          <span v-if="processEnv && processEnv.BUILD_TIME" class="el-icon-info"></span>
        </el-tooltip>
      </div>
    </footer>
  </div>
</template>
<script>
import moment from 'moment'
import { isMobile } from 'mobile-device-detect'
import {
  checkConnectorsAPI,
  checkRegistrationAPI,
  getEnterpriseInfoAPI,
  getLicenseStatusAPI
} from '@api'
import ForgetPassword from './components/forgetPassword.vue'
import SignUp from './components/signUp.vue'
import store from 'storejs'

export default {
  components: {
    ForgetPassword,
    SignUp
  },
  data () {
    return {
      showForgotPassword: false,
      showSignUp: false,
      showConnectors: false,
      showRegistration: false,
      retrieveToken: '',
      loading: false,
      enterpriseInfo: null,
      loginForm: {
        account: '',
        password: ''
      },
      rules: {
        account: [
          { required: true, message: '请输入用户名', trigger: 'change' }
        ],
        password: [{ required: true, message: '请输入密码', trigger: 'change' }]
      },
      moment,
      copywriting: {
        common: {
          title: 'Zadig，让工程师更加专注创造～',
          content:
            '工程师热爱的云原生持续交付平台：具备灵活易用的高并发工作流、面向开发者的云原生环境、高效协同的测试管理、强大免运维的模板库、客观精确的效能洞察以及云原生 IDE 插件等重要特性，为工程师提供统一的协作平面。'
        }
      }
    }
  },
  methods: {
    login () {
      this.$refs.loginForm.validate(async valid => {
        if (valid) {
          this.loading = true
          const payload = this.loginForm
          const res = await this.$store.dispatch('LOGIN', payload)
          if (res) {
            this.loading = false
            this.redirectByDevice()
          } else {
            this.loading = false
          }
        } else {
          return false
        }
      })
    },
    async checkLogin () {
      const userInfo = store.get('userInfo')
      if (userInfo) {
        this.redirectByDevice()
      } else {
        const connectorsCheck = await checkConnectorsAPI()
        if (connectorsCheck && connectorsCheck.enabled) {
          window.location.href = '/api/v1/login'
        }
      }
    },
    async afterSignUp () {
      this.showSignUp = false
      const connectorsCheck = await checkConnectorsAPI()
      if (connectorsCheck && connectorsCheck.enabled) {
        window.location.href = '/api/v1/login'
      }
    },
    redirectByDevice () {
      if (isMobile) {
        this.$router.push('/mobile/projects')
      } else {
        if (
          typeof this.$route.query.redirect !== 'undefined' &&
          this.$route.query.redirect !== '/'
        ) {
          this.$router.push(this.$route.query.redirect)
        } else {
          this.$router.push('/v1/projects')
        }
      }
    },
    async getLicenseStatus () {
      const license = await getLicenseStatusAPI().catch(err => console.log(err))
      if (license) {
        if (!license.is_inited) {
          // this.$router.replace('/license')
          window.location.href = '/plutus-vendor/license'
        } else {
          getEnterpriseInfoAPI().then(res => {
            this.enterpriseInfo = res
          })
        }
      }
    }
  },
  computed: {
    processEnv () {
      return process.env
    },
    showCopywriting () {
      return this.copywriting.common
    },
    bigLogoUrl () {
      if (this.enterpriseInfo) {
        return this.enterpriseInfo.big_logo
      } else {
        return ''
      }
    }
  },
  async mounted () {
    this.getLicenseStatus()
    const token = this.$route.query.token
    // 邮箱通过 Token 设置新密码接收参数
    const retrieveToken = this.$route.query.idtoken
    // Dex 找回密码接收参数
    const findPassword = this.$route.query.findPassword
    // Dex 注册接收参数
    const signUp = this.$route.query.signUp
    // 注册检测
    const registrationCheck = await checkRegistrationAPI()
    if (registrationCheck && registrationCheck.enabled) {
      this.showRegistration = true
    } else {
      this.showRegistration = false
    }
    if (retrieveToken) {
      this.retrieveToken = retrieveToken
      this.showForgotPassword = true
    } else if (findPassword) {
      this.showForgotPassword = true
    } else if (signUp) {
      this.showSignUp = true
    } else if (token) {
      const res = await this.$store
        .dispatch('OTHERLOGIN', token)
        .catch(error => console.log(error))
      if (res) {
        this.redirectByDevice()
      }
    } else {
      // this.checkLogin()
    }
  }
}
</script>
<style lang="less" scoped>
.login {
  .container-fluid {
    width: 100%;
    margin: 0 auto;
  }

  .information {
    display: flex;
    flex-direction: column;
    margin: 0 20px 0 70px;
    color: #fff;

    h3 {
      margin-bottom: 20px;
      color: #fff;
      font-size: 25px;
    }

    p {
      margin-bottom: 20px;
      color: #fff;
      line-height: 28px;
    }
  }

  .form-section {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 30px;
    text-align: center;

    .login-inner-form {
      width: 100%;
      max-width: 350px;
      color: #717171;
      text-align: center;

      .details {
        font-size: 15px;

        p {
          margin: 0;
          color: #717171;
          font-size: 14px;

          a {
            color: #717171;
            font-weight: 500;
          }
        }

        img {
          width: 200px;
          height: 60px;
          object-fit: contain;
        }

        h3 {
          margin: 0 0 25px;
          color: #717171;
          font-weight: 400;
          font-size: 14px;
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

        /deep/ .el-form-item {
          margin-bottom: 18px;
        }

        /deep/ .el-input {
          .el-input__inner {
            border-radius: 0.25rem;
          }
        }

        /deep/ .el-form-item__label {
          color: #717171;
        }

        input[type='checkbox'],
        input[type='radio'] {
          margin-top: 4px;
        }

        input[type='checkbox']:checked + label::before {
          color: #f3f3f3;
          font-weight: 300;
          font-size: 14px;
          line-height: 15px;
          content: '\2713';
        }

        button:focus {
          outline: none;
          outline: 0 auto -webkit-focus-ring-color;
        }

        .btn-theme {
          color: #fff;
          background: @themeColor;
          border: none;
          border-radius: 0.25rem;
        }

        .btn-theme.focus,
        .btn-theme:focus {
          box-shadow: none;
        }

        .btn-theme:hover {
          background: #0066ffc2;
        }

        .login-btn {
          margin-bottom: 8px;
        }

        .bottom {
          display: flex;
          align-items: center;
          float: right;
          padding: 0 10px;

          .divide {
            color: #ced4da;
          }

          a {
            padding-right: 10px;
            padding-left: 10px;
            color: #717171;
            font-size: 14px;
            cursor: pointer !important;

            &:hover {
              color: @themeColor !important;
              text-decoration-line: none;
            }
          }
        }
      }
    }
  }

  .bg-img {
    position: relative;
    top: 0;
    bottom: 0;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 30px 30px;
    text-align: left;
    background:
      rgba(0, 0, 0, 0.04) url('~@assets/background/login.jpg') top
      left repeat;
    background-size: cover;
    border-radius: 100% 0 0 100%;
    opacity: 1;
  }

  footer {
    display: flex;
    justify-content: center;

    .copyright {
      position: absolute;
      bottom: 0;
      margin-bottom: 30px;
      color: #8f9bb2;
      font-size: 14px;
    }
  }
}

@media (max-width: 992px) {
  .login .none-992 {
    display: none;
  }

  .login .form-section {
    padding: 30px 15px;
  }
}
</style>
