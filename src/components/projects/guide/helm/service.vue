<template>
<div class="projects-guide-helm-service-container">
    <div class="guide-container">
      <Step :activeStep="1" :stepThreeTitle="`配置环境`"/>
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">第二步</span>
          <span class="second">创建服务模板，后续均可在项目中重新配置</span>
        </div>
      </div>
    </div>
  <div class="content">
    <Code ref="code" :service="serviceList" isCreate isGuide />
  </div>
      <div class="controls__wrap">
      <div class="controls__right">
        <el-button type="primary"
                   size="small"
                   @click="toNext"
                   :disabled="!showNext">下一步</el-button>
      </div>
    </div>
</div>
</template>
<script>
import { mapState } from 'vuex'
import Step from '../common/step.vue'
import Code from '../../serviceMgr/helm/code'

export default {
  name: 'service_helm',
  components: {
    Code,
    Step
  },
  data () {
    return {
      serviceList: []
    }
  },
  methods: {
    toNext () {
      this.$router.push(`/v1/projects/create/${this.projectName}/helm/runtime?serviceName=${this.serviceName}&serviceType=${this.serviceType}`)
    },
    async querytHelmChartService () {
      this.$store.dispatch('queryService', { projectName: this.projectName })
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    ...mapState({
      showNext: (state) => state.serviceManage.showNext
    }),
    serviceName () {
      return this.$route.query.service_name
    },
    serviceType () {
      return this.$route.query.service_type
    }
  },
  mounted () {
    this.querytHelmChartService()
  },
  onboardingStatus: 2
}
</script>
<style lang="less" scoped>
.projects-guide-helm-service-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(~'100% - 40px');
  background-color: @globalBackgroundColor;

  .guide-container {
    margin-top: 10px;
  }

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
    height: 55px;
    background-color: #fff;
    border-top: 1px solid #ccc;

    > * {
      margin-right: 10px;
    }

    .controls__right {
      display: flex;
      align-items: center;
      padding: 0 15px;
    }
  }
}

.content {
  display: flex;
  flex: 1;
  overflow: hidden;
  background-color: #fff;

  /deep/ .code-content {
    padding: 0;
  }
}
</style>
