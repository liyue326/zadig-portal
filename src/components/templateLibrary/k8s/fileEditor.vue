<template>
  <div
       class="pipeline-workflow__column file-editor pipeline-workflow__column--w100p">
    <div class="white-box-with-shadow">
        <div class="white-box-with-shadow__content">
          <div class="row cf-pipeline-yml-build__wrapper">
            <div class="cf-pipeline-yml-build__editor cf-pipeline-yml-build__editor_inline">
              <div
                   class="cf-pipeline-yml-build__editor-wrapper"
                   @keydown.meta.83.prevent="updateFileWhenEnter">
                <codemirror style="width: 100%; height: 100%;"
                            ref="myCm"
                            :value="fileContent.content"
                            :options="cmOptions"
                            @input="onCmCodeChange">
                </codemirror>
              </div>
            </div>
          </div>
        </div>
        <div v-if="errors.length > 0"
             class="yaml-errors__container yaml-errors__accordion-opened">
          <ul class="yaml-errors__errors-list">
            <li v-for="(error,index) in errors"
                :key="index"
                class="yaml-errors__errors-list-item">
              <div class="yaml-errors__errors-list-item-counter"> {{index+1}} </div>
              <div class="yaml-errors__errors-list-item-text">{{error}}</div>
            </li>
          </ul>
        </div>
        <div
             class="controls__wrap">
          <div class="controls__right">
            <el-button v-hasPermi="{type: 'system', action: fileStatus === 'added'?'edit_template':'create_template', isBtn:true, disabled:disabledSave}" type="primary"
                       size="small"
                       :disabled="disabledSave"
                       @click="updateFile">{{$t(`global.save`)}}</el-button>
            <el-button v-hasPermi="{type: 'system', action: fileStatus === 'added'?'edit_template':'create_template', isBtn:true}"
                       size="small"
                       @click="multiUpdate"
                       plain>{{$t('templates.k8sYaml.applyToServices')}}</el-button>
          </div>
        </div>
    </div>
  </div>
</template>
<script>
import { debounce } from 'lodash'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml'
import 'codemirror/theme/neo.css'
import 'codemirror/addon/scroll/annotatescrollbar.js'
import 'codemirror/addon/search/matchesonscrollbar.js'
import 'codemirror/addon/search/matchesonscrollbar.css'
import 'codemirror/addon/search/match-highlighter.js'
import 'codemirror/addon/search/jump-to-line.js'
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/search/searchcursor.js'
import 'codemirror/addon/search/search.js'
import { createKubernetesTemplateAPI, updateKubernetesTemplateAPI, updateMulKubernetesTemplateAPI } from '@api'

export default {
  props: {
    fileContent: {
      type: Object,
      required: true
    },
    fileContentChange: {
      type: Boolean,
      required: true
    }
  },
  data () {
    return {
      cmOptions: {
        tabSize: 5,
        readOnly: false,
        theme: 'neo',
        mode: 'text/x-yaml',
        lineNumbers: true,
        line: true,
        collapseIdentical: true
      },
      errors: [],
      stagedFile: {},
      initFileContent: '',
      newCode: ''
    }
  },
  methods: {
    updateFileWhenEnter () {
      const disabledSave = this.disabledSave
      if (disabledSave) {
        return
      }
      this.updateFile()
    },
    async updateFile () {
      const fileName = this.fileContent.name
      const fileId = this.fileContent.id
      const content = this.fileContent.content
      const variableYaml = this.fileContent.variable_yaml
      const status = this.fileStatus
      const payload = {
        name: fileName,
        content: content,
        variable_yaml: variableYaml
      }
      if (status === 'added') {
        const res = await updateKubernetesTemplateAPI(
          fileId, payload
        )
        if (res) {
          this.$emit('onUpdateFile', { name: fileName, status: 'added', payload })
          this.$message({
            type: 'success',
            message: this.$t('templates.k8sYaml.successfullyUpdated', { fileName: fileName })
          })
        }
      } else if (status === 'named') {
        const res = await createKubernetesTemplateAPI(payload
        ).catch(err => {
          console.log(err)
        })
        if (res) {
          this.$emit('onUpdateFile', { name: fileName, status: 'added', payload })
          this.$message({
            type: 'success',
            message: this.$t('templates.k8sYaml.successfullyCreated', { fileName: fileName })
          })
        }
      }
    },
    onCmCodeChange: debounce(function (newCode) {
      this.errors = []
      this.fileContent.content = newCode
      if (this.fileContent.content) {
        if (this.fileContent.status === 'named') {
          this.stagedFile[this.fileContent.name] = newCode
        }
      }
    }, 500),
    editorFocus () {
      this.codemirror.focus()
    },
    multiUpdate () {
      const fileId = this.fileContent.id
      this.$confirm(this.$t('templates.k8sYaml.applyToServicesTooltip'), this.$t('templates.k8sYaml.confirmToApply'), {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      })
        .then(() => {
          updateMulKubernetesTemplateAPI(fileId).then(res => {
            this.$message({
              type: 'success',
              message: this.$t('templates.k8sYaml.applyToServicesSuccessfully')
            })
          })
        })
    }
  },
  computed: {
    codemirror () {
      return this.$refs.myCm.codemirror
    },
    fileName () {
      return this.fileContent.name
    },
    fileId () {
      return this.fileContent.id
    },
    fileStatus () {
      return this.fileContent.status
    },
    disabledSave () {
      return this.errors.length > 0 || !this.fileContentChange || this.fileContent.content === ''
    }
  },
  mounted () {
    this.editorFocus()
  },
  components: {
    codemirror
  }
}
</script>
<style lang="less">
@import "~@assets/css/component/file-editor.less";
</style>
