<template>
  <div class="mobile-pipelines-detail">
    <van-nav-bar left-arrow fixed @click-left="mobileGoback">
      <template #title>
        <span>{{testName}} 测试</span>
      </template>
    </van-nav-bar>
    <van-divider content-position="left">最新一次测试报告</van-divider>
    <div class="task-info">
      <van-row>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">总测试用例</h2>
            <div class="mobile-block-desc">{{latestTestSummary.tests }}</div>
          </div>
        </van-col>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">成功用例</h2>
            <div class="mobile-block-desc">
              {{latestTestSummary.tests -
              latestTestSummary.failures - latestTestSummary.errors}}
            </div>
          </div>
        </van-col>
      </van-row>
      <van-row>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">失败用例</h2>
            <div class="mobile-block-desc">{{latestTestSummary.failures}}</div>
          </div>
        </van-col>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">错误用例</h2>
            <div class="mobile-block-desc">{{latestTestSummary.errors}}</div>
          </div>
        </van-col>
      </van-row>
      <van-row>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">未执行用例</h2>
            <div class="mobile-block-desc">{{latestTestSummary.skips}}</div>
          </div>
        </van-col>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">测试用时</h2>
            <div class="mobile-block-desc">{{$utils.timeFormat(parseInt((latestTestSummary.time)))}}</div>
          </div>
        </van-col>
      </van-row>
      <van-row>
        <van-col span="24">
          <div class="mobile-block">
            <h2 class="mobile-block-title">操作</h2>
            <van-cell is-link title="启动测试" @click="showAction = true" />
            <van-action-sheet
              close-on-click-action
              v-model="showAction"
              :actions="actions"
              cancel-text="取消"
              @select="onSelectAction"
              @cancel="onCancel"
            />
          </div>
        </van-col>
      </van-row>
    </div>
    <van-divider content-position="left">历史任务</van-divider>
    <div>
      <van-cell
        v-for="task in testTasks"
        :to="`/mobile/projects/detail/${projectName}/tests/${task.pipeline_name}/${task.task_id}?status=${task.status}`"
        :key="task.task_id"
      >
        <template #title>
          <span class="create-info">{{ convertTimestamp(task.create_time)+' '+ task.task_creator}}</span>
        </template>
        <template #label>
          <span class="task-id">{{`#${task.task_id}`}}</span>
          <span class="status">
            <van-tag plain :type="$utils.mobileVantTagType(task.status)">{{ myTranslate(task.status) }}</van-tag>
          </span>
          <template v-if="task.test_reports">
            <van-tag plain v-for="(item,testIndex) in task.testSummary" :key="testIndex" color="#909399">{{item.success}}/{{item.total}}</van-tag>
          </template>
        </template>
        <template #default>
          <span v-if="task.status!=='running'" style="font-size: 13px;">{{ $utils.timeFormat(task.end_time - task.start_time) }}</span>
          <span v-else style="font-size: 13px;">
            {{ taskDuration(task.task_id,task.start_time) +
            $utils.timeFormat(durationSet[task.task_id]) }}
          </span>
        </template>
      </van-cell>
      <van-pagination v-model="currentPage" @change="changeTaskPage" :items-per-page="pageSize" :total-items="total" />
    </div>
  </div>
