<template>
  <div class="aside__wrap">
    <div class="aside__inner">
      <div class="aside-bar">
        <div class="tabs__wrap tabs__wrap_vertical">
          <div class="tabs__item" :class="{'selected': $route.query.rightbar === 'var'}" @click="changeRoute('var')">
            <span class="step-name">变量</span>
          </div>
          <div class="tabs__item" :class="{'selected': $route.query.rightbar === 'reference'}" @click="changeRoute('reference')">
            <span class="step-name">引用列表</span>
          </div>
        </div>
      </div>
      <div class="aside__content">
        <div v-if="$route.query.rightbar === 'reference'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">引用列表</div>
          </header>
          <div class="service-aside-box__content">
            <section class="aside-section">
              <el-table :data="referenceList" stripe style="width: 100%;">
                <el-table-column prop="project_name" label="项目"></el-table-column>
                <el-table-column prop="value" label="服务名称">
                  <template slot-scope="scope">
                    <router-link
                      v-if="scope.row.service_name"
                      :to="`/v1/projects/detail/${scope.row.project_name}/services?service_name=${scope.row.service_name}&rightbar=var`"
                    >{{scope.row.service_name}}</router-link>
                    <span v-else>空</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>
        </div>
        <div v-if="$route.query.rightbar === 'var'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">变量列表</div>
          </header>
          <div class="service-aside-box__content">
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconfuwu"></i>
                </span> 系统内置变量
              </h4>
              <el-table :data="systemVariables" stripe style="width: 100%;">
                <el-table-column prop="key" label="Key"></el-table-column>
                <el-table-column prop="description" label="描述">
                  <template slot-scope="scope">
                    <span v-if="scope.row.description">{{scope.row.description}}</span>
                    <span v-else>空</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont icontanhao"></i>
                </span> 自定义变量
                <el-tooltip effect="dark" :content="'自定义变量通过'+' {{'+'.key}} ' +' 声明'" placement="top">
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <div class="kv-container">
                <VariablesEditor
                  style="width: 100%; height: 100%;"
                  ref="myCm"
                  :value="fileContent.variable_yaml"
                  :options="cmOptions"
                  @input="onCmCodeChange"
                />
              </div>
              <div v-if="notSaved" class="alert-container">
                <el-alert title="请先保存模板" type="info" :closable="false"></el-alert>
              </div>
              <div class="operation" v-else>
                <el-button type="primary" size="small" @click="validateVariables" plain :disabled="variableYamlIsEmpty">校验</el-button>
                <el-button type="primary" size="small" @click="saveKubernetesTemplateVariable" :disabled="variableYamlIsEmpty || variableNotChanged">保存</el-button>
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
  saveKubernetesTemplateVariableAPI
} from '@api'
import { debounce } from 'lodash'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml'
import 'codemirror/theme/neo.css'
export default {
  data () {
    return {
      referenceList: []
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
            this.$message.success('校验成功')
          }
        })
        .catch(err => {
          this.$message.error(err.message)
        })
    },
    saveKubernetesTemplateVariable () {
      const id = this.fileContent.id
      const payload = {
        variable_yaml: this.fileContent.variable_yaml
      }
      saveKubernetesTemplateVariableAPI(id, payload)
        .then(res => {
          if (res) {
            this.$message.success('变量保存成功')
            this.$emit('updateTemplate', this.fileContent)
          }
        })
        .catch(err => {
          this.$message.error(err.message)
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
        mode: 'text/x-yaml',
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
<style lang="less">
.aside__wrap {
  position: relative;
  display: flex;
  flex: 1;
  height: 100%;

  .kv-container {
    height: 200px;
    margin-top: 5px;

    .vue-codemirror {
      width: 100%;
      height: 100%;

      .CodeMirror {
        height: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
    }
  }

  .alert-container {
    margin-top: 10px;
  }

  .operation {
    margin-top: 10px;
  }

  .service-aside-right--resizable {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99;
    width: 5px;
    height: 100%;
    border-left: 1px solid transparent;
    transition: border-color ease-in-out 200ms;

    .capture-area__component {
      position: relative;
      top: 50%;
      left: -6px;
      display: inline-block;
      height: 38px;
      transform: translateY(-50%);

      .capture-area {
        position: absolute;
        width: 10px;
        height: 38px;
        background-color: #fff;
        border: 1px solid #dbdbdb;
        border-radius: 5px;
      }
    }
  }

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

            .el-table td,
            .el-table th {
              padding: 6px 0;
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

      .btn-container {
        padding: 0 10px 10px 10px;
        box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.05);
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
