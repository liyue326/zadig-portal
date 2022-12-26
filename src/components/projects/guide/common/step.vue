<template>
  <div class="step-container">
    <div class="step-detail">
      <div class="guide-title">
        <h4>{{$t('project.onboardingComp.projectOnboarding')}}</h4>
      </div>
      <el-row :gutter="0" class="steps-wrap" type="flex">
        <el-col :span="envDisabled?24:18" style="display: flex;">
          <OnboardingSteps :active="activeStep" class="steps-container" align-center simple finish-status="success">
            <OnboardingStep :title="$t('project.onboardingComp.projectConfiguration')" description />
            <OnboardingStep :title="$t('project.onboardingComp.createService')" description />
            <OnboardingStep :title="thirdStepTitle" description />
            <OnboardingStep :title="$t('project.onboardingComp.runWorkflow')" description />
          </OnboardingSteps>
        </el-col>
        <el-col v-if="!envDisabled" :span="6">
          <div class="envs">
            <span v-show="activeStep === 3" class="loaders">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span class="env-blocks" :class="{'en-mode':'en'=== $i18n.locale}">
              <i class="iconfont iconvery-environ"></i>
              <span class="name">{{$t('project.onboardingComp.devEnv')}}</span>
            </span>
          </div>
          <div class="envs">
            <span v-show="activeStep === 3" class="loaders">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span class="env-blocks" :class="{'en-mode':'en'=== $i18n.locale}">
              <i class="iconfont iconvery-environ"></i>
              <span class="name">{{$t('project.onboardingComp.testEnv')}}</span>
            </span>
          </div>
          <div class="envs">
            <span v-show="activeStep === 3" class="loaders">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span class="env-blocks" :class="{'en-mode':'en'=== $i18n.locale}">
              <i class="iconfont iconvery-environ"></i>
              <span class="name">{{$t('project.onboardingComp.preReleaseEnv')}}</span>
            </span>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import OnboardingSteps from '@/common/steps/src/steps.vue'
import OnboardingStep from '@/common/steps/src/step.vue'
export default {
  data () {
    return {}
  },
  props: {
    activeStep: {
      required: true,
      type: Number
    },
    thirdStepTitle: {
      default: '加入环境',
      type: String
    },
    envDisabled: {
      default: false,
      type: Boolean
    }
  },
  components: {
    OnboardingSteps,
    OnboardingStep
  }
}
</script>
<style lang="less" scoped>
@keyframes pulse {
  0% {
    opacity: 0.15;
  }

  24% {
    opacity: 1;
  }

  48% {
    opacity: 0.15;
  }
}

.step-container {
  display: flex;
  flex-direction: row;

  .step-detail {
    width: 100%;

    .guide-title {
      display: flex;

      h4 {
        width: 130px;
        margin: 0 0 0 20px;
        padding: 8px;
        color: #fff;
        font-weight: 300;
        font-size: 16px;
        text-align: center;
        background: @themeColor;
      }
    }

    .steps-wrap {
      padding: 0 20px;

      .steps-container {
        width: 100%;
      }
    }

    .envs {
      display: flex;
      margin-bottom: 7px;

      &:last-child {
        margin-bottom: 0;
      }

      .loaders {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin-right: 24px;

        span {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 4px;
          background: #55c32d;
          border-radius: 50%;
          opacity: 0;
          animation-name: pulse;
          animation-duration: 1.2s;
          animation-iteration-count: infinite;

          &:nth-child(2) {
            animation-delay: 0.12s;
          }

          &:nth-child(3) {
            animation-delay: 0.24s;
          }

          &:nth-child(4) {
            animation-delay: 0.36s;
          }
        }
      }

      .env-blocks {
        display: flex;
        flex-direction: row;
        align-content: center;
        align-items: center;
        justify-content: flex-start;
        width: 90px;
        margin-bottom: 0;
        padding: 6px 16px;
        text-align: left;
        border: 1px solid rgba(85, 195, 45, 0.25);
        border-radius: 2px;

        i {
          display: inline-flex;
          color: #5daf34;
          font-size: 16px;
        }

        .name {
          margin-left: 10px;
          color: #5daf34;
          font-size: 12px;
          line-height: 16px;
        }

        &.en-mode {
          width: 160px;
        }
      }
    }
  }
}
</style>
