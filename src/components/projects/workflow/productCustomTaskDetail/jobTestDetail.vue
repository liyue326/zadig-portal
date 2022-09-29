<template>
  <div class="job-test-detail">
    <header class="mg-b8">
      <el-col :span="6">
        <span class="type">测试</span>
        <span>{{jobInfo.name}}</span>
      </el-col>
      <el-col :span="2">
        <a :class="buildOverallColor" href="#buildv4-log">{{jobInfo.status?buildOverallStatusZh:"未运行"}}</a>
      </el-col>
      <el-col :span="2">
        <span>{{jobInfo.interval}}</span>
      </el-col>
      <el-col :span="1" class="close">
        <span @click="$emit('showFooter',false)">
          <i class="el-icon-close"></i>
        </span>
      </el-col>
    </header>
    <main>
      <section>
        <div class="error-wrapper">
          <el-alert v-if="jobInfo.error" title="错误信息" :description="jobInfo.error" type="error" close-text="知道了"></el-alert>
        </div>
        <el-row class="item" :gutter="0" >
          <el-col :span="4">
            <div class="item-title">项目名称</div>
          </el-col>
          <el-col :span="8">
            <div class="item-desc">{{jobInfo.spec.project_name}}</div>
          </el-col>
          <el-col :span="4">
            <div class="item-title">测试名称</div>
          </el-col>
          <el-col :span="8">
            <div class="item-desc">{{jobInfo.spec.test_name}}</div>
          </el-col>
        </el-row>
        <el-row class="item" :gutter="0" v-for="(build,index) in jobInfo.spec.repos" :key="index">
          <el-col :span="4">
            <div class="item-title">代码库({{build.source}})</div>
          </el-col>
          <el-col :span="8">
            <div class="item-desc">{{build.repo_name}}</div>
          </el-col>
          <el-col :span="4">
            <div class="item-title">代码信息</div>
          </el-col>
          <el-col :span="8">
            <RepoJump :build="build" showIcon />
          </el-col>
        </el-row>
        <el-row :gutter="0" class="item">
          <el-col :span="4">
            <div class="item-title">JUnit 测试报告</div>
          </el-col>
          <el-col :span="8">
            <span class="item-desc" v-if="jobInfo.spec.junit_report">
              <router-link class="show-test-result" :to="getTestReport('')">查看</router-link>
            </span>
          </el-col>
          <el-col :span="4">
            <div class="item-title">文件导出</div>
          </el-col>
          <el-col :span="8">
            <span class="item-desc" v-if="jobInfo.spec.archive">
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :underline="false"
                target="_blank"
                @click="artifactModalVisible=true"
              >下载</el-link>
            </span>
          </el-col>
        </el-row>
        <el-row :gutter="0" class="item">
          <el-col :span="4">
            <div class="item-title">Html 测试报告</div>
          </el-col>
          <el-col :span="8">
            <span class="item-desc" v-if="jobInfo.spec.html_report">
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :underline="false"
                target="_blank"
                @click="getTestReport('html')"
              >查看</el-link>
            </span>
          </el-col>
        </el-row>
      </section>
      <section class="log-content mg-t8">
        <XtermLog :id="jobInfo.name" @mouseleave.native="leaveLog" :logs="buildv4AnyLog" :from="jobInfo.name" />
      </section>
    </main>
    <el-dialog :visible.sync="artifactModalVisible" width="60%" title="Artifact 文件导出" class="downloadArtifact-dialog">
      <ArtifactDownload
        ref="downloadArtifact"
        type="customWorkflow"
        :jobName="jobInfo.name"
        :workflowName="workflowName"
        :taskId="taskId"
        :showArtifact="artifactModalVisible"
      />
    </el-dialog>
  </div>
</template>

<script>
import RepoJump from '@/components/projects/workflow/common/repoJump.vue'
import mixin from '@/mixin/killSSELogMixin'
import { getHistoryLogsAPI } from '@api'
import ArtifactDownload from '@/components/common/artifactDownload.vue'

