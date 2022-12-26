<template>
  <div class="mobile-task-detail">
    <van-nav-bar left-arrow fixed @click-left="mobileGoback">
      <template #title>
        <span>{{testName}} 测试</span>
      </template>
    </van-nav-bar>
    <div class="task-info">
      <van-row>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">ID</h2>
            <div class="mobile-block-desc">{{`#${taskID}`}}</div>
          </div>
        </van-col>
      </van-row>
      <van-row>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">状态</h2>
            <div class="mobile-block-desc">
              <van-tag size="small" :type="$utils.mobileVantTagType(taskDetail.status)">{{ taskDetail.status?$t(`workflowTaskStatus.${taskDetail.status}`):$t(`workflowTaskStatus.notRunning`) }}</van-tag>
            </div>
          </div>
        </van-col>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">{{$t(`global.creator`)}}</h2>
            <div class="mobile-block-desc">{{ taskDetail.task_creator }}</div>
          </div>
        </van-col>
      </van-row>
      <van-row>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">{{$t(`workflow.duration`)}}</h2>
            <div class="mobile-block-desc">{{ taskDetail.interval }}</div>
          </div>
        </van-col>
      </van-row>
    </div>
    <template v-if="taskDetail.status!=='passed'">
      <div class="mobile-block">
        <h2 class="mobile-block-title">操作</h2>
      </div>
      <van-cell is-link title="操作" @click="showAction = true" />
      <van-action-sheet
        close-on-click-action
        v-model="showAction"
        :actions="actions"
        cancel-text="取消"
        @select="onSelectAction"
        @open="openSelectAction"
        @cancel="onCancel"
      />
    </template>
    <template v-if="testArray.length > 0">
      <div class="mobile-block">
      </div>
      <van-collapse v-model="testActive">
        <van-collapse-item v-for="(item,index) in testArray" :key="index" :name="item._target">
          <template #title>
            <van-row>
              <van-col span="12">{{$utils.showServiceName(item._target)}}</van-col>
              <van-col span="12">
                <span
                  :class="colorTranslation(item.testingv2SubTask.status, 'pipeline', 'task')"
                >{{ item.testingv2SubTask.status?$t(`workflowTaskStatus.${item.testingv2SubTask.status}`):$t(`workflowTaskStatus.notRunning`)}}</span>
                {{ makePrettyElapsedTime(item.testingv2SubTask) }}
                <el-tooltip v-if="calcElapsedTimeNum(item.testingv2SubTask)<0" content="本地系统时间和服务端可能存在不一致，请同步。" placement="top">
                  <i class="el-icon-warning" style="color: red;"></i>
                </el-tooltip>
              </van-col>
            </van-row>
          </template>
          <TaskDetailTest
            :testingv2="item.testingv2SubTask"
            :serviceName="item._target"
            :pipelineName="testName"
            ref="testComp"
            :taskID="taskID"
            isTestJob
          />
        </van-collapse-item>
      </van-collapse>
    </template>
  </div>
