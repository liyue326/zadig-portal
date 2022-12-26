<template>
  <el-dialog :title="`设置 ${currentEnv} 环境变量`" :visible.sync="dialogVisible" width="850px">
    <div>
      <K8sEnvTemplate v-if="deployType === 'k8s'" :currentInfo="currentInfo" class="var-list-container" />
      <HelmEnvTemplate
        v-else-if="deployType === 'helm'"
        class="chart-value"
        ref="helmEnvTemplateRef"
        :envScene="`updateRenderSet`"
        :chartNames="chartNames"
        :currentEnvObj="currentEnvObj"
        :baseEnvObj="baseEnvObj"
      ></HelmEnvTemplate>
    </div>
    <div slot="footer">
      <el-button size="small" type="primary" @click="getEnvInfo">{{$t(`global.confirm`)}}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import K8sEnvTemplate from './k8sEnvTemplate.vue'
import HelmEnvTemplate from '@/components/projects/env/env_detail/components/updateHelmEnvTemp.vue'
import { cloneDeep } from 'lodash'

export default {
  props: {
    visible: Boolean,
    currentEnv: String,
    currentInfo: Object,
    baseEnvObj: Object
  },
  data () {
    return {
      chartNames: [],
      currentEnvObj: undefined
    }
  },
  computed: {
    dialogVisible: {
      get () {
        return this.visible
      },
      set () {
        this.$emit('resetVisible', false)
      }
    },
    deployType () {
      const projectName = this.$route.params.project_name
      const project = this.$store.getters.projectList.find(
        project => project.name === projectName
      )
      return project ? project.deployType : 'k8s'
    }
  },
  watch: {
    currentEnv: async function (nVal, oVal) {
      if (!nVal) {
        this.chartNames = []
        this.currentEnvObj = undefined
        return
      }
      if (this.deployType === 'helm') {
        // for service charts
        this.chartNames = cloneDeep(this.currentInfo.chartValues || []).map(chart => {
          return {
            ...chart,
            yamlSource: (chart.valuesData && chart.valuesData.yamlSource) || (chart.overrideYaml ? 'customEdit' : 'default'),
            gitRepoConfig: chart.valuesData && chart.valuesData.gitRepoConfig
          }
        })
        // for environment
        const valuesData = this.currentInfo.valuesData
        const currentEnvObj = { yamlSource: 'customEdit', envValue: this.currentInfo.default_values, gitRepoConfig: null, variableSet: null }
        if (valuesData) {
          currentEnvObj.yamlSource = valuesData.yamlSource
          if (valuesData.yamlSource === 'repo') {
            currentEnvObj.gitRepoConfig = valuesData.gitRepoConfig
          } else if (valuesData.yamlSource === 'variableSet') {
            currentEnvObj.variableSet = {
              autoSync: valuesData.autoSync,
              source_id: valuesData.source_id
            }
          }
        }
        this.currentEnvObj = currentEnvObj
      }
    }
  },
  methods: {
    getEnvInfo () {
      if (this.deployType === 'helm') {
        const {
          envInfo,
          chartInfo
        } = this.$refs.helmEnvTemplateRef.getAllInfo()
        const defaultEnv = envInfo.DEFAULT
        this.currentInfo.default_values = defaultEnv.envValue || ''
        this.currentInfo.valuesData = defaultEnv.valuesData || null
        this.currentInfo.chartValues = chartInfo
      }
      this.dialogVisible = false
    }
  },
  components: {
    K8sEnvTemplate,
    HelmEnvTemplate
  }
}
</script>

<style lang="less" scoped>
/deep/.el-dialog {
  .el-dialog__header {
    text-align: center;
  }

  .el-dialog__body {
    padding: 12px 20px;

    .var-list-container {
      .el-table {
        margin: auto;
      }
    }
  }
}

.chart-value {
  width: 100%;
  min-width: 450px;
  margin-left: 5px;
}
</style>
