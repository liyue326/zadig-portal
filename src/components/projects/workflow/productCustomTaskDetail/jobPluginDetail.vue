<template>
  <div class="job-plugin-detail">
    <header class="mg-b8">
      <el-col :span="6">
        <span class="type">{{pluginInfo.spec.name}}</span>
        <span>{{pluginInfo.name}}</span>
      </el-col>
      <el-col :span="2">
        <div class="item-desc">
          <a :class="buildOverallColor" href="#buildv4-log">{{pluginInfo.status?$t(`workflowTaskStatus.${pluginInfo.status}`):$t(`workflowTaskStatus.notRunning`)}}</a>
        </div>
      </el-col>
      <el-col :span="2">
        <span class="item-desc">{{pluginInfo.interval}}</span>
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
          <el-alert v-if="pluginInfo.error" :title="$t(`global.errorMsg`)" :description="pluginInfo.error" type="error" :close-text="$t(`global.ok`)"></el-alert>
        </div>
        <el-row class="item" :gutter="0" v-for="(build,index) in pluginInfo.spec.repos" :key="index">
          <el-col :span="4">
            <div class="item-title">{{$t(`global.repository`)}}({{build.source}})</div>
          </el-col>
          <el-col :span="8">
            <div class="item-desc">{{build.repo_name}}</div>
          </el-col>
          <el-col :span="4">
            <div class="item-title">{{$t(`global.gitMessage`)}}</div>
          </el-col>
          <el-col :span="8">
            <RepoJump :build="build" />
          </el-col>
        </el-row>
      </section>
      <section class="log-content mg-t8">
        <XtermLog :id="pluginInfo.name" @mouseleave.native="leaveLog" :logs="buildv4AnyLog" :from="pluginInfo.name" />
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
    pluginInfo: {
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
    buildIsRunning () {
      return this.pluginInfo && this.pluginInfo.status === 'running'
    },
    buildIsDone () {
      return this.isSubTaskDone(this.pluginInfo)
    },
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.pluginInfo, {})
    },
    buildOverallStatusZh () {
      return this.$t(`workflowTaskStatus.${this.buildOverallStatus}`)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    }
  },
  methods: {
    leaveLog () {
      const el = document.querySelector('.job-plugin-detail').style
      el.overflow = 'auto'
    },
    openBuildLog (buildType) {
      this.buildv4AnyLog = []
      const url = `/api/aslan/logs/sse/v4/workflow/${this.workflowName}/${this.taskId}/${this.pluginInfo.name}/999999?projectName=${this.projectName}`
      if (typeof window.msgServer === 'undefined') {
        window.msgServer = {}
        window.msgServer[
          `${this.pluginInfo.spec.service_module}_${this.pluginInfo.spec.service_name}`
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
            `${this.pluginInfo.spec.service_module}_${this.pluginInfo.spec.service_name}`
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
        this.pluginInfo.name,
        this.projectName
      ).then(response => {
        if (!response.toString().includes('\n')) {
          this.buildv4AnyLog = [response]
        } else {
          this.buildv4AnyLog = response.split('\n').map(element => {
            return element + '\n'
          })
        }
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
    }
  },
  watch: {
    pluginInfo: {
      handler (val, oldVal) {
        if (val) {
          if (oldVal && val.spec.name !== oldVal.spec.name) {
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
.job-plugin-detail {
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
        color: #8d9199;
      }

      &-desc {
        color: #4a4a4a;
      }
    }
  }
}
</style>