export default {
  data () {
    return {
      buildv4AnyLog: [],
      wsBuildDataBuffer: [],
      buildLogStarted: true,
      window: window,
      firstLoad: false,
      artifactModalVisible: false
    }
  },
  props: {
    jobInfo: {
      type: Object,
      default: () => ({})
    },
    projectName: {
      type: String,
      default: ''
    },
    taskId: {
      type: [String, Number],
      default: 1
    },
    workflowName: {
      type: String,
      default: ''
    },
    isShowConsoleFooter: {
      type: Boolean,
      default: false
    }
  },
  mixins: [mixin],
  components: {
    RepoJump,
    ArtifactDownload
  },
  computed: {
    buildIsRunning () {
      return this.jobInfo && this.jobInfo.status === 'running'
    },
    buildIsDone () {
      return this.isSubTaskDone(this.jobInfo)
    },
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.jobInfo, {})
    },
    buildOverallStatusZh () {
      return this.$translate.translateTaskStatus(this.buildOverallStatus)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    }
  },
  methods: {
    leaveLog () {
      const el = document.querySelector('.job-test-detail').style
      el.overflow = 'auto'
    },
    openBuildLog (buildType) {
      this.buildv4AnyLog = []
      const url = `/api/aslan/logs/sse/v4/workflow/${this.workflowName}/${this.taskId}/${this.jobInfo.name}/999999?projectName=${this.projectName}`
      if (typeof window.msgServer === 'undefined') {
        window.msgServer = {}
        window.msgServer[
          `${this.jobInfo.spec.service_module}_${this.jobInfo.spec.service_name}`
        ] = {}
      }
      this[`${buildType}IntervalHandle`] = setInterval(() => {
        if (this.hasNewMsg) {
          this.buildv4AnyLog = this.buildv4AnyLog.concat(this.wsBuildDataBuffer)
          this.wsBuildDataBuffer = []
        }
        this.hasNewMsg = false
      }, 500)
      this.$sse(url, { format: 'plain' })
        .then(sse => {
          // Store SSE object at a higher scope
          window.msgServer[
            `${this.jobInfo.spec.service_module}_${this.jobInfo.spec.service_name}`
          ] = sse
          sse.onError(e => {
            console.error('lost connection; giving up!', e)
            sse.close()
            this.killLog('customWorkflow')
          })
          // Listen for messages without a specified event
          sse.subscribe('', data => {
            this.hasNewMsg = true
            this.wsBuildDataBuffer = this.wsBuildDataBuffer.concat(
              Object.freeze(data + '\n')
            )
          })
        })
        .catch(err => {
          console.error('Failed to connect to server', err)
          this.killLog('customWorkflow')
        })
    },
    getHistoryBuildLog () {
      return getHistoryLogsAPI(
        this.workflowName,
        this.taskId,
        this.jobInfo.name,
        this.projectName
      ).then(response => {
        this.buildv4AnyLog = response.split('\n').map(element => {
          return element + '\n'
        })
      })
    },
    getLog () {
      if (this.buildIsRunning) {
        this.openBuildLog('customWorkflow')
      } else {
        this.getHistoryBuildLog()
      }
    },
    adaptTaskDetail (detail) {
      detail.intervalSec =
        (detail.status === 'running'
          ? Math.round(new Date().getTime() / 1000)
          : detail.end_time) - detail.start_time
      detail.interval = this.$utils.timeFormat(detail.intervalSec)
    },
    closeConsole () {
      this.isShowConsoleFooter = false
    },
    getTestReport (type) {
      const tail = `?is_workflow=1&service_name=&test_type=function`
      if (type === 'html') {
        window.open(
          `/api/aslan/testing/report/workflowv4/${this.workflowName}/id/${this.taskId}/job/${this.jobInfo.name}`
        )

        // return `/api/aslan/testing/report/workflowv4/${this.workflowName}/id/${this.taskId}/job/${this.jobInfo.name}`
      } else {
        return `/v1/projects/detail/${this.projectName}/pipelines/multi/testcase/${this.workflowName}/${this.taskId}/test/${this.jobInfo.name}${tail}`
      }
    }
  },
  watch: {
    jobInfo: {
      handler (val, oldVal) {
        if (val) {
          if (oldVal && val.name !== oldVal.name) {
            this.firstLoad = false
          }
          if (val.status && !this.firstLoad) {
            this.getLog()
            this.firstLoad = true
          }
          this.adaptTaskDetail(val)
        }
        const currentSSE = `${val.spec.service_module}_${val.spec.service_name}`
        if (this.window.msgServer) {
          for (const SSE in this.window.msgServer) {
            if (
              Object.hasOwnProperty.call(this.window.msgServer, SSE) &&
              SSE !== currentSSE
            ) {
              this.window.msgServer[SSE].close()
              delete this.window.msgServer[SSE]
            }
          }
        }
      },
      deep: true,
      immediate: true
    }
  },
  beforeDestroy () {
    this.killLog('customWorkflow')
  }
}
</script>
<style lang="less" scoped>
.job-test-detail {
  position: relative;
  height: 100%;
  font-size: 14px;
  background: #fff;
  box-shadow: 1px 1px 14px rgba(0, 0, 0, 0.1);

  header {
    height: 42px;
    padding: 0 24px;
    line-height: 42px;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;

    .type {
      margin-right: 8px;
      font-weight: 500;
    }

    .close {
      float: right;
      font-size: 16px;
      cursor: pointer;
    }
  }

  main {
    box-sizing: border-box;
    width: 100%;
    min-height: 400px;
    max-height: 60%;
    padding: 0 24px;
    overflow-y: scroll;

    .item {
      margin-top: 8px;

      &-title {
        color: #4a4a4a;
      }

      &-desc {
        color: #8d9199;
      }
    }

    .el-col {
      border: 1px solid transparent;
    }
  }
}
</style>
