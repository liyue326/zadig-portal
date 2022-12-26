<template>
  <div class="variable-preview-editor-container">
    <span @click="dialogVisible=true" class="view-btn">{{$t('environments.k8s.variableListComp.preview')}}</span>
    <el-dialog
      :title="$t('environments.k8s.variableListComp.preview')"
      :visible.sync="dialogVisible"
      width="60%"
      class="global-variable-preview-dialog"
      append-to-body
      :close-on-click-modal="false"
    >
      <span>{{$t('environments.k8s.variableListComp.selectService')}}</span>
      <el-select v-model="currentService" @change="getPreviewYaml" size="small" :placeholder="$t('environments.k8s.variableListComp.selectServicePlaceholder')">
        <el-option v-for="item in services" :key="item.service_name" :label="item.service_name" :value="item.service_name"></el-option>
      </el-select>
      <CodeMirror ref="codemirror-full" :value="renderedYaml" :options="options" class="editor-container" />
      <div v-if="errors.length > 0" class="yaml-errors__container">
        <ul class="yaml-errors__errors-list">
          <li v-for="(error,index) in errors" :key="index" class="yaml-errors__errors-list-item">
            <div class="yaml-errors__errors-list-item-counter">{{index+1}}</div>
            <div class="yaml-errors__errors-list-item-text">{{error.message}}</div>
          </li>
        </ul>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" type="primary" @click="dialogVisible = false">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { serviceTemplateAfterRenderByEnvAPI, validateYamlAPI } from '@api'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/theme/neo.css'
export default {
  name: 'VariablePreviewEditor',
  components: {
    CodeMirror: codemirror
  },
  data () {
    return {
      dialogVisible: false,
      renderedYaml: '',
      currentService: '',
      errors: [],
      options: {
        tabSize: 2,
        mode: 'text/yaml',
        lineNumbers: true,
        theme: 'neo',
        line: true,
        showPrintMargin: false,
        readOnly: true,
        collapseIdentical: true
      }
    }
  },
  computed: {
    cm () {
      return this.$refs['codemirror-full'].codemirror
    }
  },
  methods: {
    async getPreviewYaml () {
      const projectName = this.projectName
      const serviceName = this.currentService
      const envName = this.envName
      const variables = this.variables.map(item => {
        return {
          key: item.key,
          value: item.value
        }
      })
      const payload = {
        service_name: serviceName,
        env_name: envName,
        variables: variables
      }
      if (serviceName) {
        const res = await serviceTemplateAfterRenderByEnvAPI(
          projectName,
          serviceName,
          payload
        ).catch(err => console.log(err))
        if (res) {
          this.renderedYaml = res
          this.$nextTick(() => {
            this.cm.execCommand('goDocStart')
          })
          const validatePayload = {
            yaml: res
          }
          const errors = await validateYamlAPI(projectName, validatePayload).catch(
            error => {
              console.log(error)
            }
          )
          if (errors && errors.length > 0) {
            this.errors = errors
          } else {
            this.errors = []
          }
        }
      } else {
        this.renderedYaml = ''
      }
    }
  },
  props: {
    variables: {
      required: true,
      type: Array
    },
    services: {
      required: true,
      type: Array
    },
    envName: {
      required: false,
      type: String,
      default: ''
    },
    serviceName: {
      required: false,
      type: String
    },
    projectName: {
      required: true,
      type: String
    }
  },
  watch: {
    dialogVisible (val) {
      if (val) {
        if (this.serviceName) {
          this.currentService = this.serviceName
        } else if (this.services.length > 0) {
          this.currentService = this.services[0].service_name
        } else {
          this.currentService = ''
        }
        this.getPreviewYaml()
      }
    }
  }
}
</script>

<style lang="less" scoped>
.global-variable-preview-dialog {
  .editor-container {
    max-height: 100%;
    margin-top: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;

    .vue-codemirror {
      width: calc(~'100%');
      overflow-y: auto;

      /deep/ .CodeMirror {
        height: auto;
        border-radius: 2px;
      }
    }
  }

  .yaml-errors__container {
    position: relative;
    margin-bottom: 0;
    overflow-y: hidden;
    background-color: #eb5848;

    .yaml-errors__errors-list {
      max-height: 180px;
      margin: 0;
      list-style: none;
      background-color: #eb5848;

      &.yaml-infos__infos-list {
        background-color: #909399;
      }

      .yaml-errors__errors-list-item {
        display: flex;
        align-items: center;
        padding-left: 10px;
        color: #fff;
        font-size: 14px;
        background-color: #eb5848;
        border-bottom: 1px solid #ff7666;

        &.yaml-infos__infos-list-item {
          background-color: #909399;
        }

        .yaml-errors__errors-list-item-counter {
          margin-right: 20px;
          font-weight: bold;
        }

        .yaml-errors__errors-list-item-text {
          flex: 1;
          width: 300px;
          max-width: 100%;
          padding: 5px 0;
        }

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }
}

.variable-preview-editor-container {
  display: inline-flex;

  .view-btn {
    display: inline-flex;
    color: @themeColor;
    font-size: 14px;
    cursor: pointer;
  }

  .editor-container {
    max-height: 100%;
    margin-top: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;

    .vue-codemirror {
      width: calc(~'100%');
      overflow-y: auto;

      /deep/ .CodeMirror {
        height: auto;
        border-radius: 2px;
      }
    }
  }
}
</style>
