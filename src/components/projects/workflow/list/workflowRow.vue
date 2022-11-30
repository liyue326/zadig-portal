<template>
  <div class="product-workflow-row">
    <div class="info-container">
      <span class="info-header">
        <div class="status" :class="recentTaskStatus">
          <span v-if="recentTaskStatus === 'passed'|| recentTaskStatus === 'success'" class="el-icon-success"></span>
          <span
            v-else-if="recentTaskStatus === 'failed'||recentTaskStatus === 'failure'||recentTaskStatus === 'timeout'"
            class="el-icon-error"
          ></span>
          <span v-else-if="recentTaskStatus === 'cancelled'||recentTaskStatus === 'terminated'" class="el-icon-warning"></span>
          <span v-else-if="recentTaskStatus === 'running'||recentTaskStatus === 'elected'" class="el-icon-loading"></span>
          <span v-else class="el-icon-warning"></span>
        </div>
        <div class="tag-container">
          <el-tag v-if="workflowInfo.workflow_type === 'common_workflow'" class="workflow-tag" size="mini" effect="plain">自定义</el-tag>
          <el-tag v-else-if="workflowInfo.workflow_type === 'release'" class="workflow-tag" size="mini" effect="plain">发布</el-tag>
          <el-tag v-else class="workflow-tag" size="mini" effect="plain">产品</el-tag>
        </div>

        <div class="stages-container">
          <CusTags :values="stages" noBorder noLimit />
        </div>
      </span>
    </div>
    <div class="detail-container">
      <section class="workflow-header" @click.stop>
        <div class="info-wrap">
          <span @click.stop="setFavorite(projectName,name,type)" class="favorite el-icon-star-on" :class="{'liked':isFavorite}"></span>
          <div class="name-container">
            <div class="workflow-name">
              <router-link :to="workflowLink">
                <el-tooltip effect="dark" :content="displayName" placement="top">
                  <span class="name-span">{{ displayName }}</span>
                </el-tooltip>
              </router-link>
            </div>
            <el-tooltip v-if="description" effect="dark" :content="description" placement="top">
              <div class="gray-desc workflow-desc">{{ $utils.tailCut(description,25) }}</div>
            </el-tooltip>
            <div v-else class="gray-desc workflow-desc">-</div>
          </div>
        </div>
      </section>

      <section class="recent-success">
        <div class="gray-desc">
          最近成功
          <span style="display: inline-block; width: 80px;">
            <span v-if="recentSuccessID">{{$utils.convertTimestamp(workflowInfo.recentSuccessfulTask.create_time,'mm-dd-mm')}}</span>
          </span>
        </div>
        <div v-if="recentSuccessID" class="detail-desc">
          <i class="icon el-icon-user"></i>
          <span>{{workflowInfo.recentSuccessfulTask.task_creator}}</span>
          <router-link :to="recentSuccessLink" class="success">{{ recentSuccessID }}</router-link>
        </div>
        <div v-else class="detail-desc">
          <span>-</span>
        </div>
      </section>
      <section class="recent-failed">
        <div class="gray-desc">
          最近失败
          <span style="display: inline-block; width: 80px;">
            <span v-if="recentFailID">{{$utils.convertTimestamp(workflowInfo.recentFailedTask.create_time,'mm-dd-mm')}}</span>
          </span>
        </div>
        <div v-if="recentFailID" class="detail-desc">
          <i class="icon el-icon-user"></i>
          <span>{{workflowInfo.recentFailedTask.task_creator}}</span>
          <router-link :to="recentFailLink" class="failed">{{ recentFailID }}</router-link>
        </div>
        <div v-else class="detail-desc">
          <span>-</span>
        </div>
      </section>
      <section class="time-rate">
        <div class="gray-desc">平均执行时间</div>
        <div class="value">{{ avgRuntime || '-' }}</div>
      </section>
      <section class="time-rate">
        <div class="gray-desc">成功率</div>
        <div class="value">{{ avgSuccessRate || '-' }}</div>
      </section>
      <section class="operations" @click.stop>
        <slot name="operations"></slot>
      </section>
    </div>
  </div>
</template>

