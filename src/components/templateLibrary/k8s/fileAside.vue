<template>
  <div class="aside__wrap">
    <div class="aside__inner">
      <div class="aside-bar">
        <div class="tabs__wrap tabs__wrap_vertical">
          <div class="tabs__item" :class="{'selected': $route.query.rightbar === 'var'}" @click="changeRoute('var')">
            <span class="step-name">{{$t('templates.k8sYaml.variablesList')}}</span>
          </div>
          <div class="tabs__item" :class="{'selected': $route.query.rightbar === 'reference'}" @click="changeRoute('reference')">
            <span class="step-name">{{$t('templates.k8sYaml.referenceList')}}</span>
          </div>
        </div>
      </div>
      <div class="aside__content">
        <div v-if="$route.query.rightbar === 'reference'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('templates.k8sYaml.referenceList')}}</div>
          </header>
          <div class="service-aside-box__content">
            <section class="aside-section">
              <el-table :data="referenceList" stripe style="width: 100%;">
                <el-table-column prop="project_name" :label="$t('templates.k8sYaml.projectName')"></el-table-column>
                <el-table-column prop="value" :label="$t(`global.serviceName`)">
                  <template slot-scope="scope">
                    <router-link
                      v-if="scope.row.service_name"
                      :to="`/v1/projects/detail/${scope.row.project_name}/services?service_name=${scope.row.service_name}&rightbar=var`"
                    >{{scope.row.service_name}}</router-link>
                    <span v-else>{{$t('templates.k8sYaml.noneVariable')}}</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>
        </div>
        <div v-if="$route.query.rightbar === 'var'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('templates.k8sYaml.variablesList')}}</div>
          </header>
          <div class="service-aside-box__content">
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconfuwu"></i>
                </span>
                {{$t('templates.k8sYaml.systemVariables')}}
              </h4>
              <el-table :data="systemVariables" stripe style="width: 100%;">
                <el-table-column prop="key" label="Key"></el-table-column>
                <el-table-column prop="description" :label="$t('global.desc')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.description">{{scope.row.description}}</span>
                    <span v-else>{{$t('templates.k8sYaml.noneVariable')}}</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont icontanhao"></i>
                </span>
                {{$t('templates.k8sYaml.customVariables')}}
                <el-tooltip effect="dark" :content="$t('templates.k8sYaml.customVariablesTooltip')" placement="top">
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
                  <el-button v-if="variableSwitcher === 'yamlEditor'" @click="parseK8sYamlVariable" class="parse-btn" type="text">自动解析变量</el-button>
                </div>
              </div>
              <div v-if="variableSwitcher === 'yamlEditor'" class="kv-container">
                <VariablesEditor
                  style="width: 100%; height: 100%;"
                  ref="myCm"
                  :value="fileContent.variable_yaml"
                  :options="cmOptions"
                  @input="onCmCodeChange"
                />
              </div>
              <div v-else-if="variableSwitcher === 'list'" class="list-container">
                <el-table :data="fileContent.variable_kvs" style="width: 100%;">
                  <el-table-column prop="key" label="键"></el-table-column>
                  <el-table-column prop="value" label="值"></el-table-column>
                  <el-table-column prop="show" label="服务变量中可见">
                    <template v-slot:header>
                      <span>服务变量中可见</span>
                      <el-tooltip effect="dark" content="关闭后在「环境」-「服务变量」中不可配置" placement="top">
                        <span class="icon-tooltip">
                          <i class="el-icon-question"></i>
                        </span>
                      </el-tooltip>
                      <el-tooltip effect="dark" :content="showAllVariables? '全部隐藏' : '全部显示'" placement="top">
                        <el-button @click="changeAllVariablesView" class="var-button" type="text">
                          <i class="iconfont icon" :class="{'iconview-off1': !showAllVariables, iconview: showAllVariables}" :style="{ color: showAllVariables?'#0066ff':'#99a9bf' }">
                          </i>
                        </el-button>
                      </el-tooltip>
                    </template>
                    <template slot-scope="scope">
                      <el-button v-if="scope.row.show" @click="disableVariableView(scope.row)"  class="var-button"  type="text">
                        <i class="icon-view el-icon-view"></i>
                      </el-button>
                      <el-button v-else @click="enableVariableView(scope.row)"  class="var-button  not-show" type="text">
                        <i class="icon-view iconfont iconinvisible"></i>
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-if="notSaved" class="alert-container">
                <el-alert :title="$t('templates.k8sYaml.saveTemplateFirst')" type="info" :closable="false"></el-alert>
              </div>
              <div class="operation" v-else>
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
                  @click="saveKubernetesTemplateVariable"
                  :disabled="variableYamlIsEmpty"
                >{{$t(`global.save`)}}</el-button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {
  getKubernetesTemplateBuildReferenceAPI,
  validateKubernetesTemplateVariableAPI,
  saveKubernetesTemplateVariableAPI,
  parseK8sYamlVariableAPI,
  flatVariableToKvAPI
} from '@api'
import { debounce } from 'lodash'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/neo.css'
export default {
  data () {
    return {
      referenceList: [],
      showAllVariables: true,
      variableSwitcher: 'yamlEditor'
    }
  },
  methods: {
    async getBuildReference () {
      if (this.fileContent && this.fileContent.status === 'added') {
        const res = await getKubernetesTemplateBuildReferenceAPI(
          this.fileContent.id
        ).catch(err => {
          console.log(err)
        })
        if (res) {
          this.referenceList = res
        }
      }
    },
    changeRoute (step) {
      this.$router.replace({
        query: Object.assign({}, this.$route.query, {
          rightbar: step
        })
      })
    },
    onCmCodeChange: debounce(function (newCode) {
      this.fileContent.variable_yaml = newCode
    }, 300),
    validateVariables () {
      const payload = {
        content: this.fileContent.content,
        variable_yaml: this.fileContent.variable_yaml
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
    saveKubernetesTemplateVariable () {
      const id = this.fileContent.id
      if (this.fileContent.variable_kvs) {
        const serviceVars = []
        this.fileContent.variable_kvs.forEach(element => {
          if (element.show) {
            serviceVars.push(element.key)
          }
        })
        this.fileContent.service_vars = serviceVars
      }
      const payload = {
        variable_yaml: this.fileContent.variable_yaml,
        service_vars: this.fileContent.service_vars
      }
      saveKubernetesTemplateVariableAPI(id, payload)
        .then(res => {
          if (res) {
            this.$message.success(
              this.$t('templates.k8sYaml.successfullySaved')
            )
            this.$emit('updateTemplate', this.fileContent)
          }
        })
        .catch(err => {
          this.$message.error(err.message)
        })
    },
    parseK8sYamlVariable () {
      const payload = {
        variable_yaml: this.fileContent.content
      }
      parseK8sYamlVariableAPI(payload)
        .then(res => {
          if (res) {
            this.fileContent.variable_yaml = res
          }
        })
        .catch(err => {
          this.$message.error(err.message)
        })
    },
    changeVariableView (val) {
      if (val === 'list') {
        const payload = {
          variable_yaml: this.fileContent.variable_yaml
        }
        flatVariableToKvAPI(payload)
          .then(res => {
            if (res) {
              res.forEach(element => {
                if (this.fileContent.service_vars && this.fileContent.service_vars.includes(element.key)) {
                  element.show = true
                }
                if (this.fileContent.variable_kvs.length === 0) {
                  element.show = true
                }
              })
              this.fileContent.variable_kvs = res
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
    changeAllVariablesView () {
      const currentDisplay = !this.showAllVariables
      this.showAllVariables = currentDisplay
      this.fileContent.variable_kvs.forEach(element => {
        this.$set(element, 'show', currentDisplay)
      })
    }
  },
  props: {
    fileContent: {
      required: true,
      type: Object
    },
    systemVariables: {
      required: true,
      type: Array
    },
    initVariableYaml: {
      required: true,
      type: String
    }
  },
  computed: {
    notSaved () {
      return this.fileContent.status === 'named'
    },
    cmOptions () {
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
      return this.fileContent.variable_yaml === ''
    },
    variableNotChanged () {
      return this.fileContent.variable_yaml === this.initVariableYaml
    }
  },
  watch: {
    fileContent: {
      handler (val, old_val) {
        if (val) {
          this.getBuildReference(val.id)
        }
      },
      immediate: false
    }
  },
  components: {
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
              .var-button {
                padding: 0;

                &.not-show {
                  color: #99a9bf;
                }
              }
            }

            .alert-container {
              margin-top: 10px;
            }

            .operation {
              margin-top: 10px;
            }
          }
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
</style>
