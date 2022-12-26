<template>
  <div>
    <el-form ref="buildEnvRef" :inline="true" :model="preEnvs" class="variable-form" label-position="top" label-width="80px">
      <span v-if="!isJenkins" class="item-title" :style="{'margin-bottom': fromWhere.origin === 'test' ? '12px' : '0px'}">自定义{{ fromWhere.title }}变量</span>
      <el-button
        v-if="preEnvs.envs && preEnvs.envs.length===0 && !isJenkins"
        @click="addFirstBuildEnv()"
        type="primary"
        size="mini"
        plain
      >新增</el-button>
      <el-row v-for="(app,build_env_index) in preEnvs.envs" :key="build_env_index" :gutter="2">
        <el-col :span="4">
          <el-form-item class="display-flex">
            <el-select
              v-model="preEnvs.envs[build_env_index].type"
              :placeholder="$t(`global.type`)"
              size="small"
              :class="{'partial-width': preEnvs.envs[build_env_index].type !== 'string'}"
              style="margin-right: 6px;"
              @change="changeEnvType(build_env_index)"
            >
              <el-option :label="$t(`global.string`)" value="string"></el-option>
              <el-option :label="$t(`global.enumerate`)" value="choice"></el-option>
            </el-select>
            <i
              v-show="preEnvs.envs[build_env_index].type === 'choice'"
              class="el-icon-edit edit-icon"
              @click="updateParams(build_env_index)"
            ></i>
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item :prop="'envs.' + build_env_index + '.key'" :rules="{required: true, message: $t(`global.inputKey`), trigger: 'blur'}">
            <el-input :placeholder="$t(`global.key`)" v-model="preEnvs.envs[build_env_index].key" size="small" :disabled="preEnvs.envs[build_env_index].disabledKey"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item>
            <el-select
              v-if="preEnvs.envs[build_env_index].command !== 'other'&&preEnvs.envs[build_env_index].type==='choice'"
              v-model="preEnvs.envs[build_env_index].value"
              :placeholder="$t(`global.defaultValue`)"
              size="small"
            >
              <el-option v-for="option in preEnvs.envs[build_env_index].choice_option" :key="option" :label="option" :value="option"></el-option>
            </el-select>
            <el-input
              v-if="preEnvs.envs[build_env_index].type==='string' && preEnvs.envs[build_env_index].command !== 'other'"
              :disabled="isJenkins&&preEnvs.envs[build_env_index].auto_generate"
              :placeholder="$t(`global.value`)"
              v-model="preEnvs.envs[build_env_index].value"
              size="small"
            ></el-input>
            <el-select v-if="preEnvs.envs[build_env_index].command === 'other'" v-model="preEnvs.envs[build_env_index].value" filterable :placeholder="$t(`build.prompt.select`)" size="small" ref="select" @focus="handleEnvChange(preEnvs.envs[build_env_index],preEnvs.envs[build_env_index].command)">
              <el-option v-for="(item,index) in envs" :key="index" :label="item" :value="item">{{item}}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="1" class="mg-t16">
          <EnvTypeSelect v-model="preEnvs.envs[build_env_index].command" isFixed isRuntime isOther  @change="handleEnvTypeChange($event, build_env_index)"/>
        </el-col>
        <el-col :span="12" v-if="isJenkins&&preEnvs.envs[build_env_index].name==='IMAGE'" class="tip">
          <el-checkbox v-model="preEnvs.envs[build_env_index].auto_generate"></el-checkbox>
          <span>{{$t(`build.prompt.useSystemImageNamingRules`)}}</span>
          <router-link
                       :to="`/v1/projects/detail/${$route.params.project_name}/services?service_name=${serviceName.length>0?serviceName[0].service_name : ''}&rightbar=policy`">
            {{$t(`build.imageNamingRules`)}}
          </router-link>
        </el-col>
        <el-col :span="mini ? 4 : 3" v-show="preEnvs.envs[build_env_index].type!=='choice'" v-if="!isJenkins">
          <el-form-item prop="is_credential">
            <el-checkbox v-model="preEnvs.envs[build_env_index].is_credential">
              {{$t(`build.secretParameter`)}}
              <el-tooltip effect="dark" :content="$t(`build.secretParameterTooltip`)" placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </el-checkbox>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="!isJenkins">
          <el-form-item style="margin-right: 0;">
            <div class="app-operation">
              <el-button v-if="preEnvs.envs.length >= 1" @click="deleteBuildEnv(build_env_index)" type="danger" size="small" plain>{{$t(`global.delete`)}}</el-button>
              <el-button v-if="build_env_index===preEnvs.envs.length-1" @click="addBuildEnv()" type="primary" size="small" plain>{{$t(`global.add`)}}</el-button>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-dialog :visible.sync="dialogVisible" :title="$t(`global.enumerate`)" width="600px" :close-on-click-modal="false" :show-close="false" append-to-body>
      <el-form ref="form" :model="currentVars" label-position="left" label-width="90px">
        <el-form-item :label="$t(`build.variableKey`)">
          <el-input v-model="currentVars.key" size="small"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`build.variableOptions`)">
          <el-input type="textarea" v-model="currentVars.choice_option" :placeholder="$t(`build.prompt.variableOptions`)" size="small" rows="4"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveVariable" size="small">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>
    <section class="inner-variable" v-if="!isJenkins">
      <div @click="showBuildInEnvVar = !showBuildInEnvVar" class="item-title inner-title">
        内置{{ fromWhere.title }}变量
        <i
          style="margin-left: 10px;"
          :class="[showBuildInEnvVar ? 'el-icon-arrow-up' : 'el-icon-arrow-down']"
        ></i>
      </div>
      <div v-show="showBuildInEnvVar" class="inner-variable-content">
        <div v-for="variable in fromWhere.vars" :key="variable.variable" class="var-content">
          <span class="var-variable" v-if="variable.variable">{{ variable.variable }}</span>
          <span class="var-desc">
            {{ variable.desc }}
            <el-button
              v-if="variable.link && fromServicePage"
              type="text"
              size="small"
              @click="variable.link.handler()"
            >{{ variable.link.label }}</el-button>
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
import EnvTypeSelect from '../workflow/workflowEditor/customWorkflow/components/envTypeSelect.vue'

