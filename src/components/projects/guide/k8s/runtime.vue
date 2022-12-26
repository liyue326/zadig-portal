<template>
  <div class="projects-runtime-container">
    <div class="guide-container">
      <Step :activeStep="2" :thirdStepTitle="$t('environments.common.envCreation')" />
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">{{$t('project.onboardingComp.thirdStep')}}</span>
          <span class="second">{{$t('project.onboardingComp.thirdStepTip')}}</span>
        </div>
        <div class="account-integrations block-list">
          <div class="second">{{$t('project.onboardingComp.configureTheFollowingEnvironments')}}</div>
          <el-tabs v-model="activeName" type="card" @edit="handleTabsEdit">
            <el-tab-pane
              v-for="env in envInfos"
              :key="env.envName"
              :label="env.envName"
              :name="env.initName"
              :closable="!env.isEdit && canHandle"
            >
              <span slot="label">
                <span v-if="env.isEdit && canHandle" class="tab-label">
                  <el-input
                    v-model="env.envName"
                    :placeholder="env.initName"
                    v-focus
                    @keyup.enter.native="validateEnvName(env.envName, env)"
                  ></el-input>
                  <i class="el-icon-finished" @click="validateEnvName(env.envName, env)" v-if="canHandle"></i>
                </span>
                <span v-else class="tab-label">
                  <span @dblclick="env.isEdit = true">{{env.envName}}</span>
                  <i class="el-icon-edit" @click="env.isEdit = true" v-if="canHandle"></i>
                </span>
              </span>
            </el-tab-pane>
            <el-tab-pane name="addNew" v-if="canHandle">
              <span slot="label" @click="handleTabsEdit('', 'add')">{{$t('environments.common.envCreation')}}</span>
            </el-tab-pane>
          </el-tabs>
          <!-- 创建环境 -->
          <div
            :class="[cantNext ? '' : 'frozen']"
            v-loading="!cantNext"
            element-loading-spinner="el-icon-d-arrow-right"
            :element-loading-text="$t('project.onboardingComp.clickNextTip')"
            element-loading-background="rgba(255, 255, 255, 0.6)"
          >
            <CreateEnv ref="createEnvRef" :envInfos="envInfos" :currentEnv="activeName" />
          </div>
          <div class="ai-bottom">
            <el-button type="primary" size="small" @click="createK8sProductEnv" :loading="isCreating" :disabled="!cantNext">{{$t('environments.common.envCreation')}}</el-button>
            <div v-for="(env, index) in createRes" :key="index" class="ai-status">
              <span class="env-name">{{env.name}}:</span>
              <span>{{getStatusDesc(env)}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="controls__wrap">
      <div class="controls__right">
        <router-link :to="`/v1/projects/create/${projectName}/k8s/delivery`">
          <el-button type="primary" size="small" :disabled="cantNext">{{$t('project.onboardingComp.nextStep')}}</el-button>
        </router-link>
      </div>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Step from '../common/step.vue'
import CreateEnv from './createEnv.vue'
import { createEnvAPI, getEnvironmentsAPI } from '@api'
export default {
  data () {
    return {
      envInfos: [
        {
          envName: 'dev',
          isEdit: false,
          initName: 'dev',
          projectConfig: null
        },
        {
          envName: 'qa',
          isEdit: false,
          initName: 'qa',
          projectConfig: null
        }
      ],
      cantNext: true,
      activeName: 'dev',
      isCreating: false,
      createRes: [],
      sId: null
    }
  },
  methods: {
    // valid environment name
    // valid when creating environment as well
    validateEnvName (name, env) {
      let message = ''
      if (typeof name === 'undefined' || name === '') {
        message = this.$t('environments.common.inputEnvName')
      } else if (!/^[a-z0-9-]+$/.test(name)) {
        message = this.$t('environments.common.checkEnvName')
      }
      if (message) {
        this.$message.error(message)
        return false
      }
      if (env) {
        env.isEdit = false
        this.$refs.createEnvRef.changeEnvName(name)
      }
      return true
    },
    async getProducts () {
      const res = await getEnvironmentsAPI(this.projectName).catch(err => {
        console.log(err)
      })
      if (res && res.length > 0) {
        this.envInfos = res.map(re => {
          return {
            envName: re.name,
            isEdit: false,
            initName: re.name,
            projectConfig: null
          }
        })
        this.activeName = this.envInfos[0].initName

        this.isCreating = true
        this.sId = setTimeout(this.checkEnvStatus, 0)
      }
    },
    getStatusDesc (envInfo) {
      let res = ''
      switch (envInfo.status) {
        case 'creating':
          res = this.$t('environments.common.envIsCreating')
          break
        case 'success':
          res = this.$t('environments.common.environmentHasBeenSuccessfullyCreated')
          break
        case 'failed':
          res = this.$t('environments.common.environmentCreationFailedWithError', { error: envInfo.error })
          break
        case 'Unstable':
          res = this.$t('environments.common.environmentCreationUnstable')
          break
        default:
          res = envInfo.status
      }
      return res
    },
    async createK8sProductEnv () {
      // todo: create k8s env
      const payload = await this.$refs.createEnvRef.deployK8sEnv()
      if (payload) {
        this.isCreating = true
        const res = await createEnvAPI(
          this.projectName,
          payload,
          '',
          'k8s'
        ).catch(err => {
          console.log(err)
          this.isCreating = false
        })
        if (res) {
          this.sId = setTimeout(this.checkEnvStatus, 0)
        }
      }
    },
    async checkEnvStatus () {
      const res = await getEnvironmentsAPI(this.projectName).catch(err => {
        console.log(err)
        if (this.sId) this.sId = setTimeout(this.checkEnvStatus, 2000)
      })
      if (res) {
        this.createRes = res
        const notValid = res.filter(r => r.status === 'creating')
        if (notValid.length && this.sId) {
          this.sId = setTimeout(this.checkEnvStatus, 2000)
        } else {
          clearTimeout(this.sId)
          this.sId = null
          this.isCreating = false
          this.cantNext = false
        }
      }
    },
    handleTabsEdit (targetName, action) {
      this.envLength = this.envLength + 1 || this.envInfos.length
      if (action === 'add') {
        const newTabName = `env-${this.envLength}`
        this.envInfos.push({
          envName: newTabName,
          isEdit: true,
          initName: newTabName,
          projectConfig: null
        })
        setTimeout(() => {
          this.activeName = newTabName
        })
      } else if (action === 'remove') {
        this.envInfos = this.envInfos.filter(env => env.initName !== targetName)
        if (this.activeName === targetName) {
          this.activeName = this.envInfos[0] ? this.envInfos[0].envName : ''
        }
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envNames () {
      return this.envInfos.map(info => info.initName)
    },
    canHandle () {
      return !this.isCreating && this.cantNext
    }
  },
  created () {
    bus.$emit(`show-sidebar`, true)
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        { title: this.projectName, isProjectName: true, url: '' }
      ]
    })

    this.getProducts()
  },
  beforeDestroy () {
    this.sId = null
  },
  components: {
    Step,
    CreateEnv
  },
  directives: {
    focus: {
      inserted: function (el) {
        el.querySelector('input').focus()
      }
    }
  },
  onboardingStatus: 3
}
</script>

