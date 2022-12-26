<template>
  <div class="projects-pm-service-container">
    <div class="guide-container">
      <Step :thirdStepTitle="$t('environments.common.envCreation')" :activeStep="1" envDisabled/>
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">{{$t('project.onboardingComp.secondStep')}}</span>
          <span class="second">{{$t('project.onboardingComp.secondStepTip')}}</span>
        </div>
      </div>
    </div>
    <div class="config-container">
      <ServiceList ref="serviceLsit" :editService="editService" :addService="addService" :changeShowBuild="changeShowBuild" />
      <Build v-if="showBuild" ref="pm-service" :serviceName="serviceName" :isEdit="isEdit" @listenCreateEvent="listenEvent"/>
      <div v-else class="no-content">
        <img src="@assets/icons/illustration/editorNoService.svg" alt />
        <p style="color: #909399;">
          暂无服务，创建服务请在左侧栏点击&nbsp;
          <el-button size="mini" icon="el-icon-plus" @click="$refs.serviceLsit.newService()" plain circle></el-button>&nbsp;创建服务
        </p>
      </div>
    </div>
    <div class="controls__wrap">
      <div class="controls__right">
        <el-button type="primary" size="small" :disabled="!showNext" @click="toNext">{{$t('project.onboardingComp.nextStep')}}</el-button>
      </div>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Step from '../common/step.vue'
import ServiceList from '@/components/projects/common/pm/serviceList.vue'
import Build from '@/components/projects/common/pm/pmConfig.vue'

export default {
  data () {
    return {
      showNext: false,
      isEdit: false,
      serviceName: '',
      showBuild: true
    }
  },
  methods: {
    addService (obj) {
      this.isEdit = false
      this.serviceName = ''
      this.$nextTick(() => {
        this.$refs['pm-service'].addNewService(obj)
      })
    },
    changeShowBuild (value) {
      this.showBuild = value
      if (value) {
        this.$nextTick(() => {
          this.$refs['pm-service'].initEnvConfig()
        })
      }
    },
    editService (obj) {
      this.serviceName = obj.service_name
      this.isEdit = true
    },
    listenEvent (res) {
      if (res === 'success') {
        this.showNext = true
        this.$refs.serviceLsit.getServiceTemplates()
      }
    },
    toNext () {
      this.$router.push(`/v1/projects/create/${this.projectName}/pm/deploy`)
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
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
  },
  components: {
    Step,
    Build,
    ServiceList
  },
  onboardingStatus: 2
}
</script>

<style lang="less" scoped>
.projects-pm-service-container {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .page-title-container {
    display: flex;
    padding: 0 20px;

    h1 {
      width: 100%;
      color: #4c4c4c;
      font-weight: 300;
      text-align: center;
    }
  }

  .guide-container {
    margin-top: 10px;
  }

  .current-step-container {
    .title-container {
      margin-bottom: 10px;
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
        display: inline-block;
        color: #4c4c4c;
        font-size: 13px;
      }
    }
  }

  .config-container {
    position: relative;
    display: flex;
    height: calc(~'100% - 225px') !important;
    margin-bottom: 0;
    padding: 5px 0 10px 0;

    .no-content {
      display: flex;
      flex-direction: column;
      align-content: center;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;

      img {
        width: 200px;
        height: 200px;
      }

      p {
        color: #606266;
        font-size: 15px;
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
    justify-content: space-between;
    height: 60px;
    padding: 0 10px;
    background-color: #fff;
    box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.05);

    > * {
      margin-right: 10px;
    }

    .controls__right {
      display: flex;
      align-items: center;
    }
  }
}
</style>
