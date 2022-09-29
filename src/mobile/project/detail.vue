<template>
  <div class="mobile-project-detail">
    <van-sticky>
      <van-nav-bar v-if="projectInfo" left-arrow @click-left="mobileGoback">
        <template #title>
          <span>{{projectInfo.project_name?projectInfo.project_name:projectName}} 项目</span>
        </template>
      </van-nav-bar>
    </van-sticky>
    <van-divider content-position="left">
      <van-icon class-prefix="iconfont" name="category iconfont iconxiangmuloading" />
      <span>基本信息</span>
    </van-divider>
    <div v-if="projectInfo" class="task-info">
      <van-row>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">更新时间</h2>
            <div class="mobile-block-desc">{{$utils.convertTimestamp(projectInfo.update_time) }}</div>
          </div>
        </van-col>
      </van-row>
      <van-row v-if="projectInfo.desc">
        <van-col span="24">
          <div class="mobile-block">
            <h2 class="mobile-block-title">描述</h2>
            <div class="mobile-block-desc">{{projectInfo.desc}}</div>
          </div>
        </van-col>
      </van-row>
    </div>
    <van-divider content-position="left">
      <van-icon class-prefix="iconfont" name="category iconfont icongongzuoliucheng" />
      <span>工作流信息</span>
    </van-divider>
    <div v-if="workflows.length > 0">
      <van-cell
        v-for="workflow in workflows"
        :to="`/mobile/projects/detail/${workflow.projectName}/workflows/multi/${workflow.name}`"
        :key="workflow.name"
      >
        <template #title>
          <span class="workflow-name">{{workflow.name}}</span>
        </template>
        <template #default>
          <span
            v-if="workflow.recentTask"
            :class="[`status-${$utils.taskElTagType(workflow.recentTask.status)}`]"
          >{{ wordTranslation(workflow.recentTask.status,'pipeline','task')}}</span>
          <span v-else>N/A</span>
        </template>
      </van-cell>
    </div>
    <van-empty v-else description="暂无工作流" />
    <van-divider content-position="left">
      <van-icon class-prefix="iconfont" name="category iconfont iconvery-environ" />
      <span>环境信息</span>
    </van-divider>
    <div v-if="envs.length > 0">
      <van-cell v-for="env in envs" :to="`/mobile/projects/detail/${env.projectName}/envs/${env.name}`" :key="env.name">
        <template #title>
          <span class="env-name">{{env.name}}</span>
        </template>
        <template #default>
          <span v-if="env.status" :class="[$translate.calcEnvStatusColor(env.status)]">{{getEnvStatus(env.status, env.updatable)}}</span>
        </template>
      </van-cell>
    </div>
    <van-empty v-else description="暂无环境" />
    <van-divider content-position="left">
      <van-icon class-prefix="iconfont" name="category iconfont iconvery-testing" />
      <span>测试信息</span>
    </van-divider>
    <div v-if="tests.length > 0">
      <van-cell v-for="test in tests" :to="`/mobile/projects/detail/${test.product_name}/tests/${test.name}`" :key="test.name">
        <template #title>
          <span class="test-name">{{test.name}}</span>
          <template v-if="test.pass_rate">
            <van-tag v-if="test.pass_rate < 0.5" type="danger" plain>{{ (test.pass_rate * 100).toFixed(2)+'%' }}</van-tag>
            <van-tag v-if="test.pass_rate > 0.5 && test.pass_rate < 0.8 " type="warning" plain>{{ (test.pass_rate * 100).toFixed(2)+'%' }}</van-tag>
            <van-tag v-if="test.pass_rate > 0.8" type="success" plain>{{ (test.pass_rate * 100).toFixed(2)+'%' }}</van-tag>
          </template>
        </template>
        <template #label>
          <span v-if="test.desc"> {{test.desc}} </span>
        </template>
        <template #default>
          <span v-if="test.avg_duration">{{ $utils.timeFormatEn(test.avg_duration) }}</span>
        </template>
      </van-cell>
    </div>
    <van-empty v-else description="暂无测试" />
  </div>
</template>
<script>
import {
  Col,
  Row,
  NavBar,
  Cell,
  CellGroup,
  Icon,
  Divider,
  Sticky,
  Empty,
  Tag
} from 'vant'
import {
  getEnvInfoAPI,
  listProductAPI,
  getProjectInfoAPI,
  getCustomWorkflowListAPI,
  testsAPI
} from '@api'
import { translateEnvStatus } from '@utils/wordTranslate'
import { wordTranslate } from '@utils/wordTranslate.js'
import moment from 'moment'
export default {
  components: {
    [NavBar.name]: NavBar,
    [Cell.name]: Cell,
    [CellGroup.name]: CellGroup,
    [Icon.name]: Icon,
    [Col.name]: Col,
    [Row.name]: Row,
    [Divider.name]: Divider,
    [Empty.name]: Empty,
    [Sticky.name]: Sticky,
    [Tag.name]: Tag
  },
  data () {
    return {
      envs: [],
      workflows: [],
      tests: [],
      projectInfo: null
    }
  },
  methods: {
    async getProject () {
      const projectName = this.projectName
      this.projectInfo = await getProjectInfoAPI(projectName).catch(error =>
        console.log(error)
      )
    },
    async getWorkflows () {
      const projectName = this.projectName
      const res = await getCustomWorkflowListAPI(projectName)
      if (res) {
        this.workflows = res.workflow_list.filter(
          workflow => workflow.workflow_type !== 'common_workflow'
        )
      }
    },
    getTests () {
      const projectName = this.projectName
      const type = 'function'
      testsAPI(projectName, type).then(res => {
        for (const row of res) {
          row.updateTimeReadable = moment(row.update_time, 'X').format(
            'YYYY-MM-DD HH:mm:ss'
          )
        }
        this.tests = res
      })
    },
    getEnvList () {
      const projectName = this.projectName
      listProductAPI(projectName).then(res => {
        this.envs = res.map(element => {
          getEnvInfoAPI(projectName, element.name).then(res => {
            element.status = res.status
          })
          return element
        })
      })
    },
    wordTranslation (word, category, subitem) {
      return wordTranslate(word, category, subitem)
    },
    getEnvStatus (status, updateble) {
      return translateEnvStatus(status, updateble)
    },
    async initProjectInfo () {
      this.getProject()
      this.getWorkflows()
      this.getEnvList()
      this.getTests()
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  mounted () {
    this.initProjectInfo()
  }
}
</script>
<style lang="less">
.mobile-project-detail {
  .workflow-name,
  .env-name,
  .test-name {
    color: @themeColor;
  }

  .van-cell__label {
    white-space: nowrap;
  }

  .iconfont-category {
    margin-right: 5px;
    font-size: 14px;
  }
}
</style>
