<template>
  <div class="build-console">
    <header class="mg-b8">
      <el-col :span="6">
        <span class="type">{{$t(`workflow.jobType.customDeploy`)}}</span>
        <span>
          <el-tooltip effect="dark" placement="top" :content="jobInfo.name">
            <span>{{$utils.tailCut(jobInfo.name, 20)}}</span>
          </el-tooltip>
        </span>
      </el-col>
      <el-col :span="2">
        <div class="item-desc">
          <a :class="buildOverallColor" href="#buildv4-log">{{jobInfo.status?$t(`workflowTaskStatus.${jobInfo.status}`):$t(`workflowTaskStatus.notRunning`)}}</a>
        </div>
      </el-col>
      <el-col :span="2">
        <span class="item-desc">{{$utils.timeFormat(jobInfo.end_time - jobInfo.start_time)}}</span>
      </el-col>
      <el-col v-if="jobInfo" :span="6">
        <span class="item-desc status">
          <span v-if="jobInfo.spec.skip_check_run_status">
            <i class="el-icon-warning"></i>{{$t(`workflow.notOpenServiceStatusCheck`)}}
          </span>
          <span v-else-if="!jobInfo.spec.skip_check_run_status && jobInfo.status ==='passed'">
            <i class="el-icon-warning"></i>{{$t(`workflow.serviceStatusCheckPassed`)}}
          </span>
          <span v-else-if="!jobInfo.spec.skip_check_run_status && jobInfo.status ==='failed'">
            <i class="el-icon-warning"></i>{{$t(`workflow.serviceStatusCheckFailed`)}}
          </span>
        </span>
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
      <el-row class="item" :gutter="0">
        <el-col :span="4">
          <div class="item-title">{{$t(`workflow.containerName`)}}</div>
        </el-col>
        <el-col :span="8">
          <span class="item-desc">{{jobInfo.spec.target}}</span>
        </el-col>
        <el-col :span="4">
          <div class="item-title">
            {{$t(`workflow.imageName`)}}
            <el-tooltip effect="dark" placement="top">
              <div slot="content">
                构建镜像标签生成规则 ：
                <br />选择 Tag 进行构建 ： 构建时间戳 -
                Tag
                <br />只选择分支进行构建：构建时间戳
                - 任务 ID - 分支名称
                <br />选择分支和 PR 进行构建：构建时间戳 - 任务 ID - 分支名称 - PR ID
                <br />只选择 PR
                进行构建：构建时间戳 - 任务 ID - PR ID
              </div>
              <span>
                <i class="el-icon-question"></i>
              </span>
            </el-tooltip>
          </div>
        </el-col>
        <el-col :span="8">
          <el-tooltip effect="dark" :content="jobInfo.spec.image" placement="top">
            <span class="file-name item-desc">{{ jobInfo.spec.image.split('/')[2] }}</span>
          </el-tooltip>
        </el-col>
      </el-row>
      <el-row class="item">
        <el-col :span="4">
          <div class="item-title">{{$t(`workflow.cluster`)}}</div>
        </el-col>
        <el-col :span="8">
          <div class="item-desc">{{jobInfo.spec.cluster_name}}</div>
        </el-col>
        <el-col :span="4">
          <div class="item-title">{{$t(`workflow.namespace`)}}</div>
        </el-col>
        <el-col :span="8">
          <div class="item-desc">{{jobInfo.spec.namespace.toString()}}</div>
        </el-col>
      </el-row>
    </main>
  </div>
</template>

<script>
export default {
  data () {
    return {}
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

  computed: {
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.jobInfo, {})
    },
    buildOverallStatusZh () {
      return this.$t(`workflowTaskStatus.${this.buildOverallStatus}`)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    }
  }
}
</script>
<style lang="less" scoped>
@themeColor: #0066ff;

.build-console {
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
