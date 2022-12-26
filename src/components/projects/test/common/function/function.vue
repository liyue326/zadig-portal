<template>
  <div
    v-loading="loading"
    :element-loading-text="$t(`global.loading`)"
    element-loading-spinner="iconfont iconfont-loading iconvery-testing"
    class="function-test-manage"
  >
    <el-dialog :title="$t(`testing.triggers.selectWorkflowTriggers`)" :visible.sync="selectWorkflowDialogVisible" width="30%" center>
      <el-select v-model="selectWorkflow" style="width: 100%;" filterable value-key="name" size="small" :placeholder="$t(`testing.triggers.selectWorkflowTriggersII`)">
        <el-option
          v-for="(workflow,index) in availableWorkflows"
          :key="index"
          :label="`${workflow.display_name} (${workflow.product_tmpl_name})`"
          :value="workflow"
        ></el-option>
      </el-select>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="selectWorkflowDialogVisible = false">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" size="small" :disabled="!selectWorkflow" @click="bindWorkflow">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
    <div v-if="testList.length > 0" class="tab-container">
      <div class="test-container">
        <el-input v-model="selectKey" :placeholder="$t(`testing.searchTests`)" class="search-test" prefix-icon="el-icon-search" clearable></el-input>
      </div>
      <ul class="test-content">
        <TestRow
          v-for="(testInfo, index) in selectedTestList"
          :key="index"
          :testInfo="testInfo"
          :removeTest="removeTest"
          :addConnection="addConnection"
          :deleteConnection="deleteConnection"
          :runTests="runTests"
        />
      </ul>
    </div>
    <div v-if="testList.length === 0 && !loading" class="no-product">
      <img src="@assets/icons/illustration/test.svg" alt />
      <p>{{$t(`testing.noTestsErrorMessage`)}}</p>
    </div>
  </div>
</template>

<script>
import TestRow from './container/testRow.vue'
import bus from '@utils/eventBus'
import moment from 'moment'
import {
  testsAPI,
  runTestsAPI,
  updateWorkflowAPI,
  deleteTestAPI,
  getWorkflowBindAPI,
  singleTestAPI
} from '@api'

export default {
  data () {
    return {
      testList: [],
      selectWorkflowDialogVisible: false,
      loading: false,
      currentTestName: '',
      currentProjectName: '',
      selectWorkflow: null,
      availableWorkflows: [],
      selectKey: ''
    }
  },
  props: {
    basePath: {
      request: true,
      type: String
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name || ''
    },
    selectedTestList () {
      return this.testList.filter(test => test.name.includes(this.selectKey))
    }
  },
  methods: {
    fetchTestList () {
      const projectName = this.projectName
      const testType = 'function'
      this.loading = true
      testsAPI(projectName, testType).then(res => {
        for (const row of res) {
          row.updateTimeReadable = moment(row.update_time, 'X').format(
            'YYYY-MM-DD HH:mm:ss'
          )
        }
        this.loading = false
        this.testList = res
      })
    },
    async bindWorkflow () {
      const workflow = this.selectWorkflow
      if (workflow.test_stage.test_names) {
        workflow.test_stage.enabled = true
        workflow.test_stage.test_names.push(this.currentTestName)
      } else {
        const res = await singleTestAPI(
          this.currentTestName,
          this.currentProjectName
        )
        workflow.test_stage.enabled = true
        workflow.test_stage.tests = workflow.test_stage.tests || []
        workflow.test_stage.tests.push({
          test_name: this.currentTestName,
          envs: res.pre_test.envs || []
        })
      }
      updateWorkflowAPI(workflow, true).then(() => {
        this.$message({
          type: 'success',
          message: this.$t(`testing.triggers.creationSuccess`)
        })
        this.selectWorkflow = null
        this.availableWorkflows = []
        this.selectWorkflowDialogVisible = false
        this.fetchTestList()
      })
    },
    runTests (name, projectName) {
      const payload = {
        product_name: projectName,
        test_name: name
      }
      runTestsAPI(payload)
        .then(res => {
          this.$message.success(this.$t(`testing.creationSuccess`))
          return res
        })
        .then(res => {
          this.$router.push(
            `/v1/projects/detail/${projectName}/test/detail/function/${res.pipeline_name}/${res.task_id}?status=running`
          )
        })
    },
    removeTest (obj) {
      this.$confirm(this.$t(`testing.deletionConfirmation`, { name: obj.name }), this.$t(`global.confirmation`), {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(() => {
        deleteTestAPI(obj.name, obj.product_name).then(() => {
          this.$message.success(this.$t(`testing.deletionSuccess`))
          this.fetchTestList()
        })
      })
    },
    addConnection (testName, projectName) {
      this.selectWorkflowDialogVisible = true
      this.currentTestName = testName
      this.currentProjectName = projectName
      getWorkflowBindAPI(projectName, testName).then(res => {
        this.availableWorkflows = res.filter(element => {
          return element.product_tmpl_name
        })
      })
    },
    deleteConnection (testName, workflow) {
      this.$confirm(this.$t(`testing.triggers.deletionConfirmation`, { name: workflow.display_name }), this.$t(`testing.triggers.deletion`), {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      })
        .then(() => {
          if (workflow.test_stage.test_names) {
            const index = workflow.test_stage.test_names.indexOf(testName)
            workflow.test_stage.test_names.splice(index, 1)
          } else if (workflow.test_stage.tests) {
            workflow.test_stage.tests = workflow.test_stage.tests.filter(
              test => {
                return test.test_name !== testName
              }
            )
          }
          updateWorkflowAPI(workflow, true).then(() => {
            this.$message({
              type: 'success',
              message: this.$t(`testing.triggers.deletionSuccess`)
            })
            this.fetchTestList()
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: this.$t(`testing.triggers.deletionCancellation`)
          })
        })
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: this.projectName
        ? [
          { title: this.$t(`sidebarMenu.projects`), url: '/v1/projects' },
          {
            title: this.projectName,
            isProjectName: true,
            url: `/v1/projects/detail/${this.projectName}/detail`
          },
          { title: this.$t(`subTopbarMenu.tests`), url: '' }
        ]
        : [{ title: this.$t(`sidebarMenu.testCenter`), url: '' }]
    })

    this.fetchTestList()
  },
  components: {
    TestRow
  }
}
</script>

<style lang="less" scoped>
.function-test-manage {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .tab-container {
    height: calc(~'100% - 20px');

    .test-container {
      height: 40px;
      margin: 15px 20px;
      text-align: right;

      .search-test {
        width: 400px;
      }
    }

    .test-content {
      height: calc(~'100% - 70px');
      padding: 0 20px;
      overflow: auto;
    }
  }

  .add-test {
    margin-top: 15px;
  }

  .no-product {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;

    img {
      width: 400px;
      height: 400px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }
}
</style>
