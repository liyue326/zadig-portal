<template>
  <div class="common-parcel-block update-template-container">
    <div class="template-block">
      <div class="primary-title template-title" @click="showGlobalVariable = !showGlobalVariable">
        全局服务变量
        <i :class="[showGlobalVariable ?  'el-icon-arrow-up' : 'el-icon-arrow-down' ]"></i>
      </div>
      <EnvValues
        v-show="showGlobalVariable"
        ref="envValuesRef"
        :envName="handledEnv"
        :baseEnvObj="baseEnvObj"
        :defaultEnvsValues="defaultEnvsValues"
      ></EnvValues>
    </div>
    <div class="template-block">
      <div class="primary-title not-first-child template-title" @click="showServiceVariable = !showServiceVariable">
        服务变量
        <i :class="[showServiceVariable ?  'el-icon-arrow-up' : 'el-icon-arrow-down' ]"></i>
      </div>
      <ChartValues
        v-show="showServiceVariable"
        ref="chartValuesRef"
        :chartNames="chartNames"
        :envNames="envNames"
        :handledEnv="handledEnv"
        :envScene="envScene"
        :showEnvTabs="showEnvTabs"
        :defaultEnvValue="defaultEnvValue"
        :baseEnvObj="baseEnvObj"
      ></ChartValues>
    </div>
  </div>
</template>

<script>
import EnvValues from '../common/updateHelmEnvVariable.vue'
import ChartValues from '../common/updateHelmEnvChart.vue'
export default {
  name: 'HelmEnvTemplate',
  data () {
    return {
      defaultEnvsValues: {}, // { key: envName, value: { envValue: defaultEnvValue, gitRepoConfig: null } }
      showGlobalVariable: false,
      showServiceVariable: true
    }
  },
  props: {
    chartNames: {
      type: Array, // Object{serviceName}[]
      required: false,
      default: () => null
    },
    envNames: {
      type: Array,
      required: false,
      default: () => []
    },
    handledEnv: {
      // 正在处理的环境名称
      type: String,
      required: false,
      default: ''
    },
    showEnvTabs: {
      /**
       * 是否展示具体服务信息的环境tab
       */
      default: false,
      type: Boolean
    },
    envScene: {
      type: String,
      required: true
    },
    baseEnvObj: {
      type: Object,
      default: () => null // {envName: baseEvnName}
    },
    currentEnvValue: {
      // current env yaml
      type: String,
      required: false
    }
  },
  computed: {
    defaultEnvValue () {
      const envName = this.handledEnv || 'DEFAULT'
      if (!this.defaultEnvsValues[envName]) {
        this.$set(this.defaultEnvsValues, envName, { envValue: '' })
      }
      return {
        envName,
        defaultValues: this.defaultEnvsValues[envName].envValue
      }
    }
  },
  watch: {
    currentEnvValue: {
      handler (val) {
        this.$set(this.defaultEnvsValues, 'DEFAULT', { envValue: val || '' })
        this.$refs.envValuesRef && this.$refs.envValuesRef.initEnvVariableInfo()
      },
      immediate: true
    }
  },
  methods: {
    validate () {
      const valid = []
      valid.push(this.$refs.envValuesRef.validate())
      valid.push(this.$refs.chartValuesRef.validate())
      return Promise.all(valid)
    },
    collapseChange (activeName) {
      // will update
      this.validate()
        .catch(() => {
          this.activeName = activeName === 'env' ? 'service' : 'env'
        })
        .then(() => {
          this.$refs.chartValuesRef.closeReview()
        })
    },
    getAllInfo () {
      Object.keys(this.defaultEnvsValues).forEach(envName => {
        const gitRepoConfig = this.defaultEnvsValues[envName].gitRepoConfig
        if (!gitRepoConfig || !gitRepoConfig.codehostID) {
          delete this.defaultEnvsValues[envName].gitRepoConfig
        }
      })
      return {
        envInfo: this.defaultEnvsValues,
        chartInfo: this.$refs.chartValuesRef.getAllChartNameInfo()
      }
    }
  },
  components: {
    EnvValues,
    ChartValues
  },
  created () {
    this.envNames.forEach(env => {
      this.$set(this.defaultEnvsValues, env, { envValue: '' })
    })
  }
}
</script>

<style lang="less" scoped>
.update-template-container {
  .template-block {
    width: 100%;

    .template-title {
      cursor: pointer;

      i {
        margin-left: 8px;
        color: @fontLightGray;
      }
    }
  }
}
</style>