export default {
  components: { EnvTypeSelect },
  props: {
    preEnvs: Object,
    isTest: {
      type: Boolean,
      default: false
    },
    mini: {
      type: Boolean,
      default: false
    },
    validObj: {
      required: false,
      type: Object,
      default: null
    },
    fromServicePage: {
      type: Boolean,
      default: false
    },
    isJenkins: {
      type: Boolean,
      default: false
    },
    serviceName: {
      type: Array,
      default: () => [{ service_name: '' }]
    },
    fromWhere: {
      type: Object,
      default: () => {
        return {
          origin: 'build',
          // TODO: HOW TO CHANGE THIS
          title: '构建',
          vars: []
        }
      }
    },
    envs: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      dialogVisible: false,
      currentVars: {},
      showBuildInEnvVar: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    buildVars () {
      return [
        {
          variable: '$WORKSPACE',
          desc: this.$t(`systemVariables.workspace`)
        },
        {
          variable: '$TASK_ID',
          desc: this.$t(`systemVariables.workflowTaskID`)
        },
        {
          variable: '$IMAGE',
          desc: this.$t(`systemVariables.image`),
          link: {
            label: this.$t(`systemVariables.updateImageNamingRulesPrompt`),
            handler: () => {
              this.$router.replace({
                query: Object.assign({}, this.$route.query, {
                  rightbar: 'policy'
                })
              })
            }
          }
        },
        {
          variable: '$PKG_FILE',
          desc: this.$t(`systemVariables.artifact`),
          link: {
            label: this.$t(`systemVariables.updateArtifactNamingRulesPrompt`),
            handler: () => {
              this.$router.replace({
                query: Object.assign({}, this.$route.query, {
                  rightbar: 'policy'
                })
              })
            }
          }
        },
        {
          variable: '$SERVICE',
          desc: this.$t(`systemVariables.service`)
        },
        {
          variable: '$SERVICE_MODULE',
          desc: this.$t(`systemVariables.serviceModule`)
        },
        {
          variable: '$DIST_DIR',
          desc: this.$t(`systemVariables.artifactPath`)
        },
        {
          variable: '$ENV_NAME',
          desc: this.$t(`systemVariables.buildEnvName`)
        },
        {
          variable: '$BUILD_URL',
          desc: this.$t(`systemVariables.buildTaskLink`)
        },
        {
          variable: '$CI',
          desc: this.$t(`systemVariables.ci`)
        },
        {
          variable: '$ZADIG',
          desc: this.$t(`systemVariables.zadig`)
        },
        {
          // eslint-disable-next-line no-template-curly-in-string
          variable: '$REPONAME_<index>',
          desc: this.$t(`systemVariables.repoNameIndex`)
        },
        {
          // eslint-disable-next-line no-template-curly-in-string
          variable: '$REPO_<index>',
          desc: this.$t(`systemVariables.repoIndex`)
        },
        {
          // eslint-disable-next-line no-template-curly-in-string
          variable: '$<REPO>_PR',
          // eslint-disable-next-line no-template-curly-in-string
          desc: this.$t(`systemVariables.repoPR`)
        },
        {
          // eslint-disable-next-line no-template-curly-in-string
          variable: '$<REPO>_BRANCH',
          // eslint-disable-next-line no-template-curly-in-string
          desc: this.$t(`systemVariables.repoBranch`)
        },
        {
          // eslint-disable-next-line no-template-curly-in-string
          variable: '$<REPO>_TAG',
          // eslint-disable-next-line no-template-curly-in-string
          desc: this.$t(`systemVariables.repoTag`)
        },
        {
          // eslint-disable-next-line no-template-curly-in-string
          variable: '$<REPO>_COMMIT_ID',
          // eslint-disable-next-line no-template-curly-in-string
          desc: this.$t(`systemVariables.repoCommitID`)
        },
        {
          variable: '',
          desc: this.$t(`systemVariables.otherTypeRepoWarning`)
        }
      ]
    },
    testVars () {
      return [
        {
          variable: '$WORKSPACE',
          desc: this.$t(`systemVariables.workspace`)
        },
        {
          variable: '$LINKED_ENV',
          desc: this.$t(`systemVariables.linkedEnv`)
        },
        {
          variable: '$ENV_NAME',
          desc: this.$t(`systemVariables.testEnvName`)
        },
        {
          variable: '$TEST_URL',
          desc: this.$t(`systemVariables.testTaskLink`)
        },
        {
          variable: '$SERVICES',
          desc: this.$t(`systemVariables.testServices`)
        },
        {
          variable: '$CI',
          desc: this.$t(`systemVariables.ci`)
        },
        {
          variable: '$ZADIG',
          desc: this.$t(`systemVariables.zadig`)
        }
      ]
    }
  },
  methods: {
    handleEnvChange (row, command) {
      row.value = ''
      if (command === 'other') {
        this.$emit('getList')
      }
    },
    handleEnvTypeChange (val, index) {
      if (val === 'other') {
        this.$nextTick(() => {
          this.$refs.select[index].toggleMenu()
        })
      }
    },
    addFirstBuildEnv () {
      this.preEnvs.envs.push({
        key: '',
        value: '',
        type: 'string',
        is_credential: false
      })
    },
    validate () {
      return this.$refs.buildEnvRef.validate()
    },
    addBuildEnv () {
      this.validate().then(valid => {
        this.preEnvs.envs.push({
          key: '',
          value: '',
          type: 'string',
          is_credential: false
        })
      })
    },
    deleteBuildEnv (index) {
      this.preEnvs.envs.splice(index, 1)
    },
    changeEnvType (index) {
      const current = this.preEnvs.envs[index]
      current.value = ''
      if (current.type === 'string') {
        current.is_credential = true
      } else {
        current.is_credential = false
        this.updateParams(index)
      }
    },
    updateParams (index) {
      this.dialogVisible = true
      const current = this.preEnvs.envs[index]
      this.currentVars = cloneDeep({
        index,
        ...current,
        choice_option: current.choice_option
          ? current.choice_option.join(',')
          : ''
      })
    },
    saveVariable () {
      this.dialogVisible = false
      const index = this.currentVars.index
      const env = this.preEnvs.envs[index]
      const choice_option = this.currentVars.choice_option.split(',')
      env.choice_option = choice_option
      env.key = this.currentVars.key
      if (!choice_option.includes(env.value)) {
        env.value = ''
      }
    }
  },
  watch: {
    preEnvs: {
      handler (newValue, oldValue) {
        newValue.envs.forEach(e => {
          if (!e.type) {
            this.$set(e, 'type', 'string')
          }
        })
        this.$forceUpdate()
      },
      deep: true
    }
  },
  created () {
    this.validObj &&
      this.validObj.addValidate({
        name: 'envVariable',
        valid: this.validate
      })
    const origin = this.fromWhere.origin
    if (origin === 'build') {
      this.fromWhere.vars = this.buildVars
    } else if (origin === 'test') {
      this.fromWhere.vars = this.testVars
    }
  }
}
</script>

