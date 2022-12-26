<template>
  <div class="common-parcel-block update-template-container">
    <div class="template-block">
      <div class="primary-title template-title" @click="showGlobalVariable = !showGlobalVariable">
        {{$t('environments.helm.variableListComp.globalServiceVariables')}}
        <i :class="[showGlobalVariable ?  'el-icon-arrow-up' : 'el-icon-arrow-down' ]"></i>
      </div>
      <EnvValues
        v-show="showGlobalVariable"
        ref="envValuesRef"
        :envName="handledEnv"
        :baseEnvObj="baseEnvObj"
        :defaultEnvsValues="defaultEnvsValues" />
    </div>
    <div class="template-block">
      <div class="primary-title not-first-child template-title" @click="showServiceVariable = !showServiceVariable">
        {{$t('environments.helm.variableListComp.serviceVariables')}}
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
        :checkResource="checkResource" />
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
      defaultEnvsValues: {}, // { key: envName, value: { yamlSource: '', envValue: defaultEnvValue, gitRepoConfig: null, variableSet: null } }
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
    baseEnvObj: { // init environment for collaborative mode
      type: Object,
      default: () => null // {envName: baseEvnName}
    },
    currentEnvObj: {
      // current env object
      type: Object,
      required: false
    },
    checkResource: Object
  },
  computed: {
    defaultEnvValue () {
      const envName = this.handledEnv || 'DEFAULT'
      if (!this.defaultEnvsValues[envName]) {
        this.$set(this.defaultEnvsValues, envName, { envValue: '', yamlSource: 'customEdit' })
      }
      return {
        envName,
        defaultValues: this.defaultEnvsValues[envName].envValue
      }
    }
  },
  watch: {
    currentEnvObj: {
      handler (val) {
        this.$set(this.defaultEnvsValues, 'DEFAULT', val || { envValue: '', yamlSource: 'customEdit' })
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
      // Handling basic information about the environment
      Object.keys(this.defaultEnvsValues).forEach(envName => {
        const cur = this.defaultEnvsValues[envName]
        // correct wrong data
        if (cur.yamlSource === 'repo' && !cur.gitRepoConfig) {
          cur.yamlSource = 'customEdit'
        }
        cur.valuesData = null
        if (cur.yamlSource === 'repo') {
          cur.valuesData = {
            autoSync: cur.gitRepoConfig.autoSync,
            yamlSource: 'repo',
            gitRepoConfig: cur.gitRepoConfig
          }
          cur.variableSet = null
        } else if (cur.yamlSource === 'variableSet') {
          cur.valuesData = {
            autoSync: cur.variableSet.autoSync,
            yamlSource: 'variableSet',
            source_id: cur.variableSet.source_id
          }
          cur.gitRepoConfig = null
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
      this.$set(this.defaultEnvsValues, env, { envValue: '', yamlSource: 'customEdit' })
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
