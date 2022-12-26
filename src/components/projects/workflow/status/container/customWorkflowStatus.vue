<template>
  <div class="custom-workflow-status-container">
    <div v-for="task in customWorkflowTasks.running" :key="task.task_id" class="task-container">
      <div class="progress-header">
        <div class="progress-header-view">
          <div class="status-view">
            <div class="status running">{{ $t(`workflowTaskStatus.${task.status}`) }}</div>
          </div>
          <div class="info-view">
            <span class="spec">
              <span>
                <label>{{$t('status.workflow')}} {{`#${task.task_id}`}}</label>
                <br />
                <router-link
                  :to="`/v1/projects/detail/${task.project_name}/pipelines/custom/${task.workflow_name}/${task.task_id}?status=${task.status}&display_name=${task.workflow_display_name}`"
                >
                  <span class="workflow-name">
                    <i class="el-icon-link"></i>
                    {{`${task.workflow_display_name}`}}
                  </span>
                </router-link>
              </span>
            </span>
            <span class="stages-tag">
              <CusTags :values="getStages(task.stages)" class="item" />
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
        </div>
      </div>
      <div class="stages">
        <div class="stage" style="min-width: 250px;" v-for="stage in task.stages" :key="stage.name">
          <div class="line first"></div>
          <div class="stage-header stage-header-empty-status">
            <div class="stage-header-col stage-header-title">
              {{stage.name}}
              <i class="icon el-icon-right"></i>
            </div>
          </div>
          <ul class="list-unstyled steps cf-steps-list">
            <li class="cf-steps-list-item" v-for="(job,index) in stage.jobs" :key="index">
              <div class="step step-status" :class="job.status">
                <div class="step-data">
                  <i class="el-icon-cloudy"></i>
                  <span class="step-description">{{job.name}}</span>
                  <span class="step-type"></span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-for="task in customWorkflowTasks.pending" :key="task.task_id" class="progress-header">
      <div class="progress-header-view">
        <div class="status-view">
          <div class="status pending">{{$t('status.queued')}}</div>
        </div>
        <div class="info-view">
          <span class="spec">
            <span>
              <label>{{$t('status.workflow')}} {{`#${task.task_id}`}}</label>
              <br />
              <router-link
                :to="`/v1/projects/detail/${task.project_name}/pipelines/custom/${task.workflow_name}/${task.task_id}?status=${task.status}&display_name=${task.workflow_display_name}`"
              >
                <span class="workflow-name">
                  <i class="el-icon-link"></i>
                  {{`${task.workflow_display_name}`}}
                </span>
              </router-link>
            </span>
          </span>
          <span class="stages-tag">
            <CusTags :values="getStages(task.stages)" class="item" />
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
      </div>
    </div>
  </div>
</template>
<script>
import { cancelWorkflowAPI } from '@api'
export default {
  data () {
    return {
      taskDetailExpand: {}
    }
  },
  watch: {},
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    /*
  任务操作
  * @param  {string}           task_type 任务类型（running，queue）
  * @param  {string}           operation 操作 （cancel，restart，delete）
  * @param  {number}           id 任务 id
  * @param  {string}           pipeline_name 流水线名
  * @return {}
  */
    taskOperate (task_type, operation, id, pipeline_name) {
      if (task_type === 'running') {
        switch (operation) {
          case 'cancel':
            cancelWorkflowAPI(this.projectName, pipeline_name, id).then(res => {
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
      } else if (task_type === 'queue') {
        switch (operation) {
          case 'cancel':
            cancelWorkflowAPI(this.projectName, pipeline_name, id).then(res => {
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
    getStages (stages) {
      if (!stages) {
        return
      }
      return stages.map(item => item.name)
    }
  },
  props: {
    customWorkflowTasks: {
      type: Object,
      required: true
    }
  }
}
</script>
<style lang="less">
.custom-workflow-status-container {
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
          font-weight: 400;
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
              color: #a3a3a3;
              font-weight: 400;
              font-size: 14px;
              line-height: 18px;
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

          .stage-tag {
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
    }
  }

  .stages {
    display: flex;
    flex-wrap: nowrap;
    margin: 25px 0 0;
    padding-bottom: 35px;
    overflow-x: auto;

    .stage {
      position: relative;
      width: 25%;
      padding: 11px 30px 20px 40px;
      overflow: hidden;
      background:
        -webkit-gradient(
          linear,
          right top,
          left top,
          from(rgba(150, 150, 150, 0.1)),
          color-stop(56.91%, rgba(0, 0, 0, 0))
        );
      background:
        linear-gradient(
          270deg,
          rgba(150, 150, 150, 0.1) 0%,
          rgba(0, 0, 0, 0) 56.91%
        );

      .line.first {
        border-top: none;
        border-top-right-radius: 0;
      }

      .line.first::before {
        position: absolute;
        top: 0;
        right: -4px;
        display: inline-block;
        width: 7px;
        height: 7px;
        background-color: #ccc;
        border-radius: 5px;
        content: ' ';
      }

      .line {
        position: absolute;
        top: 40px;
        bottom: 10px;
        left: -13px;
        width: 34px;
        border-top: 1px solid #ccc;
        border-right: 1px solid #ccc;
        border-top-right-radius: 7px;
      }

      .stage-header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        min-height: 62px;
        margin-bottom: 20px;
        padding-right: 10px;
        padding-left: 10px;
        overflow: hidden;
        background-color: #fff;
        border-radius: 6px;
        box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.13);

        .stage-header-title {
          width: 50%;
          padding-right: 12px;
        }

        .stage-title {
          margin: 0;
          overflow: hidden;
          color: #000;
          font-weight: bold;
          font-size: 14px;
          line-height: 1.4;
          white-space: nowrap;
          text-align: left;
          text-transform: uppercase;
          text-overflow: ellipsis;
        }
      }

      .stage-header.stage-header-empty-status {
        padding-left: 20px;
      }

      .stage-header > * {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding-top: 15px;
        padding-bottom: 15px;
      }

      .steps {
        margin: 0;
        padding: 0;
      }

      .step {
        display: block;
        margin-bottom: 20px;
        padding: 15px 10px 15px 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        background-color: #fff;
        border-left: 5px solid #ccc;
        -webkit-box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.03);
        box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.03);

        &.failed {
          border-left-color: #ff1949;
        }

        &.running {
          border-left-color: @themeColor;
          animation: blink 1.6s infinite;
        }

        &.passed {
          border-left-color: #67c23a;
        }

        &.pending {
          border-left-color: #606266;
        }
      }

      .list-unstyled {
        padding-left: 0;
        list-style: none;
      }

      .cf-steps-list {
        .step {
          display: flex;
          cursor: pointer;
        }

        .step::before {
          position: absolute;
          left: 16.5px;
          display: inline-block;
          width: 10px;
          height: 10px;
          margin-top: 4px;
          background-color: #ccc;
          border-radius: 50%;
          content: ' ';
        }

        .running::before {
          background-color: @themeColor;
        }

        .passed::before {
          background-color: #67c23a;
        }

        .failed::before {
          background-color: #ff1949;
        }

        .step-data {
          position: relative;
          flex-grow: 1;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          -webkit-box-flex: 1;
          -ms-flex-positive: 1;

          .icon {
            float: left;
            width: 30px;
            margin-top: 1px;
            margin-right: 10px;
          }

          .step-description {
            padding-right: 15px;
            overflow: hidden;
            color: #606266;
            font-size: 13px;
            line-height: 18px;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .step-type {
            min-width: 0;
            overflow: hidden;
            color: #999;
            font-weight: bold;
            font-size: 12px;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }
}
</style>
