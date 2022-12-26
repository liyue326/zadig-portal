<template>
  <div class="test-case-container">
    <template v-if="testType === 'undefined'|| testType === 'function'">
      <el-card class="box-card"
               :body-style="{ padding: '0px', margin: '15px 0 0 0' }">
        <div slot="header"
             class="clearfix">
          <span>{{$t(`testing.taskDetails.report.overview`)}}</span>
        </div>
        <div class="test-summary">
          <FunctionTestSummary :success="testSummary.successes?testSummary.successes:(testSummary.tests - testSummary.failures - testSummary.errors)"
                                 :failure="testSummary.failures"
                                 :error="testSummary.errors"
                                 :total="testSummary.tests"
                                 :skip="testSummary.skips"/>
        </div>
      </el-card>
      <el-card class="box-card task-process"
               :body-style="{ padding: '0px', margin: '15px 0 0 0' }">
        <div slot="header"
             class="clearfix">
          <span>{{$t(`testing.taskDetails.report.caseDetails`)}}</span>
        </div>
        <FunctionTestCase :testCases="testCases"/>
      </el-card>
    </template>
    <template v-if="testType ==='performance'">
      <el-card class="box-card"
               :body-style="{ padding: '0px', margin: '15px 0 0 0' }">
        <el-table :data="performanceTests"
                  style="width: 100%;">
          <el-table-column prop="label"
                           label="Label">
          </el-table-column>
          <el-table-column prop="samples"
                           label="Samples">
          </el-table-column>
          <el-table-column prop="average"
                           label="Average">
          </el-table-column>
          <el-table-column prop="min"
                           label="Min">
          </el-table-column>
          <el-table-column prop="max"
                           label="Max">
          </el-table-column>
          <el-table-column prop="error"
                           label="Error">
          </el-table-column>
          <el-table-column prop="line"
                           label="90% Line">
          </el-table-column>
          <el-table-column prop="stdDev"
                           label="Std Dev">
          </el-table-column>
          <el-table-column prop="throughput"
                           label="Throughput">
          </el-table-column>
          <el-table-column prop="receivedKb"
                           label="Received KB/sec">
          </el-table-column>
          <el-table-column prop="avgByte"
                           label="Avg Bytes">
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<script>
import FunctionTestCase from '@/components/projects/test/common/functionTestCase.vue'
import FunctionTestSummary from '@/components/projects/test/common/functionTestSummary.vue'
import { getTestReportAPI } from '@api'
// NOTE: 总数 = tests + skips 成功 = tests - failures
export default {
  data () {
    return {
      testSummary: {
        failures: 0,
        skips: 0,
        tests: 0,
        time: 0,
        errors: 0,
        successes: 0
      },
      testCases: [
        {
          name: '',
          skipped: '',
          time: 0
        }
      ],
      performanceTests: []
    }
  },
  methods: {
    getTestCases () {
      const { workflow_name, task_id, test_name } = this.$route.params
      const { service_name, test_type } = this.$route.query
      getTestReportAPI(this.projectName, workflow_name, task_id, test_name, service_name, test_type, 'test').then((res) => {
        if (test_type === 'undefined' || test_type === 'function') {
          this.testSummary = res.functionTestSuite
          this.testCases = res.functionTestSuite.testcase
          this.testCases.forEach(testCase => {
            const blocks = []
            if (testCase.failure && typeof testCase.failure === 'string') {
              blocks.push(`${this.$t(`testing.display.failReason`)}\n${testCase.failure}`)
            }
            if (testCase.failure && typeof testCase.failure === 'object') {
              blocks.push(`${this.$t(`testing.display.failMessage`)}\n${testCase.failure.message}`)
              blocks.push(`${this.$t(`testing.display.failDetail`)}\n${testCase.failure.text}`)
            }
            if (testCase.system_out) {
              blocks.push(`${this.$t(`testing.display.standardOut`)}\n${testCase.system_out}`)
            }
            if (testCase.error) {
              blocks.push(`${this.$t(`testing.display.errorMessage`)}\n${testCase.error.message}`)
              blocks.push(`${this.$t(`testing.display.errorDetail`)}\n${testCase.error.text}`)
              blocks.push(`${this.$t(`testing.display.errorType`)}\n${testCase.error.type}`)
            }
            testCase.mergedOutput = blocks.join('\n')
          })
        } else if (test_type === 'performance') {
          this.performanceTests = res.performanceTestSuite
        }
      })
    }
  },
  computed: {
    testType () {
      return this.$route.query.test_type
    },
    workflowName () {
      return this.$route.params.workflow_name
    },
    projectName () {
      return this.$route.params.project_name
    },
    taskId () {
      return this.$route.params.task_id
    }
  },
  created () {
    this.getTestCases()
  },
  components: {
    FunctionTestSummary,
    FunctionTestCase
  }
}
</script>

<style lang="less" >
.pointer {
  cursor: pointer;
}

.failure-dialog {
  .el-dialog__body {
    padding: 15px 20px;
    color: rgb(72, 85, 106);
    font-size: 14px;
  }
}

.test-case-container {
  position: relative;
  flex: 1;
  height: 100%;
  padding: 0 10px;
  overflow: auto;

  .clearfix::before,
  .clearfix::after {
    display: table;
    content: "";
  }

  .clearfix {
    span {
      color: #999;
      font-size: 16px;
      line-height: 20px;
    }
  }

  .clearfix::after {
    clear: both;
  }

  .test-summary {
    width: 300px;
    height: 140px;
  }

  .box-card,
  .task-process {
    margin-top: 15px;
    padding: 0 10px;
    border: none;
    box-shadow: none;
  }

  .el-card__header {
    padding-left: 0;
  }

  .el-row {
    margin-bottom: 15px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .filter-header {
    cursor: pointer;
  }

  .el-table__column-filter-trigger {
    .el-icon-arrow-down {
      position: relative;
      top: 3px;
      font-size: 24px;
    }
  }
}

.case-desc {
  white-space: normal;
  text-align: left;
}

.icon {
  font-size: 17px;
  cursor: pointer;

  &:hover {
    color: @themeColor;
  }
}
</style>