<script>
import { setFavoriteAPI, deleteFavoriteAPI } from '@api'
export default {
  data () {
    return {}
  },
  props: {
    workflowInfo: {
      type: Object,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },

    type: {
      type: String,
      required: true
    },

    isFavorite: {
      type: Boolean,
      required: true
    },

    name: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    stages: {
      type: Array,
      required: true
    },

    recentTaskStatus: {
      type: String,
      required: true
    },

    recentSuccessID: {
      type: String,
      required: true
    },

    recentSuccessLink: {
      type: String,
      required: true
    },
    recentFailID: {
      type: String,
      required: true
    },
    recentFailLink: {
      type: String,
      required: true
    },
    updateTime: {
      type: String,
      required: true
    },
    avgRuntime: {
      type: String,
      required: true
    },
    avgSuccessRate: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    }
  },
  computed: {
    workflowLink () {
      if (this.type === 'common_workflow' || this.type === 'release') {
        return `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.name}?display_name=${this.displayName}`
      } else {
        return `/v1/projects/detail/${this.projectName}/pipelines/multi/${this.name}?display_name=${this.displayName}`
      }
    }
  },
  methods: {
    setFavorite (projectName, workflowName, type) {
      if (type === 'common_workflow') {
        this.$message.info('自定义工作流暂不支持收藏！')
        return
      } else if (type === 'release') {
        this.$message.info('发布工作流暂不支持收藏！')
        return
      }
      const payload = {
        product_name: projectName,
        name: workflowName,
        type: type
      }
      if (this.isFavorite) {
        deleteFavoriteAPI(projectName, workflowName, type).then(res => {
          this.$emit('refreshWorkflow', this.projectName)
          this.$message({
            type: 'success',
            message: '取消收藏成功'
          })
        })
      } else {
        setFavoriteAPI(payload).then(res => {
          this.$emit('refreshWorkflow', this.projectName)
          this.$message({
            type: 'success',
            message: '添加收藏成功'
          })
        })
      }
    }
  }
}
</script>

<style lang="less">
.product-workflow-row {
  display: flex;
  flex-direction: column;

  .info-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    .info-header {
      display: inline-flex;
      align-items: center;
      padding: 8px 10px;
      background-color: #fff;
      border-radius: 6px 6px 0 0;

      .status {
        display: flex;
        color: #77797d;

        &.running,
        &.elected {
          color: @themeColor;
          animation: blink 1.5s infinite;
        }

        &.passed,
        &.success {
          color: #67c23a;
        }

        &.failed,
        &.failure,
        &.timeout {
          color: #ff1949;
        }

        &.cancelled,
        &.terminated {
          color: #77797d;
        }
      }

      .tag-container {
        width: 48px;
        margin-left: 10px;
      }

      .stages-container {
        display: flex;
      }
    }
  }

  .detail-container {
    display: flex;
    flex-flow: row nowrap;
    flex-grow: 1;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    width: 100%;
    height: 70px;
    margin-bottom: 14px;
    overflow: auto;
    font-size: 14px;
    line-height: 22px;
    background: #fff;
    border-left: 0 solid #77797d;

    .detail-desc {
      margin-top: 4px;
      color: #4a4a4a;
      font-size: 12px;
      cursor: auto;
    }

    .gray-desc {
      color: @fontLightGray;
      font-size: 12px;
      line-height: 22px;

      &.workflow-desc {
        display: flex;
        max-width: 300px;
        margin-top: 4px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }

    .workflow-header {
      flex: 0 0 300px;
      max-width: 300px;
      cursor: auto;

      .info-wrap {
        display: flex;
        align-items: center;

        .favorite {
          display: inline-flex;
          flex: 0 0 8px;
          margin: 0 8px;
          color: #ebebf0;
          font-size: 20px;
          text-align: center;
          cursor: pointer;

          &.liked,
          &:hover {
            color: @themeColor;
          }
        }

        .name-container {
          display: flex;
          flex-direction: column;

          .workflow-name {
            display: flex;
            align-items: center;

            a {
              display: flex;
              color: @themeColor;
              font-weight: 500;

              .name-span {
                display: inline-block;
                max-width: 220px;
                margin-right: 8px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              }
            }
          }
        }
      }
    }

    .desc {
      flex: 1 0 20%;
      color: @fontLightGray;
      font-size: 13px;
    }

    .time-rate {
      flex: 0 0 80px;
      margin-right: 20px;
      white-space: nowrap;

      .value {
        margin-top: 4px;
        color: #4a4a4a;
        line-height: 22px;
        cursor: auto;
      }
    }

    .recent-success {
      flex: 0 0 80px;
      white-space: nowrap;

      .detail-desc {
        .success {
          color: #06f;
        }
      }
    }

    .recent-failed {
      flex: 0 0 80px;
      white-space: nowrap;

      .detail-desc {
        .failed {
          color: #06f;
        }
      }
    }

    .operations {
      display: flex;
      flex: 0 0 200px;
      align-items: center;
      justify-content: space-around;
      font-size: 23px;
      cursor: auto;
    }
  }
}
</style>
