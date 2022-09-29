<template>
  <div class="mobile-task-detail-test">
    <div
      v-if="!$utils.isEmpty(testingv2) && testingv2.enabled"
      class="box-card task-process"
      :body-style="{ padding: '0px', margin: '15px 0 0 0' }"
    >
      <div class="error-wrapper">
        <van-notice-bar v-if="testingv2.error" color="#F56C6C" background="#fef0f0">{{testingv2.error}}</van-notice-bar>
      </div>
      <div class="text">
        <van-row :gutter="0">
          <van-col :span="6">
            <div class="item-title">任务状态</div>
          </van-col>
          <van-col :span="6">
            <div class>
              <span
                :class="$translate.calcTaskStatusColor(testingv2.status,'pipeline','task')"
              >{{testingv2.status?$translate.translateTaskStatus(testingv2.status):"未运行"}}</span>
            </div>
          </van-col>
          <van-col v-if="testingv2.status!=='running'" :span="6">
            <div class="item-title">持续时间</div>
          </van-col>
          <van-col v-if="testingv2.status!=='running'" :span="6">
            <span class>
              {{$utils.timeFormat(testingv2.end_time -
              testingv2.start_time)}}
            </span>
          </van-col>
        </van-row>
        <van-row v-if="testingv2.job_ctx.builds">
          <div>
            <span>代码信息</span>
          </div>
        </van-row>
        <van-row :gutter="0" v-for="(build,index) in testingv2.job_ctx.builds" :key="index">
          <van-col :span="24">
            <span>{{build.repo_name}} ({{build.source}})</span>
            <RepoJump :build="build" :showCommit="false" showIcon />
          </van-col>
        </van-row>
      </div>
    </div>
    <div id="testv2-log" v-if="!$utils.isEmpty(testingv2)&&testingv2.enabled" class="mobile-log-container">
      <XtermLog :id="`${pipelineName}-${taskID}-${serviceName}`" :fontSize="'10'" :logs="testAnyLog" />
    </div>
  </div>
</template>

<script>
import mixin from '@/mixin/killSSELogMixin'
import { NoticeBar, Col, Row, Divider, Notify } from 'vant'
import { getWorkflowHistoryTestLogAPI } from '@api'
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
      testAnyLog: [],
      wsTestDataBuffer: [],
      testLogStarted: true
    }
  },
  computed: {
    taskIsRunning () {
      return this.testingv2 && this.testingv2.status === 'running'
    },
    taskIsDone () {
      return this.isSubTaskDone(this.testingv2)
    },
    testName () {
      return this.testingv2 && this.testingv2.test_name
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  watch: {
    taskIsRunning (val, oldVal) {
      if (!oldVal && val && this.testLogStarted) {
        this.openTestLog()
      }
      if (oldVal && !val) {
        this.killTestLog()
      }
    }
  },
  methods: {
    leaveLog () {
      const el = document.querySelector('.workflow-task-detail').style
      el.overflow = 'auto'
    },
    openTestLog () {
      if (typeof window.msgServer === 'undefined') {
        window.msgServer = {}
      }
      if (typeof window.msgServer[this.serviceName] === 'undefined') {
        this.testIntervalHandle = setInterval(() => {
          if (this.hasNewTestMsg) {
            this.testAnyLog = this.testAnyLog.concat(this.wsTestDataBuffer)
            this.wsTestDataBuffer = []
          }
          this.hasNewTestMsg = false
        }, 500)
        const url = `/api/aslan/logs/sse/workflow/test/${this.pipelineName}/${this.taskID}/${this.testName}/999999/${this.serviceName}?projectName=${this.projectName}&workflowType=${this.isTestJob ? 'test' : ''}`
        this.$sse(url, { format: 'plain' })
          .then(sse => {
            // Store SSE object at a higher scope
            window.msgServer[this.serviceName] = sse
            sse.onError(e => {
              console.error('lost connection; giving up!', e)
              this.$message({
                message: '测试日志获取失败',
                type: 'error'
              })
              sse.close()
              this.killTestLog()
            })
            // Listen for messages without a specified event
            sse.subscribe('', data => {
              this.hasNewTestMsg = true
              this.wsTestDataBuffer = this.wsTestDataBuffer.concat(
                Object.freeze(data + '\n')
              )
            })
          })
          .catch(err => {
            console.error('Failed to connect to server', err)
            delete window.msgServer
            clearInterval(this.testIntervalHandle)
          })
      }
    },
    killTestLog () {
      this.killLog('test')
    },
    getTestLog () {
      this.testLogStarted = true
    }
  },
  mounted () {
    if (this.taskIsRunning) {
      this.openTestLog()
    }
    if (this.taskIsDone) {
      getWorkflowHistoryTestLogAPI(
        this.projectName,
        this.pipelineName,
        this.taskID,
        this.testName,
        this.serviceName,
        this.isTestJob ? 'test' : ''
      ).then(response => {
        this.testAnyLog = response.split('\n').map(element => {
          return element + '\n'
        })
      })
    }
  },
  beforeDestroy () {
    this.killTestLog()
  },
  props: {
    testingv2: {
      type: Object,
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
    taskID: {
      type: [String, Number],
      required: true
    },
    isTestJob: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  mixins: [mixin]
}
</script>

<style lang="less">
.mobile-task-detail-test {
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
