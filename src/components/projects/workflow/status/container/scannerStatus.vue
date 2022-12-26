<template>
  <div class="scanner-status-container">
    <div v-for="task in scannerTasks.running" :key="task.task_id" class="progress-header">
      <div class="progress-header-view">
        <div class="status-view">
          <div class="status running">{{ $t(`workflowTaskStatus.${task.status}`) }}</div>
        </div>
        <div class="info-view">
          <span class="spec">
            <span>
              <label>{{ $t(`workflowTaskStatus.${task.codeScanner}`) }} {{`#${task.task_id}`}}</label>
              <br />
              <router-link :to="getTaskUrl(task)">
                <span class="workflow-name">
                  <i class="el-icon-link"></i>
                  {{`${getScannerName(task)}`}}
                </span>
              </router-link>
            </span>
          </span>
          <span class="stages-tag">
            <el-tag v-if="showStage(task.stages,'scanning')" size="small" class="stage" type="primary">代码扫描</el-tag>
          </span>
          <section class="basic-info">
            <p class="author">
              <i class="el-icon-user"></i>
              {{task.task_creator}}
            </p>
            <p class="time">
              <i class="el-icon-time"></i>
              {{$utils.convertTimestamp(task.create_time)}}
            </p>
          </section>
        </div>
        <div class="operation-view">
          <span style="visibility: hidden;" class="icon el-icon-data-board view-detail"></span>
          <!-- <el-tooltip class="item" effect="dark" content="删除任务" placement="top">
            <span
              @click="taskOperation('pending','cancel',task.product_name,task.test_args.test_name+'-job',task.task_id)"
              class="icon el-icon-delete delete"
            ></span>
          </el-tooltip>-->
        </div>
      </div>
    </div>
    <div v-for="task in scannerTasks.pending" :key="task.task_id" class="progress-header">
      <div class="progress-header-view">
        <div class="status-view">
          <div class="status pending">{{$t('status.queued')}}</div>
        </div>
        <div class="info-view">
          <span class="spec">
            <span>
              <label>{{ $t(`workflowTaskStatus.${task.codeScanner}`) }}  {{`#${task.task_id}`}}</label>
              <br />
              <router-link :to="getTaskUrl(task)">
                <span class="workflow-name">
                  <i class="el-icon-link"></i>
                  {{`${getScannerName(task)}`}}
                </span>
              </router-link>
            </span>
          </span>
          <span class="stages-tag">
            <el-tag v-if="showStage(task.stages,'scanning')" size="small" class="stage" type="primary">代码扫描</el-tag>
          </span>
          <section class="basic-info">
            <p class="author">
              <i class="el-icon-user"></i>
              {{task.task_creator}}
            </p>
            <p class="time">
              <i class="el-icon-time"></i>
              {{$utils.convertTimestamp(task.create_time)}}
            </p>
          </section>
        </div>
        <div class="operation-view">
          <span style="visibility: hidden;" class="icon el-icon-data-board view-detail"></span>
          <!-- <el-tooltip class="item" effect="dark" content="删除任务" placement="top">
            <span
              @click="taskOperation('running','cancel',task.product_name,task.test_args.test_name+'-job',task.task_id)"
              class="icon el-icon-delete delete"
            ></span>
          </el-tooltip>-->
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { cancelScannerTaskAPI } from '@api'
export default {
  data () {
    return {}
  },
  methods: {
    /*
    任务操作
    * @param  {string}           taskType 任务类型（running，queue）
    * @param  {string}           operation 操作 （cancel，restart，delete）
    * @param  {string}           projectName 项目名称
    * @param  {number}           id 任务 id
    * @return {}
    */
    taskOperation (taskType, operation, projectName, id) {
      if (taskType === 'running') {
        switch (operation) {
          case 'cancel':
            cancelScannerTaskAPI(projectName, id).then(res => {
              this.$notify({
                title: this.$t('status.success'),
                message: this.$t('status.cancelRunningTaskSuccess'),
                type: 'success',
                offset: 50
              })
            })
            break
          case 'restart':
            break
          case 'delete':
            break
          default:
            break
        }
      } else if (taskType === 'queue') {
        switch (operation) {
          case 'cancel':
            cancelScannerTaskAPI(projectName, id).then(res => {
              this.$notify({
                title: this.$t('status.success'),
                message: this.$t('status.cancelQueuedTaskSuccess'),
                type: 'success',
                offset: 50
              })
            })
            break
          case 'restart':
            break
          case 'delete':
            break
          default:
            break
        }
      }
    },
    showStage (stages, stageName) {
      let flag = false
      stages.forEach(stage => {
        if (stageName === stage.type) {
          flag = true
        }
      })
      return flag
    },
    getTaskUrl (task) {
      const stage = task.stages.find(stage => stage.type === 'scanning')
      const scannerName = Object.keys(stage.sub_tasks)[0]
      const scannerId = stage.sub_tasks[scannerName].scanning_id
      return `/v1/projects/detail/${task.product_name}/scanner/detail/${scannerName}/task/${task.task_id}?status=${task.status}&id=${scannerId}`
    },
    getScannerName (task) {
      const stage = task.stages.find(stage => stage.type === 'scanning')
      const scannerName = Object.keys(stage.sub_tasks)[0]
      return scannerName
    }
  },
  props: {
    scannerTasks: {
      type: Object,
      required: true
    }
  }
}
</script>
<style lang="less">
.scanner-status-container {
  position: relative;
  margin-right: 0;
  margin-left: 0;

  .progress-header {
    margin-bottom: 8px;
    box-shadow: 1px 0 10px -5px rgba(0, 0, 0, 0.3);

    .progress-header-view {
      display: flex;
      min-height: 60px;
      margin-top: 0;
      margin-bottom: 0;
      padding: 10px 13px 10px 13px;
      font-size: 14px;
      list-style: none;
      background: #fff;
      border-bottom: 1px solid #eaeaea;

      .status-view {
        flex-basis: 160px;
        flex-grow: 0;
        flex-shrink: 0;

        .status {
          position: relative;
          bottom: -10px;
          width: 114px;
          height: 31px;
          margin-right: 8px;
          margin-left: 15px;
          padding-right: 15px;
          padding-left: 15px;
          color: #fff;
          font-weight: bold;
          font-size: 13px;
          line-height: 30px;
          text-align: center;
          border-radius: 50px;
          transition: width 100ms ease;

          &.failed {
            background-color: #ff1949;
          }

          &.running {
            background-color: @themeColor;
          }

          &.pending {
            background-color: #606266;
          }
        }
      }

      .info-view {
        display: flex;
        flex: 1 1 auto;
        width: calc(100% - 600px);
        padding-right: 18px;
        padding-left: 20px;

        .spec {
          display: flex;
          align-items: center;
          width: 100%;

          span {
            max-width: 45%;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;

            label {
              padding-top: 10px;
              padding-right: 20px;
              color: #888;
              font-size: 14px;
            }

            .workflow-name {
              color: @themeColor;
              font-size: 16px;
              line-height: 16px;
            }
          }
        }

        .stages-tag {
          display: flex;
          align-items: center;
          width: 100%;

          .stage {
            margin-right: 10px;
          }
        }

        .basic-info {
          position: relative;
          flex: 0 0 19%;
          align-items: center;

          .time,
          .author {
            margin: 6px 0;
            color: #666;
            font-size: 14px;
          }
        }
      }

      .operation-view {
        display: flex;
        align-content: center;
        align-items: center;
        justify-content: flex-end;

        .icon {
          margin-right: 25px;
          font-size: 20px;
          cursor: pointer;

          &.delete {
            color: #ff1949;
          }

          &.view-detail {
            color: @themeColor;
          }
        }
      }
    }
  }
}
</style>
