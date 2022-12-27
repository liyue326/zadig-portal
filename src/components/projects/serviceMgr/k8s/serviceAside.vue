<template>
  <div class="aside__wrap">
    <el-drawer title="代码源集成" :visible.sync="integrationCodeDrawer" direction="rtl">
      <IntegrationCode @cancel="integrationCodeDrawer = false" />
    </el-drawer>
    <el-drawer title="镜像仓库集成" :visible.sync="registryCreateVisible">
      <IntegrationRegistry @cancel="registryCreateVisible = false" @createSuccess="getRegistryWhenBuild" />
    </el-drawer>
    <div class="aside__inner">
      <div class="aside-bar">
        <div class="tabs__wrap tabs__wrap_vertical">
          <div class="tabs__item" :class="{'selected': selected === 'var'}" @click="changeRoute('var')">
            <span class="step-name">{{$t('services.k8s.variablesSection')}}</span>
          </div>
          <div class="tabs__item" :class="{'selected': selected === 'policy'}" @click="changeRoute('policy')">
            <span class="step-name">{{$t('services.common.policySection')}}</span>
          </div>
          <div class="tabs__item" :class="{'selected': selected === 'help'}" @click="changeRoute('help')">
            <span class="step-name">{{$t('services.common.helpSection')}}</span>
          </div>
        </div>
      </div>
      <div class="aside__content">
        <div v-if="selected === 'build'" class="service-aside--variables">
          <div style="padding-left: 15px;">
            <el-button @click="$router.back()" icon="el-icon-back" type="text">{{$t('global.back')}}</el-button>
          </div>
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.serviceBuild')}}</div>
          </header>
          <div class="service-aside-box__content">
            <CommonBuild
              ref="buildRef"
              :name="$route.query.service_name"
              :buildName="$route.query.build_name"
              :isEdit="!!$route.query.build_name"
              :followUpFn="followUpFn"
              :saveDisabled="projectName !== projectNameOfService"
              :buildNameIndex="buildNameIndex"
              canSelectBuildName
              mini
              fromServicePage
            />
          </div>
        </div>
        <div v-if="selected === 'var'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.k8s.variablesSection')}}</div>
          </header>
          <div class="service-aside-box__content">
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconfuwu"></i>
                </span> {{$t('services.common.detectedServiceModules')}}
                <el-tooltip effect="dark" placement="top">
                  <div slot="content">{{$t('services.common.detectedServiceModulesTooltip')}}</div>
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <div v-if="allRegistry.length === 0" class="registry-alert">
                <el-alert type="warning">
                  <div>
                    私有镜像仓库未集成，
                    <el-button type="text" class="theme-color" style="padding: 0;" @click="registryCreateVisible = true">立即集成</el-button>
                  </div>
                </el-alert>
              </div>
              <el-table :data="serviceConfigs.service_module" stripe style="width: 100%;">
                <el-table-column prop="name" :label="$t('services.common.serviceModule')"></el-table-column>
                <el-table-column prop="image_name" :label="$t('services.common.serviceImageName')"></el-table-column>
                <el-table-column prop="image">
                  <template slot="header">
                    <span>{{$t('services.common.serviceImageLabel')}}</span>
                    <el-tooltip effect="dark" placement="top">
                      <div slot="content">
                        工作流任务执行过程中，由构建任务生成 $IMAGE 镜像，部署任务使用生成的 $IMAGE 镜像更新服务。
                        <br />其中 $IMAGE 为系统内置的镜像名称，工作流执行时自动生成。
                        <br />点击「策略」配置镜像名称规则。
                      </div>
                      <span>
                        <i class="el-icon-question"></i>
                      </span>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('services.common.buildInfoAndOperation')">
                  <template slot-scope="scope">
                    <div v-for="(buildName, index) in scope.row.build_names" :key="index">
                      <router-link :to="`${buildBaseUrl}?rightbar=build&service_name=${scope.row.name}&build_name=${buildName}`">
                        <span class="build-name">{{ buildName }}</span>
                      </router-link>
                    </div>
                    <el-button size="small" v-hasPermi="{projectName: projectName, action: 'create_build',isBtn:true}" :disabled="projectName !== projectNameOfService" @click="addBuild(scope.row)" type="text">{{$t('services.common.addServiceBuild')}}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconchakanbianliang"></i>
                </span> {{$t('services.k8s.buildInVariables')}}
                <el-tooltip effect="dark" :content="$t('services.k8s.buildInVariablesTooltip')" placement="top">
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <el-table :data="serviceConfigs.system_variable" stripe style="width: 100%;">
                <el-table-column prop="key" :label="$t(`global.var`)"></el-table-column>
                <el-table-column prop="value" :label="$t('services.k8s.currentValue')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.value">{{scope.row.value}}</span>
                    <span v-else>{{$t('global.emptyText')}}</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconchakanbianliang"></i>
                </span> {{$t('services.k8s.customVariables')}}
                <el-tooltip effect="dark" :content="$t('services.k8s.customVariablesTooltip')" placement="top">
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <div class="variable-operation-container">
                <div class="tab-conatiner">
                  <el-radio-group v-model="variableSwitcher" @input="changeVariableView" size="mini">
                    <el-radio-button label="yamlEditor">
                      <i class="iconfont iconchakanbianliang"></i>
                    </el-radio-button>
                    <el-radio-button label="list">
                      <i class="iconfont iconshuru"></i>
                    </el-radio-button>
                  </el-radio-group>
                </div>
                <div class="parse-container">
                  <el-button v-if="variableSwitcher === 'yamlEditor'" @click="parseK8sYamlVariable" class="parse-btn" type="text" >自动解析变量</el-button>
                </div>
              </div>
              <div v-if="variableSwitcher === 'yamlEditor'" class="kv-container">
                <VariablesEditor
                  style="width: 100%; height: 100%;"
                  ref="myCm"
                  :value="serviceConfigs.variable_yaml"
                  :options="editorOptions"
                  @input="onCmCodeChange"
                />
              </div>
              <div v-else-if="variableSwitcher === 'list'" class="list-container">
                <el-table :data="serviceConfigs.variable_kvs" style="width: 100%;">
                  <el-table-column label="Key">
                    <template slot-scope="scope">
                      <span>{{ scope.row.key }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Value">
                    <template slot-scope="scope">
                      <span>{{ scope.row.value }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column>
                    <template v-slot:header>
                      <span>服务变量中可见</span>
                        <el-tooltip effect="dark" content="关闭后在「环境」-「服务变量」中不可配置" placement="top">
                          <span class="icon-tooltip">
                            <i class="el-icon-question"></i>
                          </span>
                        </el-tooltip>
                        <el-button @click="enableAllVariablesView" :disabled="service.template_id!==''&&service.auto_sync" type="text">
                            <i class="icon-view el-icon-view"></i>
                        </el-button>
                    </template>
                    <span slot-scope="scope" :key="service.service_name">
                      <el-button v-if="scope.row.show" @click="disableVariableView(scope.row)" :disabled="service.template_id!==''&&service.auto_sync" type="text">
                        <i class="icon-view el-icon-view"></i>
                      </el-button>
                      <el-button v-else @click="enableVariableView(scope.row)" :disabled="service.template_id!==''&&service.auto_sync"  type="text">
                        <i class="icon-view iconfont iconinvisible"></i>
                      </el-button>
                    </span>
                  </el-table-column>
                </el-table>
              </div>
              <div class="operation">
                <el-button
                  type="primary"
                  size="small"
                  @click="validateVariables"
                  plain
                  :disabled="variableYamlIsEmpty"
                >{{$t(`global.validate`)}}</el-button>
                <el-button
                  type="primary"
                  size="small"
                  @click="saveServiceVariable"
                  :disabled="variableYamlIsEmpty"
                >{{$t(`global.save`)}}</el-button>
              </div>
            </section>
          </div>
        </div>
        <div v-if="selected === 'policy'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.policySection')}}</div>
          </header>
          <div class="service-aside-help__content">
            <Policy :service="serviceConfigs.service_module" />
          </div>
        </div>
        <div v-if="selected === 'help'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.helpSection')}}</div>
          </header>
          <div class="service-aside-help__content">
            <Help />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {
  serviceTemplateWithConfigAPI,
  getSingleProjectAPI,
  getRegistryWhenBuildAPI,
  getCodeProviderAPI,
  validateKubernetesTemplateVariableAPI,
  saveServiceVariableAPI,
  parseK8sYamlVariableAPI,
  flatVariableToKvAPI
} from '@api'
import CommonBuild from '@/components/projects/build/commonBuild.vue'
import Help from './container/help.vue'
import Policy from './container/policy.vue'
import IntegrationCode from '../common/integrationCode.vue'
import IntegrationRegistry from '@/components/projects/common/integrationRegistry.vue'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/neo.css'
import qs from 'qs'
import { debounce } from 'lodash'

export default {
  data () {
    return {
      allRegistry: [],
      customEnvs: [],
      serviceConfigs: {
        variable_yaml: '',
        service_vars: [],
        variable_kvs: []
      },
      integrationCodeDrawer: false,
      projectForm: {},
      registryCreateVisible: false,
      buildNameIndex: 0,
      variableSwitcher: 'yamlEditor'
    }
  },
  methods: {
    async addBuild (item) {
      // no build: no suffix
      // build: the last number, take the maximum value + 1
      this.buildNameIndex = item.build_names.length
        ? Math.max.apply(
          null,
          item.build_names.map(buildName => {
            const names = buildName.split('-')
            const last = names[names.length - 1]
            return isNaN(last) ? 1 : Number(last) + 1
          })
        )
        : 0
      const key = this.$utils.rsaEncrypt()
      const res = await getCodeProviderAPI(key)
      if (res && res.length > 0) {
        this.$router.push(
          `${this.buildBaseUrl}?rightbar=build&service_name=${item.name}&build_add=true`
        )
      } else {
        this.integrationCodeDrawer = true
      }
    },
    followUpFn () {
      this.getServiceTemplateWithConfig()
      this.$router.replace({
        query: Object.assign(
          {},
          qs.parse(window.location.search, { ignoreQueryPrefix: true }),
          {
            rightbar: 'var'
          }
        )
      })
    },
    getProject () {
      const projectName = this.projectName
      getSingleProjectAPI(projectName).then(res => {
        this.projectForm = res
        if (res.team_id === 0) {
          this.projectForm.team_id = null
        }
      })
    },
    getServiceTemplateWithConfig () {
      if (
        this.service &&
        this.service.type === 'k8s' &&
        this.service.status === 'added'
      ) {
        serviceTemplateWithConfigAPI(
          this.service.service_name,
          this.projectNameOfService
        ).then(res => {
          if (res.variable_kvs && res.service_vars) {
            res.variable_kvs.forEach(element => {
              if (res.service_vars.includes(element.key)) {
                element.show = true
              } else {
                element.show = false
              }
            })
          }
          this.serviceConfigs = res
          this.initVariableYaml = res.variable_yaml
        })
      }
      if (this.service.status === 'named') {
        this.changeRoute('var')
      }
    },
    changeRoute (step) {
      this.$route.query.service_project_name &&
        delete this.$route.query.service_project_name
      this.$route.query.build_name && delete this.$route.query.build_name
      this.$router.replace({
        query: Object.assign({}, this.$route.query, {
          rightbar: step
        })
      })
    },
    getRegistryWhenBuild () {
      getRegistryWhenBuildAPI(this.projectName).then(res => {
        this.allRegistry = res
      })
    },
    onCmCodeChange: debounce(function (newCode) {
      this.serviceConfigs.variable_yaml = newCode
    }, 300),
    validateVariables () {
      const payload = {
        content: this.serviceConfigs.service.yaml,
        variable_yaml: this.serviceConfigs.variable_yaml
      }
      validateKubernetesTemplateVariableAPI(payload)
        .then(res => {
          if (res) {
            this.$message.success(
              this.$t('templates.k8sYaml.validationSuccess')
            )
          }
        })
        .catch(err => {
          this.$message.error(err.message)
        })
    },
    saveServiceVariable () {
      const projectName = this.projectName
      const serviceName = this.service.service_name
      if (this.serviceConfigs.variable_kvs) {
        const serviceVars = []
        this.serviceConfigs.variable_kvs.forEach(element => {
          if (element.show) {
            serviceVars.push(element.key)
          }
        })
        this.serviceConfigs.service_vars = serviceVars
      }
      const payload = {
        variable_yaml: this.serviceConfigs.variable_yaml,
        service_vars: this.serviceConfigs.service_vars
      }
      saveServiceVariableAPI(serviceName, projectName, payload)
        .then(res => {
          if (res) {
            this.$message.success('变量保存成功')
          }
        })
        .catch(err => {
          this.$message.error(err.message)
        })
    },
    parseK8sYamlVariable () {
      const payload = {
        variable_yaml: this.serviceConfigs.service.yaml
      }
      parseK8sYamlVariableAPI(payload)
        .then(res => {
          if (res) {
            this.serviceConfigs.variable_yaml = res
          }
        })
        .catch(err => {
          this.$message.error(err.message)
        })
    },
    changeVariableView (val) {
      if (val === 'list' && this.serviceConfigs.service_vars.length === 0 && this.serviceConfigs.variable_kvs.length === 0) {
        const payload = {
          variable_yaml: this.serviceConfigs.variable_yaml
        }
        flatVariableToKvAPI(payload)
          .then(res => {
            if (res) {
              res.forEach(element => {
                element.show = true
              })
              this.serviceConfigs.variable_kvs = res
            }
          })
          .catch(err => {
            this.$message.error(err.message)
          })
      }
    },
    enableVariableView (row) {
      this.$set(row, 'show', true)
    },
    disableVariableView (row) {
      this.$set(row, 'show', false)
    },
    enableAllVariablesView () {
      this.serviceConfigs.variable_kvs.forEach(element => {
        this.$set(element, 'show', true)
      })
    }
  },
  created () {
    this.getRegistryWhenBuild()
    this.getProject()
    this.getServiceTemplateWithConfig()
    if (this.$route.query.rightbar) {
      this.changeRoute(this.$route.query.rightbar)
    } else {
      this.changeRoute('var')
    }
  },
  props: {
    service: {
      required: false,
      type: Object
    },
    services: {
      required: false,
      type: Array
    },
    buildBaseUrl: {
      required: true,
      type: String
    },
    changeEditorWidth: Function
  },
  watch: {
    service (val) {
      if (val) {
        this.getServiceTemplateWithConfig()
        this.changeRoute('var')
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    projectNameOfService () {
      return this.service.product_name
    },
    serviceType () {
      return 'k8s'
    },
    selected () {
      const defaultAside = this.service.status === 'named' ? 'help' : 'var'
      const selected = this.$route.query.rightbar || defaultAside
      if (selected === 'build') {
        this.changeEditorWidth('30%')
      } else {
        this.changeEditorWidth('50%')
      }
      return selected
    },
    editorOptions () {
      return {
        tabSize: 5,
        readOnly: this.notSaved ? 'nocursor' : false,
        theme: 'neo',
        mode: 'text/plain',
        lineNumbers: true,
        line: true,
        collapseIdentical: true
      }
    },
    variableYamlIsEmpty () {
      return this.serviceConfigs.variable_yaml === ''
    },
    variableNotChanged () {
      return this.serviceConfigs.variable_yaml === this.initVariableYaml
    }
  },
  components: {
    CommonBuild,
    Policy,
    Help,
    IntegrationCode,
    IntegrationRegistry,
    VariablesEditor: codemirror
  }
}
</script>
<style lang="less" scoped>
.aside__wrap {
  position: relative;
  display: flex;
  flex: 1;
  height: 100%;

  .aside__inner {
    display: flex;
    flex: 1;
    flex-direction: row-reverse;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);

    .aside__content {
      flex: 1;
      width: 200px;
      overflow-x: hidden;
      background-color: #fff;

      .service-aside--variables {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        height: 100%;

        .service-aside-box__header {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 35px;
          padding: 10px 7px 10px 20px;

          .service-aside-box__title {
            margin-right: 20px;
            margin-bottom: 0;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
          }
        }

        .service-aside-box__content {
          flex-grow: 1;
          overflow-x: hidden;
          overflow-y: auto;

          .aside-section {
            position: relative;
            padding: 12px 16px;

            h4 {
              margin: 0;
              padding: 0;
              color: #909399;
              font-weight: 300;
            }

            /deep/ .el-table td,
            /deep/ .el-table th {
              padding: 6px 0;
            }

            .variable-operation-container {
              display: flex;
              flex-direction: row;
              align-content: center;
              align-items: center;
              justify-content: space-between;

              .tab-conatiner {
                display: flex;
              }

              .parse-container {
                display: flex;

                .parse-btn {
                  padding: 0;
                }
              }
            }

            .kv-container {
              height: 200px;
              margin-top: 5px;

              /deep/ .vue-codemirror {
                width: 100%;
                height: 100%;

                .CodeMirror {
                  height: 100%;
                  border: 1px solid #ccc;
                  border-radius: 4px;
                }
              }

              .icon-tooltip {
                cursor: pointer;
              }
            }

            .list-container {
              .icon-view {
                cursor: pointer;
              }
            }

            .operation {
              margin-top: 10px;
            }

            .build-name {
              display: inline-block;
              margin-top: 5px;
              font-size: 12px;
              line-height: 16px;
            }
          }
        }

        .service-aside-help__content {
          display: flex;
          flex: 1;
          flex-direction: column;
          height: 100%;
          padding: 0 20px 10px 20px;
          overflow-y: auto;
        }
      }
    }

    .aside-bar {
      .tabs__wrap_vertical {
        flex-direction: column;
        width: 47px;
        height: 100%;
        background-color: #f5f5f5;
        border: none;

        .tabs__item {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: -1px;
          padding: 20px 17px;
          color: #000;
          font-size: 13px;
          text-transform: uppercase;
          text-orientation: mixed;
          background-color: #f5f5f5;
          border: none;
          border-top: 1px solid transparent;
          cursor: pointer;
          transition: background-color 150ms ease, color 150ms ease;

          &.selected {
            z-index: 1;
            background-color: #fff;
            border: none;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          &:hover {
            z-index: 2;
            color: #000;
            background-color: #fff;
            border: none;
            border-top: 1px solid #f5f5f5;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          .step-name {
            font-weight: 500;
            font-size: 14px;
            writing-mode: vertical-rl;
          }
        }
      }

      .tabs__wrap {
        display: flex;
        justify-content: flex-start;
        height: 56px;
      }
    }
  }
}

.theme-color {
  color: @themeColor;
}
</style>
