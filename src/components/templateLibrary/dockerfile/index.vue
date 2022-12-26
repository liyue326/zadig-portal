<template>
    <div class="dockerfile-template-container">
      <div class="service-wrap">
        <div class="service-container">
          <multipane class="vertical-panes"
                     layout="vertical">
            <div class="file-tree-container" :style="{width: '240px', maxWidth: '400px'}">
              <FileTree :files="files"
                           :fileContentChange="fileContentChange"
                           ref="FileTree"
                           @onRefreshFile="getFiles"
                           @onSelectFileChange="onSelectFileChange"
                           @updateFile="updateFile($event)" />
            </div>
            <template v-if="files.length >0">
              <template>
                <multipane-resizer></multipane-resizer>
                <div class="file-editor-container"
                     :style="{ minWidth: '300px', width: '500px' }">
                  <FileEditor ref="FileEditor"
                                    :fileContent="fileContent"
                                    :fileContentChange="fileContentChange"
                                    @onRefreshFile="getFiles"
                                    @onUpdateFile="onUpdateFile" />
                </div>
                <multipane-resizer></multipane-resizer>
                <aside class="service-aside service-aside-right"
                       :style="{ flexGrow: 1 }">
                  <FileAside :fileContent="fileContent" />
                </aside>
              </template>
            </template>
            <div v-else
                 class="no-content">
              <img src="@assets/icons/illustration/editorNoService.svg"
                   alt="">
              <p v-if="files.length === 0">{{$t(`templates.dockerfile.noTemplate`)}} <el-button v-hasPermi="{type: 'system', action: 'create_template'}" size="mini"
                           icon="el-icon-plus"
                           @click="createFile()"
                           plain
                           circle>
                </el-button> {{$t(`templates.dockerfile.createTemplateTooltip`)}}</p>
              <p v-else-if="file.name==='模板列表' && files.length >0">{{$t(`templates.dockerfile.selectTemplateToEdit`)}}</p>
              <p v-else-if="!file.name && files.length >0">{{$t(`templates.dockerfile.selectTemplateToEdit`)}}</p>
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
import {
  getDockerfileTemplatesAPI, getDockerfileAPI
} from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
export default {
  data () {
    return {
      fileInTree: {},
      fileContent: {
        content: ''
      },
      files: [],
      initFileContent: ''
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
      getDockerfileTemplatesAPI().then((res) => {
        this.files = sortBy((res.dockerfile_template.map(file => {
          file.status = 'added'
          return file
        })), 'name')
      })
    },
    async getFile (val) {
      const id = val ? val.id : null
      const status = val.status
      if (id && status === 'added') {
        const res = await getDockerfileAPI(
          id
        ).catch(err => {
          console.log(err)
        })
        if (res) {
          res.status = 'added'
          this.fileContent = res
          this.initFileContent = res.content
        }
      }
    },
    onUpdateFile ({ name, status, res }) {
      this.$router.replace({
        query: Object.assign(
          {},
          {},
          {
            name: name,
            rightbar: 'var'
          })
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
          this.fileContent = {
            content: '',
            name: val.name,
            status: 'named'
          }
          // if (this.stagedFile[val.name]) {
          //   this.fileInTree.content = this.stagedFile[val.name]
          // }
          // this.$refs.myCm && this.editorFocus()
        }
      },
      immediate: false
    }
  },
  mounted () {
    this.getFiles()
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t(`subTopbarMenu.templates`), url: '/v1/template' },
        { title: 'Dockerfile', url: '' }
      ]
    })
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
@import "~@assets/css/component/dockerfile-template.less";
</style>
