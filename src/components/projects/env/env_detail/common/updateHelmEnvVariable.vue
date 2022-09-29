<template>
  <div class="helm-env-variable">
    <ImportValues
      ref="importValuesRef"
      :resize="{direction: 'vertical'}"
      :importRepoInfo="envVariable"
      @closeValueEdit="envVariable.overrideYaml = ''"
      showAutoSync
      style="margin-top: 0;"
    ></ImportValues>
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
    baseEnvObj: {
      type: Object,
      required: false,
      default: () => null
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
        yamlSource: this.overrideData.envValue ? 'freeEdit' : 'default', // : String
        overrideYaml: this.overrideData.envValue || '', // : String
        envName,
        gitRepoConfig: this.overrideData.gitRepoConfig || null
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
          yamlSource: res.defaultValues ? 'freeEdit' : 'default',
          overrideYaml: res.defaultValues,
          gitRepoConfig: res.gitRepoConfig
        }
      }
    },
    initEnvVariablesYaml (envName, baseEnvName) {
      return getEnvDefaultVariableAPI(this.projectName, baseEnvName).then(
        res => {
          let gitRepoConfig = null
          if (res.yaml_data && res.yaml_data.source_detail && res.yaml_data.source_detail.git_repo_config && res.yaml_data.source_detail.git_repo_config.codehost_id) {
            const repoConfig = res.yaml_data.source_detail.git_repo_config
            gitRepoConfig = {
              branch: repoConfig.branch,
              codehostID: repoConfig.codehost_id,
              owner: repoConfig.owner,
              repo: repoConfig.repo,
              autoSync: res.yaml_data.auto_sync,
              valuesPaths: [res.yaml_data.source_detail.load_path]
            }
          }
          this.$set(this.defaultEnvsValues, envName, { envValue: res.defaultValues, gitRepoConfig })
          return { ...res, gitRepoConfig }
        }
      )
    }
  },
  watch: {
    envName: {
      handler (newV, oldV) {
        if (newV === '' || (this.overrideData && this.overrideData.envValue) || this.baseEnvObj) {
          this.initEnvVariableInfo()
        } else {
          this.getEnvVariablesYaml(newV)
        }
      },
      immediate: true
    },
    'envVariable.overrideYaml' (newV) {
      this.$set(this.defaultEnvsValues, this.envName || 'DEFAULT', { envValue: newV, gitRepoConfig: this.envVariable.gitRepoConfig })
    },
    baseEnvObj: {
      handler (newV, oldV) {
        if (newV) {
          Object.keys(newV).forEach(val => {
            const fn =
              val === this.envName
                ? this.getEnvVariablesYaml
                : this.initEnvVariablesYaml
            fn(val, newV[val])
          })
        }
      },
      deep: true,
      immediate: true
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
