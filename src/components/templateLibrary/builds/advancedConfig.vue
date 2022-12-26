<template>
  <section class="advanced-config-container">
    <el-form
      ref="advancedConfig"
      :model="buildConfig"
      label-position="left"
      class="secondary-form build-advanced-form"
      label-width="120px"
      inline-message
    >
      <div class="item-title">{{$t(`build.advancedSettings.strategy`)}}</div>
      <el-form-item :label="$t(`global.timeout`)">
        <el-input-number size="mini" :min="1" v-model="buildConfig.timeout"></el-input-number>
        <span>分钟</span>
      </el-form-item>
      <el-form-item :label="$t(`build.advancedSettings.cache`)">
        <el-switch v-model="buildConfig.cache_enable"></el-switch>
        <br />
        <el-radio-group v-if="buildConfig.cache_enable" v-model="buildConfig.cache_dir_type" class="radio-group">
          <el-radio label="workspace">{{$t(`build.advancedSettings.workspace`)}}</el-radio>
          <br />
          <el-radio label="user_defined">
            <span>{{$t(`build.advancedSettings.customCacheDirectory`)}}</span>
            <br v-if="mini" />
            <el-form
              ref="advancedConfigCache"
              :model="buildConfig"
              label-position="left"
              class="secondary-form build-advanced-form"
              label-width="50px"
              inline-message
            >
              <el-form-item v-if="buildConfig.cache_dir_type === 'user_defined'" :label="$t(`build.advancedSettings.directory`)" prop="cache_user_dir" :rules="{required: buildConfig.cache_dir_type === 'user_defined', trigger: ['change', 'blur'],message: '请输入路径'}">
                <el-input
                  :style=" {width: mini? '100%' : '298px', 'margin-left': mini ? '0' : '5px'}"
                  v-model="buildConfig.cache_user_dir"
                  :placeholder="$t(`build.advancedSettings.typeInCacheDirectory`)"
                  size="mini"
                ></el-input>
              </el-form-item>
            </el-form>
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <div class="item-title">{{$t(`build.advancedSettings.resourceConfig`)}}</div>
      <el-form-item :label="$t(`build.advancedSettings.cluster`)" :prop="`${secondaryProp}.cluster_id`" :rules="{ required: true, message: $t(`build.advancedSettings.selectClusterPrompt`), trigger: ['change', 'blur'] }">
        <el-select v-model="currentResource.cluster_id" :placeholder="$t(`build.advancedSettings.selectClusterPrompt`)" size="small">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`build.advancedSettings.resource`)" :prop="`${secondaryProp}.res_req`" :rules="{ required: true, message: this.$t(`build.advancedSettings.selectResourcePrompt`), trigger: ['change', 'blur'] }">
        <el-select size="small" v-model="currentResource.res_req" :placeholder="$t(`build.prompt.select`)">
          <el-option :label="$t(`build.advancedSettings.resourceTypeHigh`)" value="high"></el-option>
          <el-option :label="$t(`build.advancedSettings.resourceTypeMedium`)" value="medium"></el-option>
          <el-option :label="$t(`build.advancedSettings.resourceTypeLow`)" value="low"></el-option>
          <el-option :label="$t(`build.advancedSettings.resourceTypeMinimum`)" value="min"></el-option>
          <el-option :label="$t(`build.advancedSettings.resourceTypeCustom`)" value="define" @click.native="checkSpec"></el-option>
        </el-select>
        <div v-if="currentResource.res_req_spec && currentResource.res_req === 'define'" class="define-resource">
          <el-form-item
            ref="cpuItem"
            label="CPU(m)"
            label-width="72px"
            :prop="`${secondaryProp}.res_req_spec`"
            :rules="{ validator: validateReqLimit, trigger: ['change', 'blur'], item: 'cpu_limit' }"
          >
            <el-input v-model.number="currentResource.res_req_spec.cpu_limit" :placeholder="$t(`build.advancedSettings.customizeCPUResource`)" size="small"></el-input>
          </el-form-item>

          <el-form-item
            ref="memItem"
            :label="$t(`build.advancedSettings.memoryLabel`)"
            label-width="72px"
            :prop="`${secondaryProp}.res_req_spec`"
            :rules="{ validator: validateReqLimit, trigger: ['change', 'blur'], item: 'memory_limit' }"
          >
            <el-input v-model.number="currentResource.res_req_spec.memory_limit" :placeholder="$t(`build.advancedSettings.customizeMemoryResource`)" size="small"></el-input>
          </el-form-item>

          <el-form-item
            v-if="hasPlutus"
            ref="gpuItem"
            :label="$t(`build.advancedSettings.customizeGPUResource`)"
            label-width="72px"
            :prop="`${secondaryProp}.res_req_spec`"
            :rules="{ validator: validateReqLimit, trigger: ['change', 'blur'], item: 'gpu_limit' }"
          >
            <el-input
              v-model="currentResource.res_req_spec.gpu_limit"
              :placeholder="$t(`build.advancedSettings.customizeGPUTooltip`)"
              size="small"
            ></el-input>
          </el-form-item>
        </div>
      </el-form-item>
      <el-form-item v-if="hasPlutus">
        <div slot="label" style="width: 110px; line-height: 20px;">{{$t(`build.advancedSettings.useHostDockerDaemon`)}}</div>
        <el-switch v-model="currentResource.use_host_docker_daemon"></el-switch>
      </el-form-item>
      <div class="item-title" v-if="!hiddenVars">
        {{$t(`build.advancedSettings.parameterPassing`)}}
        <el-tooltip effect="dark" :content="fromWorkflow?this.$t(`build.advancedSettings.parameterPassingTooltipProductWorkflow`): this.$t(`build.advancedSettings.parameterPassingTooltipProductWorkflow`)" placement="top">
          <i class="pointer el-icon-question"></i>
        </el-tooltip>
      </div>
      <el-form-item :label="$t(`global.var`)" label-width="120px"  v-if="!hiddenVars">
        <el-form-item
          v-for="(item,index) in buildConfig.outputs"
          :key="index"
          :prop="'outputs.' + index + '.name'"
          :rules="{ required:true, validator: validateVars,trigger: ['change', 'blur'] }"
        >
          <el-input
            v-model="buildConfig.outputs[index].name"
            :placeholder="$t(`build.advancedSettings.typeInVariable`)"
            size="small"
            :disabled="item.name==='IMAGE'||item.name==='PKG_FILE'"
          ></el-input>
          <el-button
            v-if="item.name!=='IMAGE'&&item.name!=='PKG_FILE'"
            @click="delVars(index)"
            type="danger"
            size="mini"
            icon="el-icon-minus"
            circle
            plain
          ></el-button>
        </el-form-item>
        <el-button type="text" @click="addVars">{{$t(`build.specialAdd`)}}</el-button>
      </el-form-item>
    </el-form>
  </section>
