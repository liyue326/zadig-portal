<template>
  <div v-loading="loading" class="download-artifact-container">
    <el-table :data="fileList.file_names" height="300" style="width: 100%;">
      <el-table-column label="文件列表">
        <template slot-scope="scope">
          <span>{{ scope.row }}</span>
        </template>
      </el-table-column>
    </el-table>
    <div>
      <span class="download">
        <a :href="downloadUrl" download>
          <el-button size="small" type="primary" :disabled="fileList.file_names.length===0" plain>下载</el-button>
        </a>
      </span>
    </div>
  </div>
</template>

<script>
import store from 'storejs'
import { getArtifactWorkspaceAPI, getTestFileListAPI } from '@api'
export default {
  props: {
    workflowName: {
      type: String,
      required: true
    },

    taskId: {
      type: String,
      required: true
    },
    showArtifact: {
      type: Boolean,
      default: false,
      required: true
    },
    type: {
      type: String,
      default: ''
    },
    jobName: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      fileList: {},
      loading: true,
      defaultProps: {
        children: 'children',
        label: 'name',
        isLeaf: 'leaf'
      }
    }
  },
  methods: {
    getArtifactWorkspace () {
      const projectName = this.projectName
      const workflowName = this.workflowName
      const taskId = this.taskId
      const jobName = this.jobName
      this.loading = true
      if (this.type === 'customWorkflow') {
        getTestFileListAPI(workflowName, taskId, jobName, projectName).then(res => {
          this.loading = false
          this.fileList = res
        })
      } else {
        getArtifactWorkspaceAPI(projectName, workflowName, taskId).then(res => {
          this.loading = false
          this.fileList = res
        })
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    downloadUrl () {
      const projectName = this.projectName
      const token = store.get('userInfo').token
      if (this.type === 'customWorkflow') {
        return `/api/aslan/workflow/v4/workflowtask/workflow/${this.workflowName}/taskId/${this.taskId}/job/${this.jobName}?token=${token}&projectName=${projectName}&notHistoryFileFlag=${this.fileList.not_history_file_flag}`
      } else {
        return `/api/aslan/workflow/v2/tasks/workflow/${this.workflowName}/taskId/${this.taskId}?token=${token}&projectName=${projectName}&notHistoryFileFlag=${this.fileList.not_history_file_flag}`
      }
    }
  },
  mounted () {
    this.getArtifactWorkspace()
  }
}
</script>

<style lang="less" >
.download-artifact-container {
  position: relative;
  padding: 0 10px;
  overflow: auto;
  font-size: 13px;
  background-color: #fff;

  .el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content {
    background-color: #06f3;
  }

  .el-tree-node {
    margin: 5px 0;

    .artifact-tree-node {
      position: relative;
      display: inline-block;
      width: 100%;
      line-height: 22px;

      .folder-icon {
        display: inline-block;
        font-size: 16px;
      }

      .file-name {
        display: inline-block;
        font-size: 15px;
      }

      .basic-info {
        float: right;
        padding-right: 40px;

        .mod-time,
        .size {
          padding-left: 35px;
          color: #c0c4cc;
        }
      }
    }
  }

  .download {
    display: inline-block;
    margin-top: 10px;
    margin-bottom: 15px;
  }
}
</style>
