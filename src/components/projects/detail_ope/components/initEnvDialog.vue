<template>
  <el-dialog :title="`设置 ${currentEnv} 环境变量`" :visible.sync="dialogVisible" width="850px">
    <div>
      <VarList :variables="variables" v-if="deployType === 'k8s'" class="var-list-container"></VarList>
      <HelmEnvTemplate
        v-else-if="deployType === 'helm'"
        class="chart-value"
        ref="helmEnvTemplateRef"
        :envScene="`updateRenderSet`"
        :chartNames="chartNames"
        :currentEnvValue="currentEnvValue"
        :baseEnvObj="baseEnvObj"
      ></HelmEnvTemplate>
    </div>
    <div slot="footer">
      <el-button size="small" type="primary" @click="getEnvInfo">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import VarList from '@/components/projects/env/k8sPmEnv/varList.vue'
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
      variables: [],
      chartNames: [],
      currentEnvValue: undefined
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
        this.variables = []
        this.chartNames = []
        this.currentEnvValue = undefined
        return
      }
      if (this.deployType === 'k8s') {
        this.variables = cloneDeep(this.currentInfo.vars)
      } else {
        this.chartNames = cloneDeep(this.currentInfo.chartValues || [])
        this.currentEnvValue = this.currentInfo.defaultValues || ''
      }
    }
  },
  methods: {
    getEnvInfo () {
      if (this.deployType === 'k8s') {
        this.currentInfo.vars = cloneDeep(this.variables)
      } else {
        const {
          envInfo,
          chartInfo
        } = this.$refs.helmEnvTemplateRef.getAllInfo()
        this.currentInfo.defaultValues = envInfo.DEFAULT.envValue || ''
        this.currentInfo.chartValues = chartInfo
      }
      this.dialogVisible = false
    }
  },
  components: {
    VarList,
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
