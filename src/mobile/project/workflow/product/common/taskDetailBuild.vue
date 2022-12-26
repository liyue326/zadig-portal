<template>
  <div class="mobile-task-detail-build">
    <div v-if="!$utils.isEmpty(buildv2) && buildv2.enabled">
      <div class="error-wrapper">
        <van-notice-bar v-if="buildv2.error" color="#F56C6C" background="#fef0f0">{{buildv2.error}}</van-notice-bar>
      </div>
      <div class="text">
        <van-row :gutter="0">
          <van-col :span="6">
            <div class="item-title">{{$t(`status.buildStatus`)}}</div>
          </van-col>
          <van-col :span="6">
            <div class>
              <span :class="buildOverallColor">{{buildv2.status?$t(`workflowTaskStatus.${buildv2.status}`):$t(`workflowTaskStatus.notRunning`)}}</span>
            </div>
          </van-col>
          <van-col v-if="buildv2.status!=='running'" :span="6">
            <div class="item-title">{{$t(`workflow.duration`)}}</div>
          </van-col>
          <van-col v-if="buildv2.status!=='running'" :span="6">
            <span class>{{$utils.timeFormat(buildv2.end_time - buildv2.start_time)}}</span>
          </van-col>
        </van-row>
        <van-row v-if="buildv2.job_ctx.builds">
          <div>
            <span>{{$t(`global.gitMessage`)}}</span>
          </div>
        </van-row>
        <van-row :gutter="0" v-for="(build,index) in buildv2.job_ctx.builds" :key="index">
          <van-col :span="24">
            <span>{{build.repo_name}} ({{build.source}})</span>
            <RepoJump :build="build" :showCommit="false" />
          </van-col>
        </van-row>
        <template v-if="serviceType!=='pm'">
          <van-row>
            <div>
              <span>{{$t(`status.imgInfo`)}}</span>
            </div>
          </van-row>
          <van-row :gutter="0">
            <van-col :span="24">
              <el-tooltip effect="dark" :content="buildv2.job_ctx.image" placement="top">
                <span class>{{buildv2.job_ctx.image.split('/').pop()}}</span>
              </el-tooltip>
            </van-col>
          </van-row>
        </template>
        <template v-if="serviceType==='pm'">
          <van-row>
            <div>
              <span>打包信息</span>
            </div>
          </van-row>
          <van-row :gutter="0">
            <van-col :span="24">
              <span class>{{buildv2.job_ctx.package_file}}</span>
            </van-col>
          </van-row>
        </template>
        <template v-if="!$utils.isEmpty(buildv2) && buildv2.job_ctx.upload_pkg">
          <van-row>
            <div>
              <span>打包信息</span>
            </div>
          </van-row>
          <van-row :gutter="0">
            <van-col :span="24">
              <span class>{{buildv2.job_ctx.package_file}}</span>
            </van-col>
          </van-row>
        </template>
      </div>
    </div>

    <div id="buildv2-log" v-if="!$utils.isEmpty(buildv2)&&buildv2.enabled" class="mobile-log-container">
      <XtermLog :id="buildv2.job_ctx.image" :fontSize="'10'" :logs="buildv2AnyLog" />
    </div>
  </div>
</template>

