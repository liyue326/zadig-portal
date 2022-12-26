<template>
  <div class="job-distribute-detail">
    <header class="mg-b8">
      <el-col :span="6">
        <span class="type">镜像分发</span>
        <span>{{jobInfo.name}}</span>
      </el-col>
      <el-col :span="2">
        <div class="item-desc">
          <a :class="buildOverallColor" href="#buildv4-log">{{jobInfo.status?$t(`workflowTaskStatus.${jobInfo.status}`):$t(`workflowTaskStatus.notRunning`)}}</a>
        </div>
      </el-col>
      <el-col :span="2">
        <span class="item-desc">{{jobInfo.interval}}</span>
      </el-col>
      <el-col :span="1" class="close">
        <span @click="$emit('showFooter',false)">
          <i class="el-icon-close"></i>
        </span>
      </el-col>
    </header>
    <main>
      <div class="error-wrapper">
        <el-alert v-if="jobInfo.error" :title="$t(`global.errorMsg`)" :description="jobInfo.error" type="error" :close-text="$t(`global.ok`)"></el-alert>
      </div>
      <section>
        <el-row class="item" :gutter="0" v-for="(build,index) in jobInfo.spec.distribute_target" :key="index">
          <el-col :span="4">
            <div class="item-title">{{$t(`global.serviceName`)}}</div>
          </el-col>
          <el-col :span="8">
            <span class="item-desc">{{build.service_name}}({{build.service_module}})</span>
          </el-col>
          <el-col :span="4">
            <div class="item-title">{{$t(`status.imgInfo`)}}</div>
          </el-col>
          <el-col :span="6">
            <el-tooltip effect="dark" :content="build.target_image" placement="top">
              <span class="file-name item-desc">{{ build.target_image.split('/')[2]}}</span>
            </el-tooltip>
          </el-col>
        </el-row>
      </section>
      <section class="log-content mg-t8">
        <XtermLog :id="jobInfo.name" @mouseleave.native="leaveLog" :logs="buildv4AnyLog" :from="jobInfo.name" />
      </section>
    </main>
  </div>
</template>

<script>
import RepoJump from '@/components/projects/workflow/common/repoJump.vue'
import mixin from '@/mixin/killSSELogMixin'
import { getJobHistoryLogsAPI } from '@api'
export default {
  data () {
    return {
      buildv4AnyLog: [],
      wsBuildDataBuffer: [],
      buildLogStarted: true,
      window: window,
      firstLoad: false
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
    }
  },
  mixins: [mixin],
  components: {
    RepoJump
  },
  computed: {
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.jobInfo, {})
    },
    buildOverallStatusZh () {
      return this.$t(`workflowTaskStatus.${this.buildOverallStatus}`)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    },
    buildIsRunning () {
      return this.jobInfo && this.jobInfo.status === 'running'
    }
  },
  methods: {
    leaveLog () {
      const el = document.querySelector('.job-distribute-detail').style
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
      return getJobHistoryLogsAPI(
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
    }
  },
  watch: {
    jobInfo: {
      handler (val, oldVal) {
        if (val) {
          if (oldVal && val.name !== oldVal.name) {
            this.firstLoad = false
          }
          if (
            (val.status === 'running' && !this.firstLoad) ||
            (val.status === 'passed' && !this.firstLoad) ||
            (val.status === 'failed' && !this.firstLoad)
          ) {
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
.job-distribute-detail {
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

    .status {
      color: #888;
    }
  }

  main {
    padding: 0 24px;

    .item {
      margin-top: 8px;

      &-title {
        color: #8d9199;
      }

      &-desc {
        color: #4a4a4a;
      }
    }

    .env-link {
      color: @themeColor;
    }
  }
}
</style>