</template>
<script>
import {
  NavBar,
  Tag,
  Button,
  Cell,
  CellGroup,
  Icon,
  Col,
  Row,
  Divider,
  ActionSheet,
  List,
  Pagination,
  Notify
} from 'vant'
import { getLatestTestReportAPI, workflowTaskListAPI, runTestsAPI } from '@api'
import { wordTranslate } from '@utils/wordTranslate.js'
import moment from 'moment'
export default {
  components: {
    [NavBar.name]: NavBar,
    [Tag.name]: Tag,
    [Button.name]: Button,
    [Cell.name]: Cell,
    [CellGroup.name]: CellGroup,
    [Icon.name]: Icon,
    [Col.name]: Col,
    [Row.name]: Row,
    [Divider.name]: Divider,
    [ActionSheet.name]: ActionSheet,
    [List.name]: List,
    [Pagination.name]: Pagination,
    [Notify.name]: Notify
  },
  data () {
    return {
      latestTestSummary: {
        failures: 0,
        skips: 0,
        tests: 0,
        time: 0,
        errors: 0,
        successes: 0
      },
      testTasks: [],
      actions: [{ name: '启动' }],
      total: 0,
      pageSize: 10,
      currentPage: 1,
      showAction: false,
      durationSet: {}
    }
  },
  methods: {
    onSelectAction (action) {
      if (action.name === '启动') {
        this.runTask()
      }
      this.showAction = false
    },
    onCancel () {
      this.showAction = false
    },
    runTask () {
      const projectName = this.projectName
      const serviceName = this.serviceName
      const payload = {
        product_name: projectName,
        test_name: serviceName
      }
      runTestsAPI(payload).then(res => {
        Notify({
          type: 'success',
          message: '任务创建成功'
        })
        this.$router.push(
          `/mobile/projects/detail/${projectName}/tests/${res.pipeline_name}/${res.task_id}?status=running`
        )
      })
    },
    hideAndFetchHistory () {
      this.fetchHistory(0, this.pageSize)
    },
    getLatestTest () {
      const projectName = this.projectName
      const serviceName = this.serviceName
      getLatestTestReportAPI(projectName, serviceName).then(res => {
        this.latestTestSummary = res
      })
    },
    fetchHistory (start, max) {
      const projectName = this.projectName
      const testName = this.testName
      workflowTaskListAPI(projectName, testName, start, max, 'test').then(
        res => {
          res.data.forEach(element => {
            if (element.test_reports) {
              const testArray = []
              for (const testName in element.test_reports) {
                const val = element.test_reports[testName]
                if (typeof val === 'object') {
                  const struct = {
                    success: null,
                    total: null,
                    name: null,
                    type: null,
                    time: null,
                    img_id: null
                  }
                  if (val.functionTestSuite) {
                    struct.name = testName
                    struct.type = 'function'
                    struct.success = val.functionTestSuite.successes
                      ? val.functionTestSuite.successes
                      : val.functionTestSuite.tests -
                        val.functionTestSuite.failures -
                        val.functionTestSuite.errors
                    struct.total = val.functionTestSuite.tests
                    struct.time = val.functionTestSuite.time
                  }
                  testArray.push(struct)
                }
              }
              element.testSummary = testArray
            }
          })
          this.testTasks = res.data
          this.total = res.total
        }
      )
    },
    changeTaskPage (val) {
      const start = (val - 1) * this.pageSize
      this.fetchHistory(start, this.pageSize)
    },
    convertTimestamp (value) {
      return moment.unix(value).format('MM-DD HH:mm')
    },
    myTranslate (word) {
      return wordTranslate(word, 'pipeline', 'task')
    },
    taskDuration (task_id, started) {
      const refresh = () => {
        const duration = Math.floor(Date.now() / 1000) - started
        this.$set(this.durationSet, task_id, duration)
      }
      setInterval(refresh, 1000)
      return ''
    }
  },
  computed: {
    testName () {
      return `${this.$route.params.test_name}-job`
    },
    serviceName () {
      return `${this.$route.params.test_name}`
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  mounted () {
    this.getLatestTest()
    this.fetchHistory(0, this.pageSize)
  }
}
</script>
<style lang="less">
.mobile-pipelines-detail {
  padding-top: 46px;
  padding-bottom: 50px;

  .task-id {
    color: @themeColor;
  }

  .status,
  .env {
    margin-left: 8px;
  }

  .run-workflow {
    .el-dialog__body {
      padding: 8px 10px;
      color: #606266;
      font-size: 14px;
    }
  }

  .van-cell__label {
    white-space: nowrap;
  }
}
</style>