</template>
<script>
import {
  Col,
  Collapse,
  CollapseItem,
  Row,
  NavBar,
  Tag,
  Panel,
  Loading,
  Button,
  Notify,
  Tab,
  Tabs,
  Cell,
  CellGroup,
  Icon,
  Divider,
  ActionSheet
} from 'vant'
import TaskDetailTest from '../workflow/product/common/taskDetailTest.vue'
import { colorTranslate } from '@utils/wordTranslate.js'
import {
  workflowTaskDetailAPI,
  workflowTaskDetailSSEAPI,
  restartTestTaskAPI,
  cancelTestTaskAPI
} from '@api'
export default {
  components: {
    [NavBar.name]: NavBar,
    [Tag.name]: Tag,
    [Panel.name]: Panel,
    [Loading.name]: Loading,
    [Button.name]: Button,
    [Notify.name]: Notify,
    [Tab.name]: Tab,
    [Tabs.name]: Tabs,
    [Cell.name]: Cell,
    [CellGroup.name]: CellGroup,
    [Icon.name]: Icon,
    [Col.name]: Col,
    [Row.name]: Row,
    [Divider.name]: Divider,
    [ActionSheet.name]: ActionSheet,
    [Collapse.name]: Collapse,
    [CollapseItem.name]: CollapseItem,
    TaskDetailTest
  },
  data () {
    return {
      showAction: false,
      actions: [],
      workflow: {},
      taskDetail: {
        stages: []
      },
      buildActive: [],
      testActive: []
    }
  },
  methods: {
    onCancel () {
      this.showAction = false
    },
    openSelectAction () {
      this.actions = []
      if (
        this.taskDetail.status === 'failed' ||
        this.taskDetail.status === 'cancelled' ||
        this.taskDetail.status === 'timeout'
      ) {
        this.actions.push({ name: '失败重试' })
      }
      if (
        this.taskDetail.status === 'running' ||
        this.taskDetail.status === 'created'
      ) {
        this.actions.push({ name: '取消任务' })
      }
    },
    onSelectAction (action) {
      const projectName = this.projectName
      const taskID = this.taskID
      const testName = this.testName
      if (action.name === '失败重试') {
        const taskUrl = `/mobile/projects/detail/${projectName}/tests/${testName}/${taskID}?status=running`
        restartTestTaskAPI(projectName, testName, taskID).then(res => {
          Notify({ type: 'success', message: '任务已重新启动' })
          this.$router.push(taskUrl)
        })
      } else if (action.name === '取消任务') {
        cancelTestTaskAPI(projectName, testName, taskID).then(res => {
          if (this.$refs && this.$refs.testComp) {
            this.$refs.testComp.killLog('test')
          }
          Notify({ type: 'success', message: '任务取消成功' })
        })
      }
      this.showAction = false
    },
    colorTranslation (word, category, subitem) {
      return colorTranslate(word, category, subitem)
    },
    calcElapsedTimeNum (subTask) {
      if (this.$utils.isEmpty(subTask) || subTask.status === '') {
        return 0
      }
      const endTime =
        subTask.status === 'running'
          ? Math.floor(Date.now() / 1000)
          : subTask.end_time
      return endTime - subTask.start_time
    },
    makePrettyElapsedTime (subTask) {
      return this.$utils.timeFormat(this.calcElapsedTimeNum(subTask))
    },
    adaptTaskDetail (detail) {
      detail.interval = this.$utils.timeFormat(
        (detail.status === 'running'
          ? Math.round(new Date().getTime() / 1000)
          : detail.end_time) - detail.start_time
      )
    },
    collectSubTask (map, typeName) {
      const stage = this.taskDetail.stages.find(
        stage => stage.type === typeName
      )
      if (stage) {
        for (const target in stage.sub_tasks) {
          if (!(target in map)) {
            map[target] = {}
          }
          map[target][`${typeName}SubTask`] = stage.sub_tasks[target]
        }
      }
    },
    fetchTaskDetail () {
      return workflowTaskDetailSSEAPI(
        this.projectName,
        this.testName,
        this.taskID,
        'test'
      )
        .then(res => {
          this.adaptTaskDetail(res.data)
          this.taskDetail = res.data
          this.workflow = res.data.workflow_args
        })
        .closeWhenDestroy(this)
    },
    fetchOldTaskDetail () {
      workflowTaskDetailAPI(
        this.projectName,
        this.testName,
        this.taskID,
        'test'
      ).then(res => {
        this.adaptTaskDetail(res)
        this.taskDetail = res
        this.workflow = res.workflow_args
      })
    },
    isStageDone (name) {
      if (this.taskDetail.stages.length > 0) {
        const stage = this.taskDetail.stages.find(element => {
          return element.type === name
        })
        return stage ? stage.status === 'passed' : false
      }
    }
  },
  computed: {
    testName () {
      return this.$route.params.test_name
    },
    taskID () {
      return this.$route.params.task_id
    },
    status () {
      return this.$route.query.status
    },
    workflowProductTemplate () {
      return this.workflow.product_tmpl_name
    },
    projectName () {
      return this.$route.params.project_name
    },
    testMap () {
      const map = {}
      this.collectSubTask(map, 'testingv2')
      return map
    },
    testArray () {
      const arr = this.$utils.mapToArray(this.testMap, '_target')
      return arr
    }
  },
  watch: {
    $route (to, from) {
      if (
        this.status === 'passed' ||
        this.status === 'failed' ||
        this.status === 'timeout' ||
        this.status === 'cancelled'
      ) {
        this.fetchOldTaskDetail()
      } else {
        this.fetchTaskDetail()
      }
    }
  },
  mounted () {
    if (
      this.status === 'passed' ||
      this.status === 'failed' ||
      this.status === 'timeout' ||
      this.status === 'cancelled'
    ) {
      this.fetchOldTaskDetail()
    } else {
      this.fetchTaskDetail()
    }
  }
}
</script>
<style lang="less">
.mobile-task-detail {
  padding-top: 46px;
  padding-bottom: 50px;
}
</style>
