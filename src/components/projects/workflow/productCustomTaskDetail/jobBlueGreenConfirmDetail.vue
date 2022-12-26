<template>
  <div class="job-bg-confirm">
    <header class="mg-b8">
      <el-col :span="6">
        <span class="type">{{$t(`workflow.jobType.blueGreenConfirm`)}}</span>
        <span>{{jobInfo.name}}</span>
      </el-col>
      <el-col v-if="jobInfo.status!=='running'" :span="2">
        <div class="item-desc">
          <a :class="buildOverallColor" href="#buildv4-log">{{jobInfo.status?$t(`workflowTaskStatus.${jobInfo.status}`):$t(`workflowTaskStatus.notRunning`)}}</a>
        </div>
      </el-col>
      <el-col v-if="jobInfo.status!=='running'" :span="2">
        <span class="item-desc">{{$utils.timeFormat(jobInfo.end_time - jobInfo.start_time)}}</span>
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
      <el-row class="item" :gutter="0" >
        <el-col :span="4">
          <div class="item-title">{{$t(`workflow.k8sServiceName`)}}</div>
        </el-col>
        <el-col :span="8">
          <span class="item-desc">{{jobInfo.spec.k8s_service_name}}</span>
        </el-col>
        <el-col :span="4">
          <div class="item-title">{{$t(`workflow.containerName`)}}</div>
        </el-col>
        <el-col :span="8">
          <span class="item-desc">{{jobInfo.spec.container_name}}</span>
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
      <el-row class="item">
        <el-col :span="4">
          <div class="item-title">
            {{$t(`workflow.imageName`)}}
          </div>
        </el-col>
        <el-col :span="8">
          <el-tooltip v-if="jobInfo.spec.image" effect="dark" :content="jobInfo.spec.image" placement="top">
            <span class="file-name item-desc">{{jobInfo.spec.image.split('/')[2] }}</span>
          </el-tooltip>
        </el-col>
      </el-row>
      <el-table :data="jobInfo.spec.events" size="small" class="mg-t24">
        <el-table-column :label="$t(`workflow.time`)" prop="time"></el-table-column>
        <el-table-column :label="$t(`global.type`)" prop="event_type"></el-table-column>
        <el-table-column :label="$t(`workflow.message`)" prop="message"></el-table-column>
      </el-table>
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

.job-bg-confirm {
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