<style lang="less" scoped>
@secondaryColor: #888888;
@primaryColor: #000;

.item-title {
  display: inline-block;
  width: 117px;
  color: @secondaryColor;
  font-weight: 300;
  font-size: 14px;
  line-height: 28px;

  &.inner-title {
    margin-top: 6px;
    cursor: pointer;
  }
}

.inner-variable {
  .item-title.inner-title {
    margin-top: 6px;
    color: @themeColor;
    cursor: pointer;
  }

  .inner-variable-content {
    margin-top: 8px;
    color: @primaryColor;
    font-weight: 300;
    font-size: 14px;
    line-height: 22px;

    .var-content {
      display: flex;

      .var-variable {
        flex: 0 0 200px;
      }
    }
  }
}

.divider {
  width: 100%;
  height: 1px;
  margin: 5px 0 15px 0;
  background-color: #dfe0e6;

  &.item {
    width: 30%;
  }
}

.app-operation {
  .el-button + .el-button {
    margin-left: 2px;
  }
}

.display-flex {
  /deep/.el-form-item__content {
    display: flex;
    align-items: center;

    .el-select.partial-width {
      width: 80%;
    }
  }

  .edit-icon {
    color: @themeColor;
    cursor: pointer;
  }
}

.variable-form {
  /deep/.el-form-item {
    width: 100%;
    margin-bottom: 8px;
  }

  .tip {
    height: 42px;
    color: @secondaryColor;
    font-size: 14px;
    line-height: 42px;

    .link {
      margin-top: -3px;
    }
  }
}
</style>
