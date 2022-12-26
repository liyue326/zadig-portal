<template>
  <div class="task-detail-deploy">
    <el-card v-if="deploys.length > 0"
             class="box-card task-process"
             :body-style="{ margin: '15px 0 0 0' }">
      <div slot="header"
           class="clearfix subtask-header">
        <span>{{$t(`status.deploy`)}}</span>
        <div v-if="deploys[0].status==='running'"
             class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div v-for="(deploy,index) in deploys"
           :key="index"
           class="deploy-item">
        <div class="error-wrapper">
          <el-alert v-if="deploy.error"
                    :title="$t(`global.errorMsg`)"
                    :description="deploy.error"
                    type="error"
                    :close-text="$t(`global.ok`)">

          </el-alert>
        </div>
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconzhuangtai"></i> {{$t(`status.deployStatus`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc"
                 :class="$translate.calcTaskStatusColor(deploy.status)">
              {{deploy.status?$t(`workflowTaskStatus.${deploy.status}`):$t(`workflowTaskStatus.notRunning`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconvery-environ"></i> {{$t(`workflow.deploymentEnv`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">
              <router-link class="env-link"
                           :to="`/v1/projects/detail/${deploy.product_name}/envs/detail?envName=${deploy.env_name}`">
                {{deploy.env_name}}</router-link>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconvery-service"></i> {{$t(`global.serviceName`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">
              <span v-if="deploy.service_type==='helm'">
                {{`${$utils.showServiceName(deploy.container_name,deploy.service_name)}`}}
              </span>
              <router-link v-else
                           class="env-link"
                           :to="serviceUrl(deploy)">
                {{deploy.service_name}}</router-link>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconSliceCopy"></i> {{$t(`status.imgInfo`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <el-tooltip effect="dark"
                        :content="deploy.image"
                        placement="top">
              <div class="grid-content item-desc image-name">{{deploy.image?deploy.image.split('/')[2]:"*"}}
              </div>
            </el-tooltip>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script>
import mixin from '@/mixin/killSSELogMixin'
import qs from 'qs'

export default {
  data () {
    return {
    }
  },
  methods: {
    serviceUrl (deploy) {
      const path = `/v1/projects/detail/${deploy.product_name}/envs/detail/${deploy.service_name}`
      const query = {
        envName: deploy.env_name,
        projectName: deploy.product_name,
        namespace: deploy.namespace,
        clusterId: deploy.cluster_id ? deploy.cluster_id : ''
      }
      return path + '?' + qs.stringify(query)
    }
  },
  props: {
    deploys: {
      type: Array,
      required: true
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
  mixins: [mixin]
}
</script>

<style lang="less">
@import "~@assets/css/component/subtask.less";

.task-detail-deploy {
  .deploy-item {
    margin-bottom: 15px;
  }

  .image-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .env-link {
    color: @themeColor;
  }
}
</style>
