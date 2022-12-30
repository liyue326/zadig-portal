<template>
  <div class="workflow-task-detail workflow-or-pipeline-task-detail">
    <div class="common-parcel-block">
      <div class="workflow-basic-info">
        <div class="basic-left">
          <div class="primary-title not-first-child">{{$t(`scanning.details.basicInformation`)}}</div>
          <el-form class="secondary-form" label-width="100px" label-position="left">
            <el-form-item :label="$t(`global.status`)">
              <el-tag
                size="small"
                effect="dark"
                :type="$utils.taskElTagType(taskDetail.status)"
                close-transition
              >{{ taskDetail.status?$t(`workflowTaskStatus.${taskDetail.status}`):$t(`workflowTaskStatus.notRunning`) }}</el-tag>
            </el-form-item>
            <el-form-item :label="$t(`global.creator`)">{{ taskDetail.creator }}</el-form-item>
            <el-form-item v-if="taskDetail.task_revoker" :label="$t(`scanning.canceller`)">{{ taskDetail.task_revoker }}</el-form-item>
            <el-form-item :label="$t(`workflow.duration`)">{{ taskDetail.interval }}</el-form-item>
            <el-form-item v-if="showOperation()" :label="$t(`global.operation`)">
              <!-- <el-button
                v-if="taskDetail.status==='failed' || taskDetail.status==='cancelled' || taskDetail.status==='timeout'"
                @click="rerun"
                type="text"
                size="medium"
              >失败重试</el-button> -->
              <el-button v-if="taskDetail.status==='running'||taskDetail.status==='created'" @click="cancel" type="text" size="medium">{{$t(`scanning.cancelTask`)}}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div class="primary-title not-first-child">{{$t(`scanning.title`)}}</div>
      <template v-if="scannerTaskArray.length > 0">
        <el-table
          :data="scannerTaskArray"
          row-key="create_time"
          :expand-row-keys="expandedTasks"
          @expand-change="updateTestExpanded"
          row-class-name="my-table-row"
          :empty-text="$t(`global.emptyText`)"
          class="task-table"
        >
          <el-table-column type="expand">
            <template slot-scope="scope">
              <TaskDetailScanner
                ref="taskDetailScanner"
                :task="scope.row"
                :scannerId="scannerId"
                :scannerName="scannerName"
                :taskID="taskID"
              />
            </template>
          </el-table-column>

          <el-table-column :label="$t(`global.name`)" width="200px">
            <template>
              <span>{{scannerName}}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t(`global.repository`)">
            <template slot-scope="scope">
              <span v-if="scope.row.repo_info && scope.row.repo_info.length > 0">{{scope.row.repo_info[0].repo_name}}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t(`global.status`)">
            <template slot-scope="scope">
              <span :class="colorTranslation(scope.row.status, 'pipeline', 'task')">{{ scope.row.status?$t(`workflowTaskStatus.${scope.row.status}`):$t(`workflowTaskStatus.notRunning`) }}</span>
              <span style="margin-left: 10px;">{{ makePrettyElapsedTime(scope.row) }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t(`scanning.resultLink`)">
            <template slot-scope="scope">
              <span v-if="scope.row.result_link">
                <a :href="scope.row.result_link" target="_blank" rel="noopener noreferrer">{{$t(`scanning.viewResultLink`)}}</a>
              </span>
              <span v-else>N/A</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-backtop target=".workflow-or-pipeline-task-detail"></el-backtop>
    </div>
  </div>
</template>

<script>
import {
  scannerTaskDetailAPI,
  scannerTaskDetailSSEAPI,
  restartScannerTaskAPI,
  cancelScannerTaskAPI
} from '@api'
import { colorTranslate } from '@utils/wordTranslate.js'
import bus from '@utils/eventBus'
import TaskDetailScanner from './common/taskDetailScanner.vue'
export default {
  data () {
    return {
      taskDetail: {
        repo_info: []
      },
      expandedTasks: [],
      artifactModalVisible: false
    }
  },
  props: {
    basePath: {
      request: true,
      type: String
    }
  },
  computed: {
    scannerName () {
      return this.$route.params.scanner_name
    },
    scannerId () {
      return this.$route.query.id
    },
    taskID () {
      return this.$route.params.task_id
    },
    status () {
      return this.$route.query.status
    },
    projectName () {
      return this.$route.params.project_name
    },
    scannerTaskArray () {
      return [this.taskDetail]
    }
  },
  methods: {
    isStageDone (name) {
      if (this.taskDetail.stages.length > 0) {
        const stage = this.taskDetail.stages.find(element => {
          return element.type === name
        })
        return stage ? stage.status === 'passed' : false
      }
    },
    rerun () {
      const taskUrl = `/v1/projects/detail/${this.projectName}/test/detail/function/${this.scannerName}/${this.taskID}`
      restartScannerTaskAPI(
        this.scannerId,
        this.taskID,
        this.projectName
      ).then(res => {
        this.$message.success(this.$t(`scanning.prompt.restarted`))
        this.$router.push(taskUrl)
      })
    },
    cancel () {
      const scannerId = this.scannerId
      const taskID = this.taskID
      const projectName = this.projectName
      cancelScannerTaskAPI(scannerId, taskID, projectName).then(res => {
        if (this.$refs && this.$refs.taskDetailScanner) {
          this.$refs.taskDetailScanner.killLog('scanner')
        }
        this.$message.success(this.$t(`scanning.prompt.canceled`))
      })
    },
    fetchRunningTaskDetail () {
      const scannerId = this.scannerId
      const taskID = this.taskID
      const projectName = this.projectName
      return scannerTaskDetailSSEAPI(scannerId, taskID, projectName)
        .then(res => {
          this.adaptTaskDetail(res.data)
          this.taskDetail = res.data
        })
        .closeWhenDestroy(this)
    },
    fetchHistoryTaskDetail () {
      const scannerId = this.scannerId
      const taskID = this.taskID
      const projectName = this.projectName
      scannerTaskDetailAPI(scannerId, taskID, projectName).then(res => {
        this.adaptTaskDetail(res)
        this.taskDetail = res
      })
    },
    adaptTaskDetail (detail) {
      detail.interval = this.$utils.timeFormat(
        (detail.status === 'running'
          ? Math.round(new Date().getTime() / 1000)
          : detail.end_time) - detail.create_time
      )
    },
    repoID (repo) {
      return `${repo.source}/${repo.repo_owner}/${repo.repo_name}`
    },
    colorTranslation (word, category, subitem) {
      return colorTranslate(word, category, subitem)
    },
    calcElapsedTimeNum (subTask) {
      if (this.$utils.isEmpty(subTask) || subTask.status === '') {
        return 0
      }
      const endTime =
        subTask.status === 'running' || subTask.status === 'prepare'
          ? Math.floor(Date.now() / 1000)
          : subTask.end_time
      return endTime - subTask.create_time
    },
    makePrettyElapsedTime (subTask) {
      return this.$utils.timeFormat(this.calcElapsedTimeNum(subTask))
    },

    updateTestExpanded (row, expandedRows) {
      this.expandedTasks = expandedRows.map(r => r.create_time)
    },
    showOperation () {
      if (
        this.taskDetail.status === 'failed' ||
        this.taskDetail.status === 'cancelled' ||
        this.taskDetail.status === 'timeout'
      ) {
        return true
      }
      if (
        this.taskDetail.status === 'running' ||
        this.taskDetail.status === 'created'
      ) {
        return true
      }

      return false
    }
  },
  watch: {
    $route (to, from) {
      if (this.$route.query.status === 'running') {
        this.fetchRunningTaskDetail()
      } else {
        this.fetchHistoryTaskDetail()
      }
    }
  },
  created () {
    if (this.status === 'running') {
      this.fetchRunningTaskDetail()
    } else {
      this.fetchHistoryTaskDetail()
    }
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t(`subTopbarMenu.projects`), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: this.$t(`subTopbarMenu.scannings`),
          url: `/v1/projects/detail/${this.projectName}/scanner`
        },
        {
          title: this.scannerName,
          url: `/v1/projects/detail/${this.projectName}/scanner/detail/${this.scannerName}?id=${this.scannerId}`
        },
        { title: `#${this.taskID}` }
      ]
    })
  },
  components: {
    TaskDetailScanner
  }
}
</script>

<style lang="less" scoped>
.workflow-task-detail {
  position: relative;
  flex: 1;
  box-sizing: border-box;
  height: 100%;
  padding: 24px 30px;
  overflow: auto;

  .workflow-basic-info {
    display: flex;

    .basic-left {
      flex: 0 1 30%;
    }

    .basic-right {
      flex: 1 1 70%;

      &.version-info {
        flex-basis: 50%;
        margin-left: 18%;
      }
    }
  }
}
</style>