<script>
import mixin from '@/mixin/killSSELogMixin'
import { NoticeBar, Col, Row, Divider, Notify } from 'vant'
import { getWorkflowHistoryBuildLogAPI } from '@api'
import RepoJump from '@/components/projects/workflow/common/repoJump.vue'
export default {
  components: {
    [NoticeBar.name]: NoticeBar,
    [Col.name]: Col,
    [Row.name]: Row,
    [Divider.name]: Divider,
    [Notify.name]: Notify,
    RepoJump
  },
  data () {
    return {
      buildv2AnyLog: [],
      wsBuildDataBuffer: [],
      buildLogStarted: true
    }
  },

  computed: {
    buildIsRunning () {
      return this.buildv2 && this.buildv2.status === 'running'
    },
    buildIsDone () {
      return this.isSubTaskDone(this.buildv2)
    },
    docker_buildIsRunning () {
      return this.docker_build && this.docker_build.status === 'running'
    },
    no_docker_build () {
      return !this.docker_build
    },

    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.buildv2, this.docker_build)
    },
    buildOverallStatusZh () {
      return this.$t(`workflowTaskStatus.${this.buildOverallStatus}`)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    },
    serviceType () {
      return this.buildv2.service_type
    },
    envName () {
      return this.buildv2.env_name
    }
  },
  watch: {
    buildIsRunning (val, oldVal) {
      if (!oldVal && val && this.buildLogStarted) {
        this.openBuildLog('buildv2')
      }
      if (oldVal && !val) {
        this.killLog('buildv2')
      }
    },
    docker_buildIsRunning (val, oldVal) {
      if (!oldVal && val && this.buildLogStarted) {
        this.openBuildLog('docker_build')
      }
      if (oldVal && !val) {
        this.killLog('docker_build')
      }
    }
  },
  methods: {
    getBuildv2Log () {
      this.buildLogStarted = true
    },
    openBuildLog (buildType) {
      let url = `/api/aslan/logs/sse/workflow/build/${this.pipelineName}/${this.taskID}/999999/${this.serviceName}?subTask=${buildType}&projectName=${this.projectName}`
      if (this.serviceType === 'pm') {
        url = `/api/aslan/logs/sse/workflow/build/${this.pipelineName}/${this.taskID}/999999/${this.serviceName}?subTask=buildv2&envName=${this.envName}&projectName=${this.projectName}`
      }
      if (typeof window.msgServer === 'undefined') {
        window.msgServer = {}
        window.msgServer[this.serviceName] = {}
      }
      this[`${buildType}IntervalHandle`] = setInterval(() => {
        if (this.hasNewMsg) {
          this.buildv2AnyLog = this.buildv2AnyLog.concat(this.wsBuildDataBuffer)
          this.wsBuildDataBuffer = []
        }
        this.hasNewMsg = false
      }, 500)
      this.$sse(url, { format: 'plain' })
        .then(sse => {
          // Store SSE object at a higher scope
          window.msgServer[this.serviceName] = sse
          sse.onError(e => {
            console.error('lost connection; giving up!', e)
            Notify({ type: 'danger', message: `${buildType}日志获取失败` })
            sse.close()
            this.killLog(buildType)
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
          Notify({ type: 'danger', message: `${buildType}日志获取失败` })
          this.killLog(buildType)
        })
    },
    getHistoryBuildLog () {
      let type = 'buildv2'
      if (this.buildv2.type === 'jenkins_build') {
        type = 'jenkins_build'
      }
      return getWorkflowHistoryBuildLogAPI(
        this.projectName,
        this.pipelineName,
        this.taskID,
        this.serviceName,
        type
      ).then(response => {
        this.buildv2AnyLog = response.split('\n').map(element => {
          return element + '\n'
        })
      })
    }
  },
  beforeDestroy () {
    this.killLog('buildv2')
    this.killLog('docker_build')
  },
  mounted () {
    if (this.buildIsRunning) {
      this.openBuildLog('buildv2')
    } else {
      if (this.buildIsDone) {
        if (this.docker_buildIsRunning) {
          this.getHistoryBuildLog().then(() => {
            this.openBuildLog('docker_build')
          })
        } else {
          this.getHistoryBuildLog()
        }
      }
    }
  },
  props: {
    buildv2: {
      type: Object,
      required: true
    },
    docker_build: {
      type: null,
      required: true
    },
    isWorkflow: {
      type: Boolean,
      required: true
    },
    serviceName: {
      type: String,
      default: ''
    },
    pipelineName: {
      type: String,
      required: true
    },
    projectName: {
      type: String,
      default: ''
    },
    taskID: {
      type: [String, Number],
      required: true
    }
  },
  mixins: [mixin]
}
</script>

<style lang="less">
.mobile-task-detail-build {
  color: #303133;

  a {
    color: @themeColor;
  }

  .mobile-log-container {
    margin: 15px 0;

    .xterm {
      padding: 15px 10px;

      .xterm-viewport {
        border-radius: 5px;
      }
    }
  }

  .error-wrapper {
    margin-bottom: 10px;
  }
}
</style>
