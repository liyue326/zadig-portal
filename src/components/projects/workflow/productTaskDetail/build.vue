<template>
  <div class="task-detail-build">
    <el-card v-if="!$utils.isEmpty(buildv2) && buildv2.enabled"
             class="box-card task-process"
             :body-style="{padding: '8px 20px', margin: '5px 0 0 0' }">
      <div slot="header"
           class="clearfix subtask-header">
        <span>构建</span>
        <div v-if="buildv2.status==='running'"
             class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div class="error-wrapper">
        <el-alert v-if="buildv2.error"
                  title="错误信息"
                  :description="buildv2.error"
                  type="error"
                  close-text="知道了">
        </el-alert>
      </div>
      <div class="text item">
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconzhuangtai"></i> 构建状态
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">
              <a :class="buildOverallColor"
                 href="#buildv2-log">{{buildv2.status?buildOverallStatusZh:"未运行"}}</a>
            </div>
          </el-col>
          <el-col v-if="buildv2.status!=='running'"
                  :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconshijian"></i> 持续时间
            </div>
          </el-col>
          <el-col v-if="buildv2.status!=='running'"
                  :span="6">
            <span
                  class="item-desc">{{$utils.timeFormat(buildv2.end_time - buildv2.start_time)}}</span>
          </el-col>
        </el-row>
        <template v-if="buildv2.job_ctx">
          <el-row :gutter="0"
                  v-for="(build,index) in buildv2.job_ctx.builds"
                  :key="index">
            <el-col :span="6">
              <div class="grid-content item-title">
                <i class="iconfont icondaima"></i> 代码库({{build.source}})
              </div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-desc">{{build.repo_name}}
              </div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-title">
                <i class="iconfont iconinfo"></i> 代码信息
              </div>
            </el-col>
            <el-col :span="6">
              <RepoJump :build="build" showIcon />
            </el-col>
          </el-row>
        </template>
        <el-row v-if="!$utils.isEmpty(buildv2)"
                :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconvery-service"></i> 服务名称
            </div>
          </el-col>
          <el-col :span="6">
            <span class="item-desc">{{$utils.showServiceName(buildv2.service_name,buildv2.service)}}</span>
          </el-col>
          <el-col v-if="serviceType!=='pm'"
                  :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconSliceCopy"></i> 镜像信息
                <el-tooltip effect="dark"
                            placement="top">
                  <div slot="content">构建镜像标签生成规则 ：<br />选择 Tag 进行构建 ： 构建时间戳 -
                    Tag<br />只选择分支进行构建：构建时间戳
                    - 任务 ID - 分支名称<br />选择分支和 PR 进行构建：构建时间戳 - 任务 ID - 分支名称 - PR ID<br />只选择 PR
                    进行构建：构建时间戳 - 任务 ID - PR ID</div>
                  <span><i class="el-icon-question"></i></span>
                </el-tooltip>
            </div>
          </el-col>
          <el-col v-if="serviceType!=='pm' && buildv2.job_ctx"
                  :span="6">
            <el-tooltip effect="dark"
                        :content="buildv2.job_ctx.image"
                        placement="top">
              <span class="item-desc">{{buildv2.job_ctx.image.split('/').pop()}}</span>
            </el-tooltip>
          </el-col>
          <el-col v-if="buildv2.type=='jenkins_build' && buildv2.image"
                  :span="6">
            <el-tooltip effect="dark"
                        :content="buildv2.image"
                        placement="top">
              <span class="item-desc">{{buildv2.image.split('/').pop()}}</span>
            </el-tooltip>
          </el-col>
          <el-col v-if="serviceType==='pm'"
                  :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconvery-delitracking"></i> 打包信息
            </div>
          </el-col>
          <el-col v-if="serviceType==='pm' && buildv2.job_ctx"
                  :span="6">
            <span class="item-desc">{{buildv2.job_ctx.package_file}}</span>
          </el-col>
        </el-row>
        <el-row v-if="!$utils.isEmpty(buildv2) && buildv2.job_ctx && buildv2.job_ctx.upload_pkg"
                :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconvery-delitracking"></i> 打包信息
            </div>
          </el-col>
          <el-col :span="6">
            <span class="item-desc">{{buildv2.job_ctx.package_file}}</span>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card id="buildv2-log"
             v-if="!$utils.isEmpty(buildv2)&&buildv2.enabled"
             class="box-card task-process"
             :body-style="{padding:'8px 20px',margin: '5px 0 0 0' }">
      <div class="log-container">
        <div class="log-content">
          <XtermLog :id="buildv2.service_name"
                     @mouseleave.native="leaveLog"
                     :logs="buildv2AnyLog"/>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import RepoJump from '@/components/projects/workflow/common/repoJump.vue'
import mixin from '@/mixin/killSSELogMixin'
import { getWorkflowHistoryBuildLogAPI } from '@api'

export default {
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
    dockerBuildIsRunning () {
      return this.docker_build && this.docker_build.status === 'running'
    },
    no_docker_build () {
      return !this.docker_build
    },

    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.buildv2, this.docker_build)
    },
    buildOverallStatusZh () {
      return this.$translate.translateTaskStatus(this.buildOverallStatus)
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
    dockerBuildIsRunning (val, oldVal) {
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
    leaveLog () {
      const el = document.querySelector('.workflow-task-detail').style
      el.overflow = 'auto'
    },
    openBuildLog (buildType) {
      const serviceModule = this.serviceName.split('_' + this.originServiceName)[0]
      let url = `/api/aslan/logs/sse/workflow/build/${this.pipelineName}/${this.taskID}/999999/${this.serviceName}?subTask=${buildType}&projectName=${this.projectName}&serviceModule=${serviceModule}`
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
            sse.close()
            this.killLog(buildType)
          })
          // Listen for messages without a specified event
          sse.subscribe('', data => {
            this.hasNewMsg = true
            this.wsBuildDataBuffer = this.wsBuildDataBuffer.concat(Object.freeze(data + '\n'))
          })
        })
        .catch(err => {
          console.error('Failed to connect to server', err)
          this.killLog(buildType)
        })
    },
    getHistoryBuildLog () {
      let type = 'buildv2'
      if (this.buildv2.type === 'jenkins_build') {
        type = 'jenkins_build'
      }
      return getWorkflowHistoryBuildLogAPI(this.projectName, this.pipelineName, this.taskID, this.serviceName, type).then(
        response => {
          this.buildv2AnyLog = (response.split('\n')).map(element => {
            return element + '\n'
          })
        }
      )
    }
  },
  beforeDestroy () {
    this.killLog('buildv2')
    this.killLog('docker_build')
  },
  mounted () {
    if (this.buildIsRunning) {
      if (this.buildv2.type === 'jenkins_build') {
        this.openBuildLog('jenkins_build')
      } else {
        this.openBuildLog('buildv2')
      }
    } else {
      if (this.buildIsDone) {
        if (this.dockerBuildIsRunning) {
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
    originServiceName: {
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
  mixins: [mixin],
  components: {
    RepoJump
  }
}
</script>

<style lang="less">
@import "~@assets/css/component/subtask.less";

.task-detail-build {
  .viewlog {
    font-size: 14px;
  }
}
</style>
