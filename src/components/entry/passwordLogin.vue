<template>
  <div class="pure-login">
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-7 col-md-12 col-pad-0 form-section">
          <div class="login-inner-form">
            <div class="details">
              <header>
                <a href="#">
                  <img src="@assets/icons/logo/default-logo.png" alt="logo" />
                </a>
              </header>
              <section>
                <el-form :model="loginForm" status-icon :rules="rules" ref="loginForm" hide-required-asterisk>
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
                <el-button type="submit" @click="login" v-loading="loading" class="btn-md btn-theme btn-block login-btn">登录</el-button>
              </section>
            </div>
          </div>
        </div>
        <div class="col-lg-5 col-md-12 col-pad-0 bg-img none-992">
          <div class="information">
            <h3>Zadig，让工程师更加专注创造～</h3>
            <p>工程师热爱的云原生持续交付平台：具备灵活易用的高并发工作流、面向开发者的云原生环境、高效协同的测试管理、强大免运维的模板库、客观精确的效能洞察以及云原生 IDE 插件等重要特性，为工程师提供统一的协作平面。</p>
          </div>
        </div>
      </div>
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

export default {
  data () {
    return {
      loading: false,
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
      moment
    }
  },
  methods: {
    login () {
      this.$refs.loginForm.validate(async () => {
        this.loading = true
        const payload = this.loginForm
        const res = await this.$store.dispatch('LOGIN', payload)
        this.loading = false
        if (res) {
          this.$router.push('/v1/projects')
        }
      })
    }
  },
  computed: {
    processEnv () {
      return process.env
    }
  }
}
</script>
<style lang="less" scoped>
@import url('~@assets/css/quote/bootstarp.less');

.pure-login {
  .information {
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

        img {
          height: 60px;
        }

        .btn-md {
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
    width: 100%;
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
