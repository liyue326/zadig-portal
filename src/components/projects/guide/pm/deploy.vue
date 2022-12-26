<template>
  <div class="projects-runtime-container">
    <div class="guide-container">
      <Step :thirdStepTitle="$t('environments.common.envCreation')" :activeStep="2" envDisabled/>
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">{{$t('project.onboardingComp.thirdStep')}}</span>
          <span class="second">{{$t('project.onboardingComp.cloudHostThirdStepTip')}}</span>
        </div>
        <div class="info-container block-list">
          <div class="title">
            <h4>{{$t('project.onboardingComp.environmentsPreparation')}}</h4>
            <el-alert v-if="envFailure.length > 0||timeOut" type="warning" show-icon>
              <template v-slot:title>
                <span>{{$t('project.onboardingComp.environmentsPreparationTimeoutTip')}}</span>
                <span class="view-env-btn" @click="viewEnvStatus">{{$t('project.onboardingComp.toViewEnvironmentStatus')}}</span>
                <i v-if="exitLoading"
                   class="el-icon-loading"></i>
              </template>
            </el-alert>
          </div>
          <div class="info-block">
            <div class="info-block-item">
              <div class="info-block-item-card">
                <div class="integration-card__image">
                  <el-button v-if="envSuccess.length === 2"
                             type="success"
                             icon="el-icon-check"
                             circle></el-button>
                  <el-button v-else
                             icon="el-icon-loading"
                             circle></el-button>
                </div>
                <div class="integration-card__info">
                  <div v-for="(env,index) in envStatus"
                       :key="index"
                       class="integration-details">
                    <template v-if="env.env_name==='dev'">
                      <span class="env-name">
                        {{$t('project.onboardingComp.environmentDevPreparationTip',{ projectName:projectName })}}
                      </span>
                      <el-link v-if="env.err_message!==''"
                               type="warning">{{env.err_message}}</el-link>
                    </template>
                    <template v-if="env.env_name==='qa'"
                              class="env-item">
                      <span class="env-name">
                        {{$t('project.onboardingComp.environmentTestPreparationTip',{ projectName:projectName })}}
                      </span>
                      <el-link v-if="env.err_message!==''"
                               type="warning">{{env.err_message}}</el-link>
                    </template>

                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="title">
            <h4>{{$t('project.onboardingComp.workflowsPreparation',{ projectName:projectName })}}</h4>
            <el-alert v-if="workflowStatus.err_message"
                      :title="workflowStatus.err_message"
                      type="warning" show-icon>
            </el-alert>
          </div>
          <div class="info-block">
            <div class="info-block-item">
              <div class="info-block-item-card">
                <div class="integration-card__image">
                  <el-button v-if="workflowStatus.status === 'success'"
                             type="success"
                             icon="el-icon-check"
                             circle></el-button>
                  <el-button v-else
                             icon="el-icon-loading"
                             circle></el-button>
                </div>
                <div class="integration-card__info">
                  <div class="integration-details">
                    {{$t('project.onboardingComp.workflowDevPreparation',{ projectName:projectName })}}
                  </div>
                  <div class="integration-details">
                    {{$t('project.onboardingComp.workflowTestPreparation',{ projectName:projectName })}}
                  </div>
                  <div class="integration-details">
                    {{$t('project.onboardingComp.workflowOpsPreparation',{ projectName:projectName })}}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="controls__wrap">
      <div class="controls__right">
        <router-link :to="`/v1/projects/create/${projectName}/pm/delivery`">
          <el-button v-if="!getResult"
                  type="primary"
                  size="small"
                  disabled>{{$t('project.onboardingComp.nextStep')}}</el-button>
          <el-button v-else-if="getResult"
                  size="small"
                  type="primary">{{$t('project.onboardingComp.nextStep')}}</el-button>
        </router-link>
      </div>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Step from '../common/step.vue'
