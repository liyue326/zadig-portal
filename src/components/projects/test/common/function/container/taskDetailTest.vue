<template>
  <div class="task-detail-test">
    <el-card
      v-if="!$utils.isEmpty(testingv2) && testingv2.enabled"
      class="box-card task-process"
      :body-style="{ padding: '0px', margin: '15px 0 0 0' }"
    >
      <div class="error-wrapper">
        <el-alert v-if="testingv2.error" :title="$t(`testing.taskDetails.taskInfo.errorMessage`)" :description="testingv2.error" type="error" :close-text="$t(`testing.taskDetails.taskInfo.acknowledged`)"></el-alert>
      </div>
      <div slot="header" class="clearfix subtask-header">
        <span>{{$t(`testing.title`)}}</span>
        <div v-if="testingv2.status==='running'" class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div class="text item">
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconzhuangtai"></i> {{$t(`testing.taskDetails.taskInfo.status`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">
              <a
                href="#testv2-log"
                :class="$translate.calcTaskStatusColor(testingv2.status,'pipeline','task')"
              >{{testingv2.status?$t(`workflowTaskStatus.${testingv2.status}`):$t(`workflowTaskStatus.notRunning`)}}</a>
            </div>
          </el-col>
          <el-col v-if="testingv2.status!=='running' && testingv2.status!=='prepare'" :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconshijian"></i> {{$t(`testing.taskDetails.basicInformation.duration`)}}
            </div>
          </el-col>
          <el-col v-if="testingv2.status!=='running' && testingv2.status!=='prepare'" :span="6">
            <span class="item-desc">
              {{$utils.timeFormat(testingv2.end_time -
              testingv2.start_time)}}
            </span>
          </el-col>
        </el-row>
        <el-row :gutter="0" v-for="(build,index) in testingv2.job_ctx.builds" :key="index">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont icondaima"></i>
              {{$t(`global.repository`)}}({{build.source}})
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">{{build.repo_name}}</div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconinfo"></i> {{$t(`global.gitMessage`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <RepoJump :build="build" />
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card
      id="testv2-log"
      v-if="!$utils.isEmpty(testingv2)&&testingv2.enabled"
      class="box-card task-process"
      :body-style="{ padding: '0px', margin: '15px 0 0 0' }"
    >
      <div class="log-container">
        <div class="log-content">
          <XtermLog :id="`${pipelineName}-${taskID}-${serviceName}`" @mouseleave.native="leaveLog" :logs="testAnyLog" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import mixin from '@/mixin/killSSELogMixin'
import RepoJump from '@/components/projects/workflow/common/repoJump.vue'
import { getWorkflowHistoryTestLogAPI } from '@api'

export default {
  data () {
    return {
      testAnyLog: [],
      wsTestDataBuffer: [],
      testLogStarted: true
    }
  },
  computed: {
    testIsRunning () {
      return this.testingv2 && this.testingv2.status === 'running'
    },
    testIsDone () {
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
    testIsRunning (val, oldVal) {
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
        const url = `/api/aslan/logs/sse/workflow/test/${this.pipelineName}/${this.taskID}/${this.testName}/999999/${this.serviceName}?workflowType=test&projectName=${this.projectName}`
        this.$sse(url, { format: 'plain' })
          .then(sse => {
            // Store SSE object at a higher scope
            window.msgServer[this.serviceName] = sse
            sse.onError(e => {
              console.error('lost connection; giving up!', e)
              this.$message({
                message: this.$t(`testing.taskDetails.logs.fetchErrorMessage`),
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
    if (this.testIsRunning) {
      this.openTestLog()
    }
    if (this.testIsDone) {
      getWorkflowHistoryTestLogAPI(
        this.projectName,
        this.pipelineName,
        this.taskID,
        this.testName,
        this.serviceName,
        'test'
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
    }
  },
  mixins: [mixin],
  components: {
    RepoJump
  }
}
</script>

<style lang="less">
@import '~@assets/css/component/subtask.less';

.task-detail-test {
  .viewlog {
    font-size: 14px;
  }
}
</style>
