<template>
  <div class="container">
    <div>
    <Step :activeStep="currentStep" />
    <component ref="component" class="content" :is="componentsList[currentStep]" />
    </div>
    <div class="controls__wrap_host">
      <div class="controls__right">
        <el-button type="primary"
                  size="small"
                  @click="nextStep">{{currentStep === 2 ? $t('project.onboardingComp.finish') : $t('project.onboardingComp.nextStep')}}</el-button>
        <el-button type="primary" size="small"
                v-if="currentStep === 0"
                @click="exitOnboarding">
          <i v-if="exitLoading"
             class="el-icon-loading"></i>
          <span>{{$t('project.onboardingComp.skipOnboarding')}}</span>
        </el-button>
      </div>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Step from './components/step.vue'
import HostEnvConfig from './components/hostEnvConfig.vue'
import ServiceBuild from './components/serviceBuild.vue'
import RunWorkflow from './components/runWorkflow.vue'

export default {
  name: 'hostConfig',
  components: {
    Step
  },
  data () {
    return {
      componentsList: [HostEnvConfig, ServiceBuild, RunWorkflow],
      exitLoading: false
    }
  },
  methods: {
    exitOnboarding () {
      this.exitLoading = true
      this.saveOnboardingStatus(this.projectName, 0).then((res) => {
        this.$router.push(`/v1/projects/detail/${this.projectName}/detail`)
      }).catch(() => {
        this.exitLoading = false
      })
    },
    nextStep () {
      if (this.currentStep === 0) {
        this.$refs.component.nextStep(this.currentStep + 2)
      } else if (this.currentStep === 1) {
        this.$router.push(`/v1/projects/create/${this.projectName}/host/config?step=${this.currentStep + 2}`)
      } else {
        this.$router.push(`/v1/projects/detail/${this.projectName}/detail`)
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    currentStep () {
      return this.$route.query.step - 1
    }
  },
  created () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' }, { title: this.projectName, isProjectName: true, url: '' }] })
  }
}
</script>
<style lang="less" scoped>
.container {
  background-color: @globalBackgroundColor;

  .content {
    height: calc(~"100vh - 300px");
    overflow: scroll;
  }

  .controls__wrap_host {
    position: fixed;
    bottom: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 60px;
    padding: 0 15px;
    background-color: #fff;
    border-top: 1px solid #ccc;

    & > * {
      margin-right: 10px;
    }

    .controls__right {
      display: flex;
      align-items: center;
    }
  }
}
</style>