<style lang="less" scoped>
.projects-runtime-container {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .guide-container {
    min-height: calc(~'100% - 70px');
    margin-top: 10px;

    .current-step-container {
      .title-container {
        margin-left: 20px;

        .first {
          display: inline-block;
          width: 130px;
          padding: 8px;
          color: #fff;
          font-weight: 300;
          font-size: 16px;
          text-align: center;
          background: @themeColor;
        }

        .second {
          color: #4c4c4c;
          font-size: 13px;
        }
      }

      .account-integrations {
        .second {
          margin-bottom: 8px;
          color: #4c4c4c;
          font-size: 13px;
        }

        .el-tabs__new-tab {
          color: #06f;
          border-color: #06f;
        }

        .tab-label {
          display: inline-flex;
          align-items: center;

          .el-input {
            width: auto;

            .el-input__inner {
              border-color: #fff;
            }
          }

          .el-icon-edit,
          .el-icon-finished {
            width: 0;
            overflow: hidden;
            transform-origin: 100% 50%;
          }
        }

        .el-tabs--card > .el-tabs__header .el-tabs__item.is-active {
          border-bottom-color: @globalBackgroundColor;
        }

        .el-tabs--card > .el-tabs__header .el-tabs__item.is-active,
        .el-tabs--card > .el-tabs__header .el-tabs__item:hover {
          .el-icon-close {
            font-size: 16px;
          }

          .el-icon-edit,
          .el-icon-finished {
            width: 14px;
            margin-left: 10px;
          }
        }

        .frozen {
          height: calc(~'100vh - 480px');
          overflow: hidden;
        }

        .ai-bottom {
          margin-top: 10px;

          .ai-status {
            margin: 8px 0;
            font-size: 13px;

            .env-name {
              display: inline-block;
              margin-right: 8px;
              color: #e6a23c;
            }
          }
        }
      }

      .block-list {
        flex: 1;
        margin-top: 15px;
        padding: 0 30px;
        overflow-y: auto;
        background-color: inherit;
      }
    }
  }

  .controls__wrap {
    position: relative;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    height: 60px;
    padding: 0 10px;
    background-color: #fff;
  }
}
</style>
