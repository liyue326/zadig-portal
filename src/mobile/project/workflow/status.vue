<template>
  <div class="mobile-status">
    <van-nav-bar>
      <template #title>运行状态</template>
    </van-nav-bar>
    <van-tabs v-model="activeTab" sticky>
      <van-tab :title="`正在运行 ${tasksCount.running?tasksCount.running:''}`" name="running">
        <van-empty v-if="tasksCount.running===0" image="search" description="暂无正在运行任务" />
        <div v-else v-for="task in runningTasks" :key="task.task_id" class="task-container">
          <van-cell-group>
            <van-cell center :to="setTaskURL(task)">
              <template #title>
                <span class="workflow-name">{{`${task.pipeline_display_name}`}}</span>
                <van-tag plain type="primary">{{`#${task.task_id}`}}</van-tag>
              </template>
              <template #label>
                <span class="creator">{{`${task.task_creator}`}}</span>
                <div class="time">{{$utils.convertTimestamp(task.create_time)}}</div>
              </template>
              <template #default>
                <van-button plain hairline @click.stop="taskOperation('cancel',task)" size="small" type="danger">{{$t(`global.cancel`)}}</van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-tab>
      <van-tab :title="`队列中 ${tasksCount.pending?tasksCount.pending:''}`" name="pending">
        <van-empty v-if="tasksCount.pending===0" image="search" description="暂无队列中任务" />
        <div v-else v-for="task in pendingTasks" :key="task.task_id" class="task-container">
          <van-cell-group>
            <van-cell center :to="setTaskURL(task)">
              <template #title>
                <span class="workflow-name">{{`${task.pipeline_display_name}`}}</span>
                <van-tag plain type="primary">{{`#${task.task_id}`}}</van-tag>
              </template>
              <template #label>
                <span class="creator">{{`${task.task_creator}`}}</span>
                <div class="time">{{$utils.convertTimestamp(task.create_time)}}</div>
              </template>
              <template #default>
                <van-button plain hairline @click.stop="taskOperation('cancel',task)" size="small" type="danger">{{$t(`global.cancel`)}}</van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>
<script>
import {
  NavBar,
  Tag,
  Loading,
  Button,
  Notify,
  Tab,
  Tabs,
  Cell,
  CellGroup,
  Icon,
  Empty
} from 'vant'
import {
  taskRunningSSEAPI,
  taskPendingSSEAPI,
  cancelWorkflowAPI,
  cancelTestTaskAPI
} from '@api'
export default {
  components: {
    [NavBar.name]: NavBar,
    [Tag.name]: Tag,
    [Loading.name]: Loading,
    [Button.name]: Button,
    [Notify.name]: Notify,
    [Tab.name]: Tab,
    [Tabs.name]: Tabs,
    [Cell.name]: Cell,
    [CellGroup.name]: CellGroup,
    [Icon.name]: Icon,
    [Empty.name]: Empty
  },
  data () {
    return {
      activeTab: 'running',
      tasksCount: {
        running: null,
        pending: null
      },
      runningTasks: [],
      pendingTasks: []
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    setTaskURL (task) {
      if (task.type === 'workflow') {
        return `/mobile/projects/detail/${task.product_name}/workflows/multi/${task.pipeline_name}/${task.task_id}?status=${task.status}&display_name=${task.pipeline_display_name}`
      } else if (task.type === 'test') {
        return `/mobile/projects/detail/${task.product_name}/tests/${task.pipeline_name}/${task.task_id}?status=${task.status}&display_name=${task.pipeline_display_name}`
      }
    },
    showTaskList (type) {
      if (type === 'running') {
        taskRunningSSEAPI()
          .then(res => {
            this.runningTasks = res.data
            this.tasksCount.running = res.data.length
          })
          .closeWhenDestroy(this)
      } else if (type === 'queue') {
        taskPendingSSEAPI()
          .then(res => {
            this.pendingTasks = res.data
            this.tasksCount.pending = res.data.length
          })
          .closeWhenDestroy(this)
      }
    },
    /*
    任务操作
    * @param  {string}           operation 操作
    * @param  {object}           task      任务
    * @return {}
    */
    taskOperation (operation, task) {
      const type = task.type
      const projectName = this.projectName
      const workflowName = task.pipeline_name
      const id = task.task_id
      switch (operation) {
        case 'cancel':
          if (type === 'workflow') {
            cancelWorkflowAPI(projectName, workflowName, id).then(res => {
              Notify({ type: 'success', message: '任务取消成功' })
            })
          } else if (type === 'test') {
            cancelTestTaskAPI(projectName, workflowName, id).then(res => {
              Notify({ type: 'success', message: '任务取消成功' })
            })
          }
          break
        default:
          break
      }
    }
  },
  mounted () {
    this.showTaskList('running')
    this.showTaskList('queue')
  }
}
</script>
