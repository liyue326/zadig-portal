<template>
  <div class="helm-env-variable">
    <ImportValues
      ref="importValuesRef"
      :resize="{direction: 'vertical'}"
      :importRepoInfo="envVariable"
      @closeValueEdit="envVariable.overrideYaml = ''"
      showAutoSync
      useVarGroup
      style="margin-top: 0;"
    />
  </div>
</template>

<script>
import ImportValues from '@/components/projects/common/importValues/index.vue'
import { getEnvDefaultVariableAPI } from '@api'

export default {
  name: 'EnvValues',
  props: {
    envName: {
      type: String,
      required: true
    },
    defaultEnvsValues: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      envVariable: {}
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    overrideData () {
      return this.defaultEnvsValues[this.envName || 'DEFAULT']
    }
  },
  methods: {
    switchTabs () {
      return this.$refs.importValuesRef.validate()
    },
    initEnvVariableInfo (envName = '') {
      this.envVariable = {
        yamlSource: this.overrideData.yamlSource || 'customEdit',
        overrideYaml: this.overrideData.envValue || '', // : String
        envName,
        gitRepoConfig: this.overrideData.gitRepoConfig || null,
        variableSet: this.overrideData.variableSet || null
      }
    },
    validate () {
      const valid = []
      if (this.$refs.importValuesRef) {
        valid.push(this.$refs.importValuesRef.validate())
      }
      return Promise.all(valid)
    },
    async getEnvVariablesYaml (envName, baseEnvName = envName) {
      const res = await this.initEnvVariablesYaml(envName, baseEnvName).catch(
        err => {
          console.log(err)
          this.initEnvVariableInfo(envName)
        }
      )
      if (res) {
        this.envVariable = {
          yamlSource: (res.yaml_data && res.yaml_data.source) || 'customEdit',
          overrideYaml: res.default_variable,
          gitRepoConfig: res.gitRepoConfig,
          variableSet: res.variableSet
        }
      }
    },
    initEnvVariablesYaml (envName, baseEnvName) {
      return getEnvDefaultVariableAPI(this.projectName, baseEnvName).then(
        res => {
          let gitRepoConfig = null
          let variableSet = null
          if (res.yaml_data && res.yaml_data.source_detail && res.yaml_data.source_detail.git_repo_config && res.yaml_data.source_detail.git_repo_config.codehost_id) {
            const repoConfig = res.yaml_data.source_detail.git_repo_config
            gitRepoConfig = {
              branch: repoConfig.branch,
              codehostID: repoConfig.codehost_id,
              owner: repoConfig.owner,
              repo: repoConfig.repo,
              autoSync: res.yaml_data.auto_sync,
              valuesPaths: [res.yaml_data.source_detail.load_path],
              valuesPath: res.yaml_data.source_detail.load_path
            }
          }
          if (res.yaml_data && res.yaml_data.source === 'variableSet') {
            variableSet = {
              source_id: res.yaml_data.source_id,
              autoSync: res.yaml_data.auto_sync
            }
          }
          this.$set(this.defaultEnvsValues, envName, {
            envValue: res.default_variable,
            yamlSource: (res.yaml_data && res.yaml_data.source) || 'customEdit',
            gitRepoConfig,
            variableSet
          })
          return { ...res, gitRepoConfig, variableSet }
        }
      )
    }
  },
  watch: {
    envName: {
      handler (newV, oldV) {
        if (newV === '' || (this.overrideData && this.overrideData.envValue)) {
          this.initEnvVariableInfo()
        } else {
          this.getEnvVariablesYaml(newV)
        }
      },
      immediate: true
    },
    'envVariable.overrideYaml' (newV) {
      this.$set(this.defaultEnvsValues, this.envName || 'DEFAULT', {
        envValue: newV,
        yamlSource: this.envVariable.yamlSource, // watch: test
        gitRepoConfig: this.envVariable.gitRepoConfig,
        variableSet: this.envVariable.variableSet
      })
    }
  },
  components: {
    ImportValues
  }
}
</script>

<style lang="less" scoped>
.helm-env-variable {
  width: 100%;

  .default-values {
    .secondary-title {
      margin-bottom: 8px;
    }
  }
}
</style>
