<template>
  <div class="host-step-container">
    <div class="step-detail">
      <div class="guide-title">
        <h4>{{$t('project.onboardingComp.projectOnboarding')}}</h4>
      </div>
      <OnboardingSteps :active="activeStep" class="steps-container" align-center simple finish-status="success">
        <OnboardingStep :title="$t('project.onboardingComp.configureEnvHosting')" description />
        <OnboardingStep :title="$t('project.onboardingComp.configureServiceBuild')" description />
        <OnboardingStep :title="$t('project.onboardingComp.runWorkflow')" description />
      </OnboardingSteps>
    </div>
    <div class="title-container">
      <span class="first">{{stepMap[activeStep].title}}</span>
      <span class="second">{{stepMap[activeStep].description}}</span>
    </div>
  </div>
</template>
<script>
import OnboardingSteps from '@/common/steps/src/steps.vue'
import OnboardingStep from '@/common/steps/src/step.vue'
export default {
  computed: {
    stepMap () {
      return [
        {
          title: this.$t('project.onboardingComp.firstStep'),
          description: this.$t('project.onboardingComp.hostingFirstStepTip')
        },
        {
          title: this.$t('project.onboardingComp.secondStep'),
          description: this.$t('project.onboardingComp.hostingSecondStepTip')
        },
        {
          title: this.$t('project.onboardingComp.thirdStep'),
          description: this.$t('project.onboardingComp.hostingThirdStepTip')
        }
      ]
    }
  },
  props: {
    activeStep: {
      required: true,
      type: Number
    }
  },
  components: {
    OnboardingSteps,
    OnboardingStep
  }
}
</script>
<style lang="less">
.host-step-container {
  padding-top: 10px;

  .title-container {
    margin-bottom: 10px;
    margin-left: 20px;
    padding-top: 40px;

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
      display: inline-block;
      color: #4c4c4c;
      font-size: 13px;
    }
  }

  .step-detail {
    width: 100%;

    .guide-title {
      display: flex;

      h4 {
        width: 130px;
        margin: 0 0 10px 20px;
        padding: 8px;
        color: #fff;
        font-weight: 300;
        font-size: 16px;
        text-align: center;
        background: @themeColor;
      }
    }
  }
}
</style>
