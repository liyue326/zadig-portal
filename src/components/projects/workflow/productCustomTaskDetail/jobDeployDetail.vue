<template>
  <div class="job-deploy-detail">
    <header class="mg-b8">
      <el-col :span="6">
        <span class="type">部署</span>
        <span>{{jobInfo.name}}</span>
      </el-col>
      <el-col :span="2">
        <div class="item-desc">
          <a :class="buildOverallColor" href="#buildv4-log">{{jobInfo.status?buildOverallStatusZh:"未运行"}}</a>
        </div>
      </el-col>
      <el-col :span="2">
        <span class="item-desc">{{$utils.timeFormat(jobInfo.end_time - jobInfo.start_time)}}</span>
      </el-col>
      <el-col v-if="jobInfo" :span="6">
        <span class="item-desc status">
          <span v-if="jobInfo.spec.skip_check_run_status">
            <i class="el-icon-warning"></i>未开启服务状态检测
          </span>
          <span v-else-if="!jobInfo.spec.skip_check_run_status && jobInfo.status ==='passed'">
            <i class="el-icon-warning"></i>服务状态检测通过
          </span>
          <span v-else-if="!jobInfo.spec.skip_check_run_status && jobInfo.status ==='failed'">
            <i class="el-icon-warning"></i>服务状态检测未通过
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
        <el-alert v-if="jobInfo.error" title="错误信息" :description="jobInfo.error" type="error" close-text="知道了"></el-alert>
      </div>
      <el-row class="item" :gutter="0" v-for="(build,index) in jobInfo.spec.service_and_images" :key="index">
        <el-col :span="4">
          <div class="item-title">服务名称</div>
        </el-col>
        <el-col :span="8">
          <span class="item-desc">{{build.service_name}}({{build.service_module}})</span>
        </el-col>
        <el-col :span="4">
          <div class="item-title">
            镜像名称
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
          <el-tooltip effect="dark" :content="build.image" placement="top">
            <span class="file-name item-desc">{{ build.image.split('/')[2]}}</span>
          </el-tooltip>
        </el-col>
      </el-row>
      <el-row class="item">
        <el-col :span="4">
          <div class="item-title">部署环境</div>
        </el-col>
        <el-col :span="8">
          <div class="item-desc">
            <router-link
              class="env-link"
              :to="`/v1/projects/detail/${projectName}/envs/detail?envName=${jobInfo.spec.env}`"
            >{{jobInfo.spec.env}}</router-link>
          </div>
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
      return this.$translate.translateTaskStatus(this.buildOverallStatus)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    }
  }
}
</script>
<style lang="less" scoped>
.job-deploy-detail {
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
        color: #4a4a4a;
      }

      &-desc {
        color: #8d9199;
      }
    }

    .env-link {
      color: @themeColor;
    }
  }
}
</style>