</template>

<script>
import { getClusterListAPI } from '@api'
import { mapState } from 'vuex'

export default {
  props: {
    buildConfig: Object,
    validObj: Object,
    isCreate: Boolean,
    mini: {
      default: false,
      type: Boolean
    },
    secondaryProp: {
      default: 'pre_build',
      type: String
    },
    fromWorkflow: {
      default: false,
      type: Boolean
    },
    hiddenVars: {
      default: false,
      type: Boolean
    }
  },
  data () {
    this.validateReqLimit = (rule, value, callback) => {
      const validInfo = {
        cpu_limit: {
          empty: this.$t(`build.advancedSettings.parameterPassing`),
          checkType: this.$t(`build.advancedSettings.typeInCorrectNumber`)
        },
        memory_limit: {
          empty: this.$t(`build.advancedSettings.typeInCustomMemoryResource`),
          checkType: this.$t(`build.advancedSettings.typeInCorrectNumber`)
        },
        gpu_limit: {
          empty: this.$t(`build.advancedSettings.typeInCustomGPUResource`)
        }
      }
      const curItem = validInfo[rule.item]
      if (!value.gpu_limit && !value.cpu_limit && !value.memory_limit) {
        callback(new Error(curItem.empty))
      } else if (curItem.checkType && value[rule.item] && typeof value[rule.item] === 'string') {
        callback(new Error(curItem.checkType))
      } else {
        if (!value.cpu_limit || (value.cpu_limit && typeof value.cpu_limit === 'number')) {
          this.$refs.cpuItem.clearValidate()
        }
        if (!value.memory_limit || (value.memory_limit && typeof value.memory_limit === 'number')) {
          this.$refs.memItem.clearValidate()
        }
        this.$refs.gpuItem && this.$refs.gpuItem.clearValidate()
        callback()
      }
    }
    (this.validateVars = (rule, value, callback) => {
      if (!value) {
        callback(new Error(this.$t(`build.advancedSettings.typeInVariable`)))
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        callback(
          new Error(this.$t(`build.advancedSettings.paramaterNamingConvention`))
        )
      } else {
        callback()
      }
    })
    return {
      clusters: []
    }
  },
  computed: {
    currentResource () {
      return this.buildConfig[this.secondaryProp]
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  methods: {
    initAdvancedConfig (buildConfig = this.buildConfig) {
      const currentResource = buildConfig[this.secondaryProp]
      if (this.isCreate || !currentResource.cluster_id) {
        this.$set(currentResource, 'cluster_id', '')
        const local = this.clusters.find(cluster => cluster.local)
        if (local) {
          currentResource.cluster_id = local.id
        }
      }
      if (this.hasPlutus && (typeof currentResource.use_host_docker_daemon === 'undefined')) {
        this.$set(currentResource, 'use_host_docker_daemon', false)
      }
    },
    checkSpec () {
      if (!this.currentResource.res_req_spec) {
        this.$set(this.currentResource, 'res_req_spec', {
          cpu_limit: 1000,
          memory_limit: 512,
          gpu_limit: ''
        })
      } else if (typeof this.currentResource.res_req_spec.gpu_limit === 'undefined') {
        this.$set(this.currentResource.res_req_spec, 'gpu_limit', '')
      }
    },
    getClusterList () {
      const projectName = this.$route.params.project_name
      return getClusterListAPI(projectName).then(res => {
        this.clusters = res.filter(element => element.status === 'normal')
        this.initAdvancedConfig()
      })
    },
    validate () {
      return this.$refs.advancedConfig.validate().then(() => {
        const spec = this.currentResource.res_req_spec
        if (spec.cpu_limit === '') {
          spec.cpu_limit = 0
        }
        if (spec.memory_limit === '') {
          spec.memory_limit = 0
        }
      }).catch(() => {
        this.$emit('validateFailed')
        return Promise.reject()
      })
    },
    validateCache () {
      return this.$refs.advancedConfigCache.validate().catch(() => {
        this.$emit('validateFailed')
        return Promise.reject('advancedConfigCacheValid')
      })
    },
    addVars () {
      if (!this.buildConfig.outputs) {
        this.$set(this.buildConfig, 'outputs', [])
      }
      this.buildConfig.outputs.push({ name: '' })
    },
    delVars (index) {
      this.buildConfig.outputs.splice(index, 1)
    }
  },
  watch: {
    'buildConfig.cache_enable': {
      handler (newVal, oldVal) {
        if (newVal) {
          this.validObj.addValidate({
            name: 'advancedConfigCacheValid',
            valid: this.validateCache
          })
        } else {
          this.validObj.deleteValidate({ name: 'advancedConfigCacheValid' })
        }
      },
      immediate: true
    }
  },
  created () {
    this.getClusterList()
    this.validObj.addValidate({
      name: 'advancedConfigValid',
      valid: this.validate
    })
  }
}
</script>

<style lang="less" scoped>
@inputWidth: 400px;
@secondaryColor: #888888;
@primaryColor: #000;
@formItemBottom: 8px;
@labelWeight: 300;

.advanced-config-container {
  .item-title {
    color: @primaryColor;
    font-weight: 300;
    font-size: 14px;
    line-height: 28px;
  }

  /deep/.el-form.build-advanced-form {
    .define-resource {
      .el-form-item__label {
        padding-right: 12px;
      }

      .el-input {
        width: @inputWidth - 70px;
      }
    }

    .radio-group {
      margin: 8px 0;
      line-height: 22px;

      .el-radio {
        color: @secondaryColor;
        font-weight: @labelWeight;
        font-size: 14px;
      }
    }
  }
}
</style>
