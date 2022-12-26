<template>
  <div class="k8s-template-container">
    <div class="service-wrap">
      <div class="service-container">
        <multipane class="vertical-panes" layout="vertical">
          <div class="file-tree-container" :style="{width: '240px', maxWidth: '400px'}">
            <FileTree
              :files="files"
              :fileContentChange="fileContentChange"
              ref="FileTree"
              @onRefreshFile="getFiles"
              @onSelectFileChange="onSelectFileChange"
              @updateFile="updateFile($event)"
           />
          </div>
          <template v-if="files.length >0">
            <template>
              <multipane-resizer></multipane-resizer>
              <div class="file-editor-container" :style="{ minWidth: '300px', width: '500px' }">
                <FileEditor
                  ref="FileEditor"
                  :fileContent="fileContent"
                  :fileContentChange="fileContentChange"
                  @onRefreshFile="getFiles"
                  @onUpdateFile="onUpdateFile"
                />
              </div>
              <multipane-resizer></multipane-resizer>
              <aside class="service-aside service-aside-right" :style="{ flexGrow: 1 }">
                <FileAside
                  :fileContent="fileContent"
                  :initVariableYaml="initVariableYaml"
                  :systemVariables="systemVariables"
                  @updateTemplate="updateTemplate"
                />
              </aside>
            </template>
          </template>
          <div v-else class="no-content">
            <img src="@assets/icons/illustration/editorNoService.svg" alt />
            <p v-if="files.length === 0">
              {{$t('templates.k8sYaml.noTemplate')}}
              <el-button v-hasPermi="{type: 'system', action: 'create_template'}" size="mini" icon="el-icon-plus" @click="createFile()" plain circle></el-button>{{$t('templates.k8sYaml.createTemplate')}}
            </p>
            <p v-else-if="file.name==='模板列表' && files.length >0">{{$t('templates.k8sYaml.selectTemplateToEdit')}}</p>
            <p v-else-if="!file.name && files.length >0">{{$t('templates.k8sYaml.selectTemplateToEdit')}}</p>
          </div>
        </multipane>
      </div>
    </div>
  </div>
</template>
<script>
import mixin from '@/mixin/serviceModuleMixin'
import FileAside from './fileAside.vue'
import FileEditor from './fileEditor.vue'
import FileTree from './fileTree.vue'
import { sortBy } from 'lodash'
import bus from '@utils/eventBus'
import { getKubernetesTemplatesAPI, getKubernetesTemplateDetailAPI } from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
export default {
  data () {
    return {
      fileInTree: {},
      fileContent: {
        content: ''
      },
      files: [],
      inputVariables: [],
      systemVariables: [],
      initFileContent: '',
      initVariableYaml: ''
    }
  },
  methods: {
    createFile () {
      this.$refs.FileTree.createFile()
    },
    onSelectFileChange (file) {
      this.$set(this, 'fileInTree', file)
    },
    getFiles () {
      this.$set(this, 'fileInTree', {})
      getKubernetesTemplatesAPI().then(res => {
        this.systemVariables = res.system_variables
        this.files = sortBy(
          res.yaml_template.map(file => {
            file.status = 'added'
            return file
          }),
          'name'
        )
      })
    },
    async getFile (val) {
      const id = val ? val.id : null
      const status = val.status
      if (id && status === 'added') {
        const res = await getKubernetesTemplateDetailAPI(id).catch(err => {
          console.log(err)
        })
        if (res) {
          if (res.variable_kvs && res.service_vars) {
            res.variable_kvs.forEach(element => {
              if (res.service_vars.includes(element.key)) {
                element.show = true
              } else {
                element.show = false
              }
            })
          }
          res.status = 'added'
          this.fileContent = res
          this.initFileContent = res.content
          this.initVariableYaml = res.variable_yaml
        }
      }
    },
    updateTemplate (content) {
      this.getFile(content)
    },
    onUpdateFile ({ name, status, res }) {
      this.$router.replace({
        query: Object.assign(
          {},
          {},
          {
            name: name,
            rightbar: 'var'
          }
        )
      })
      if (status === 'added') {
        this.getFiles()
      }
    },
    updateFile (switchNode) {
      this.$refs.FileEditor.updateFile().then(() => {
        if (switchNode) {
          this.$refs.FileTree.selectAndSwitchTreeNode()
        }
      })
    }
  },
  computed: {
    fileName () {
      return this.$route.query.name
    },
    fileContentChange () {
      return this.initFileContent !== this.fileContent.content
    }
  },
  watch: {
    fileInTree: {
      handler (val, old_val) {
        if (val.status === 'added') {
          this.getFile(val)
        } else if (val.status === 'named') {
          this.initFileContent = ''
          this.fileContent = {
            content: '',
            name: val.name,
            status: 'named',
            variable_yaml: ''
          }
        }
      },
      immediate: false
    }
  },
  mounted () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('project.templates'), url: '/v1/template' },
        { title: 'K8s YAML', url: '' }
      ]
    })
    this.getFiles()
  },
  components: {
    FileAside,
    FileEditor,
    FileTree,
    Multipane,
    MultipaneResizer
  },
  mixins: [mixin]
}
</script>

<style lang="less" scoped>
@import '~@assets/css/component/k8s-template.less';
</style>