import { generateEnvAPI, generateWorkflowAPI } from '@api'
export default {
  data () {
    return {
      envStatus: [{ env_name: 'dev' }, { env_name: 'qa' }],
      workflowStatus: {},
      getResult: false,
      envTimer: 0,
      workflowTimer: 0,
      secondCount: 0,
      timeOut: 0,
      exitLoading: false
    }
  },
  methods: {
    viewEnvStatus () {
      this.$confirm('跳出后进入项目将不再进入向导流程', '确认跳出项目初始化向导？', {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(() => {
        this.exitLoading = true
        this.saveOnboardingStatus(this.projectName, 0).then((res) => {
          this.$router.push(`/v1/projects/detail/${this.projectName}/envs`)
        }).catch(() => {
          this.exitLoading = false
        })
      }).catch(() => {
        this.$message.info('取消跳转')
      })
    },
    generateEnv (projectName) {
      const getEnv = new Promise((resolve, reject) => {
        generateEnvAPI(projectName).then((res) => {
          this.$set(this, 'envStatus', res)
          resolve(res)
        }).catch((err) => {
          console.log(err)
        })
      })
      getEnv.then((env_res) => {
        const successResult = env_res.filter(env => env.status === 'Running')
        const failureResult = env_res.filter(env => (env.err_message && env.err_message !== ''))
        if (successResult.length === 2) {
          clearInterval(this.envTimer)
          this.timeOut = false
          this.getResult = true
        }
        if (failureResult.length >= 1) {
          clearInterval(this.envTimer)
          this.timeOut = false
          this.getResult = true
        }
        if (this.secondCount === 60) {
          clearInterval(this.envTimer)
          this.timeOut = true
          this.getResult = true
        }
        this.workflowTimer = setInterval(() => {
          this.generateWorkflow(this.projectName)
        }, 1000)
      })
    },
    generateWorkflow (projectName) {
      if (this.workflowStatus.status === 'success') {
        clearInterval(this.workflowTimer)
      } else {
        generateWorkflowAPI(projectName).then((res) => {
          this.$set(this, 'workflowStatus', res)
        })
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envSuccess () {
      const result = this.envStatus.filter(env => env.status === 'Running')
      return result
    },
    envFailure () {
      const result = this.envStatus.filter(env => (env.err_message && env.err_message !== ''))
      return result
    }
  },
  created () {
    if (this.envTimer) {
      clearInterval(this.envTimer)
    } else {
      this.envTimer = setInterval(() => {
        this.secondCount++
        this.generateEnv(this.projectName)
      }, 1000)
    };
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' }, { title: this.projectName, isProjectName: true, url: '' }] })
  },
  beforeDestroy () {
    clearInterval(this.envTimer)
    clearInterval(this.workflowTimer)
  },
  components: {
    Step
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

  .controls__wrap {
    position: relative;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 20px;
    background-color: #fff;

    & > * {
      margin-right: 10px;
    }

    .controls__right {
      display: flex;
      align-items: center;

      a {
        margin-right: 15px;
      }
    }
  }

  .guide-container {
    min-height: calc(~"100% - 70px");
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

      .info-container {
        .el-alert--warning {
          padding-left: 8px;
        }

        .view-env-btn {
          color: @themeColor;
          cursor: pointer;
        }
      }

      .block-list {
        flex: 1;
        margin-top: 15px;
        padding: 0 30px;
        overflow-y: auto;
        background-color: inherit;

        .title {
          h4 {
            margin: 10px 0;
            color: #4c4c4c;
            font-weight: 400;
          }

          a {
            color: inherit;
            text-decoration-color: inherit;
          }
        }

        .info-block {
          min-height: 102px;

          .info-block-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 20px 30px;
            background-color: #fff;
            border-radius: 6px;

            .info-block-item-card {
              display: flex;
              align-items: center;
              justify-content: flex-start;

              .integration-card__image {
                width: 64px;

                .el-button.is-circle {
                  padding: 6px;
                  border-radius: 50%;
                }
              }

              .cf-sub-title {
                color: #2f2f2f;
                font-weight: bold;
                font-size: 16px;
                text-align: left;
              }

              .integration-details {
                margin-bottom: 5px;
                color: #4c4c4c;
                font-size: 14px;
                line-height: 20px;

                .env-name {
                  display: inline-block;
                }

                .desc {
                  display: inline-block;
                  width: 250px;
                }

                &:last-child {
                  margin-bottom: 0;
                }
              }
            }

            .info-block-item-card > * {
              flex: 0 0 auto;
            }
          }
        }
      }
    }
  }
}
</style>
