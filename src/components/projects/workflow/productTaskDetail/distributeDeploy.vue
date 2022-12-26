<template>
  <div class="task-detail-distribute">
    <el-card  v-if="distributeDeploy.release_imageSubTask" class="box-card task-process" :body-style="{ margin: '15px 0 0 0' }">
      <div class="error-wrapper">
        <el-alert
          v-if="distributeDeploy.release_imageSubTask.error"
          :title="$t(`global.errorMsg`)"
          :description="distributeDeploy.release_imageSubTask.error"
          type="error"
          :close-text="$t(`global.ok`)"
        ></el-alert>
      </div>
      <div slot="header" class="clearfix subtask-header">
        <span>分发</span>
        <div v-if="distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status === 'running'" class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div class="deploy-item">
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconzhuangtai"></i> 分发状态
            </div>
          </el-col>
          <el-col :span="6">
            <div
              class="grid-content item-desc"
              :class="$translate.calcTaskStatusColor(distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status)"
            >{{distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status?$t(`workflowTaskStatus.${distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status}`):$t(`workflowTaskStatus.notRunning`)}}</div>
          </el-col>
          <el-col
            v-if=" distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status && distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status !=='running'"
            :span="6"
          >
            <div class="grid-content item-title">
              <i class="iconfont iconshijian"></i> {{$t(`workflow.duration`)}}
            </div>
          </el-col>
          <el-col
            v-if="distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status && distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status !=='running'"
            :span="6"
          >
            <div
              class="grid-content item-desc"
            >{{$utils.timeFormat(distributeDeploy.release_imageSubTask.distribute_info[0].distribute_end_time - distributeDeploy.release_imageSubTask.distribute_info[0].distribute_start_time)}}</div>
          </el-col>
        </el-row>
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconshengji"></i> {{$t(`workflow.distributionWay`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">镜像分发</div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconSliceCopy"></i> {{$t(`status.imgInfo`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">
              <el-tooltip effect="dark" :content="distributeDeploy.release_imageSubTask.distribute_info[0].image" placement="top">
                <div
                  class="grid-content item-desc"
                >{{distributeDeploy.release_imageSubTask.distribute_info[0].image?distributeDeploy.release_imageSubTask.distribute_info[0].image.split('/')[2]:"*"}}</div>
              </el-tooltip>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
    <template v-if="deployInfo && deployInfo.length > 0">
      <el-card v-for="(deploy,index) in deployInfo" :key="index" class="box-card task-process" :body-style="{ margin: '15px 0 0 0' }">
        <div slot="header" class="clearfix subtask-header">
          <span>部署</span>
          <div v-if="deploy.deploy_status === 'running'" class="loader">
            <div class="ball-scale-multiple">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
        <div class="deploy-item">
          <el-row :gutter="0">
            <el-col :span="6">
              <div class="grid-content item-title">
                <i class="iconfont iconzhuangtai"></i> {{$t(`status.deployStatus`)}}
              </div>
            </el-col>
            <el-col :span="6">
              <div
                class="grid-content item-desc"
                :class="$translate.calcTaskStatusColor(deploy.deploy_status)"
              >{{deploy.deploy_status?$t(`workflowTaskStatus.${deploy.deploy_status}`):$t(`workflowTaskStatus.notRunning`)}}</div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-title">
                <i class="iconfont iconvery-environ"></i> {{$t(`workflow.deploymentEnv`)}}
              </div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-desc">{{deploy.deploy_env}}</div>
            </el-col>
          </el-row>
          <el-row :gutter="0">
            <el-col :span="6">
              <div class="grid-content item-title">
                <i class="iconfont iconvery-service"></i> {{$t(`global.serviceName`)}}
              </div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-desc">{{deploy.deploy_service_name}}</div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-title">
                <i class="iconfont iconSliceCopy"></i> {{$t(`status.imgInfo`)}}
              </div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-desc">
                <el-tooltip effect="dark" :content="deploy.image" placement="top">
                  <div class="grid-content item-desc">{{deploy.image?deploy.image.split('/')[2]:"*"}}</div>
                </el-tooltip>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </template>

    <el-card
      v-if="distributeDeploy.distribute2kodoSubTask && distributeDeploy.distribute2kodoSubTask.enabled"
      class="box-card task-process"
      :body-style="{ margin: '15px 0 0 0' }"
    >
      <div slot="header" class="clearfix subtask-header">
        <span>分发</span>
        <div v-if="distributeDeploy.distribute2kodoSubTask.status === 'running'" class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div class="deploy-item">
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconzhuangtai"></i> 分发状态
            </div>
          </el-col>
          <el-col :span="6">
            <div
              class="grid-content item-desc"
              :class="$translate.calcTaskStatusColor(distributeDeploy.distribute2kodoSubTask.status)"
            >{{distributeDeploy.distribute2kodoSubTask.status?$t(`workflowTaskStatus.${distributeDeploy.distribute2kodoSubTask.status}`):$t(`workflowTaskStatus.notRunning`)}}</div>
          </el-col>
          <!-- <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconjiqun1"></i> {{$t(`workflow.duration`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div
              class="grid-content item-desc"
            >{{$utils.timeFormat(distributeDeploy.distribute2kodoSubTask.end_time - distributeDeploy.distribute2kodoSubTask.start_time)}}</div>
          </el-col>-->
        </el-row>
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconshengji"></i> {{$t(`workflow.distributionWay`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">对象存储</div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconbaoguanli"></i> 二进制包
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">
              <div class="grid-content item-desc">{{distributeDeploy.distribute2kodoSubTask.package_file}}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script>
// import qs from 'qs'

export default {
  data () {
    return {}
  },
  props: {
    distributeDeploy: {
      type: Object,
      required: true
    }
  },
  computed: {
    deployInfo () {
      if (this.distributeDeploy.release_imageSubTask) {
        return this.distributeDeploy.release_imageSubTask.distribute_info.filter(
          item => {
            return item.deploy_enabled
          }
        )
      } else {
        return []
      }
    }
  }
}
</script>

<style lang="less">
@import '~@assets/css/component/subtask.less';

.task-detail-distribute {
  .deploy-item {
    margin-bottom: 15px;
  }

  .env-link {
    color: @themeColor;
  }
}
</style>
