<template>
  <div class="task-list-container">
    <el-table :data="taskList"
              stripe
              style="width: 100%;">
      <el-table-column prop="task_id"
                       label="ID"
                       min-width="80"
                       sortable>
        <template slot-scope="scope">
          <router-link :to="`${baseUrl}/${scope.row.task_id}?status=${scope.row.status}&id=${workflowID}&display_name=${displayName}`"
                       class="task-id">
            {{ '#' +scope.row.task_id }}</router-link>
        </template>
      </el-table-column>
      <el-table-column min-width="100"
                       prop="status"
                       :label="$t(`workflow.runStatus`)">
        <template slot-scope="scope">
          <span :class="[`status-${$utils.taskElTagType(scope.row.status)}`]">
            &nbsp;{{ $t(`workflowTaskStatus.${scope.row.status}`) }}
          </span>
        </template>
      </el-table-column>
       <el-table-column min-width="120"
                        :label="$t(`workflow.duration`)">
        <template slot-scope="scope">
          <el-icon name="time"></el-icon>
          <span v-if="scope.row.status!=='running'"
                style="margin-left: 5px;">
            {{ $utils.timeFormatEn(scope.row.end_time - scope.row.start_time) }}
          </span>
          <span v-else
                style="margin-left: 5px;">
            {{ taskDuration(scope.row.task_id,scope.row.start_time) +
              $utils.timeFormatEn(durationSet[scope.row.task_id]) }}
            <el-tooltip v-if="durationSet[scope.row.task_id]<0"
                        content="本地系统时间和服务端可能存在不一致，请同步。"
                        placement="top">
              <i class="el-icon-warning"
                 style="color: red;"></i>
            </el-tooltip>
          </span>
        </template>
      </el-table-column>
      <el-table-column :label="$t(`workflow.executor`)" min-width="120">
        <template slot-scope="{ row }">
          <div class="common-column">{{ row.task_creator }}</div>
          <div class="common-column column-gray">{{ convertTimestamp(row.create_time) }}</div>
        </template>
      </el-table-column>
      <el-table-column v-if="showServiceNames"
                       min-width="180"
                       :label="$t(`global.serviceName`)">
        <template slot-scope="{ row }">
          <template v-if="row.service_modules && row.service_modules.length > 0">
            <div v-for="(item,index) in row.service_modules" :key="index" class="common-column hover-color">
              <el-tooltip effect="dark" :content="`${item.service_module}(${item.service_name})`" placement="top">
                <span class="service-name-span">{{`${item.service_module}(${item.service_name})`}}</span>
              </el-tooltip>
            </div>
          </template>
          <div v-else class="common-column">N/A</div>
        </template>
      </el-table-column>
      <el-table-column min-width="280" :label="$t(`global.gitMessage`)" v-if="showServiceNames && workflowType === 'buildv2'">
        <template slot-scope="{ row }">
          <div v-for="(item,index) in row.service_modules" :key="index" class="common-column repo-list">
            <div v-if="item.code_info.length > 0" effect="light"  :open-delay="250" placement="right">
              <div slot="content">
                <el-popover
                    placement="right-start"
                    width="240"
                    trigger="hover"
                    popper-class="repo-detail-popover">
                    <i slot="reference" class="repo-detail-icon el-icon-d-caret"></i>
                    <div class="repo-detail">
                      <div v-for="(code,codeIndex) in item.code_info" :key="codeIndex" class="repo-detail-item">
                        <div class="common-column">{{ code.commit_message }}</div>
                        <div class="common-column color-theme">
                          <RepoJump :build="code" :showCommit="false"/>
                        </div>
                        <div class="common-column"><i class="el-icon-user" style="margin-right: 4px;"></i>{{ code.author_name }}</div>
                      </div>
                    </div>
                  </el-popover>
                <span class="hover-color">
                  <span v-if="item.code_info[0].commit_message" class="repo-info" style="width: 143px;">{{ item.code_info[0].commit_message }}</span>
                  <span v-if="item.code_info[0].author_name" class="repo-info" style="width: 100px;"><i class="el-icon-user" style="margin-right: 4px;"></i>{{ item.code_info[0].author_name }}</span>
                </span>
              </div>
            </div>
            <div v-else class="common-column">N/A</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-if="showEnv"
                       min-width="100"
                       :label="$t(`project.environments`)">
        <template slot-scope="scope">
          <span v-if="scope.row.namespace">
            {{ scope.row.namespace}}
          </span>
        </template>
      </el-table-column>
      <el-table-column v-if="showTestReport"
                       :label="$t(`workflow.testResults`)"
                       min-width="100">
        <template slot-scope="scope">
          <template v-if="scope.row.test_reports">
            <div v-for="(item,testIndex) in scope.row.testSummary"
                 :key="testIndex"
                 class="common-column">
              <el-popover v-if="item.type==='function'"
                          trigger="hover"
                          placement="top">
                <p><span>测试名称：{{item.name}}</span></p>
                <p><span>总测试用例：{{item.total}}</span></p>
                <p><span>成功用例：{{item.success}}</span></p>
                <p><span>测试用时：{{$utils.timeFormat(parseInt(item.time))}}</span></p>
                <span slot="reference">
                  <router-link :to="`${functionTestBaseUrl}/${scope.row.task_id}/test/${workflowName}-${scope.row.task_id}-test?is_workflow=1&service_name=${item.name}&test_type=${item.type}`">
                    <span class="report-link"><i class="iconfont iconzidong"></i>
                      {{item.success}}/{{item.total}}</span>
                  </router-link>
                </span>
              </el-popover>
              <router-link v-else-if="item.type==='performance'"
                           style="display: block;"
                           :to="`${functionTestBaseUrl}/${scope.row.task_id}/test/${workflowName}-${scope.row.task_id}-test?is_workflow=1&service_name=${item.name}&test_type=${item.type}`">
                <span class="report-link">
                  <i class="iconfont iconxingneng"></i> 性能</span>
              </router-link>
              <router-link v-else-if="item.type==='security'"
                           style="display: block;"
                           :to="`${securityTestBaseUrl}/${scope.row.task_id}?imageId=${item.img_id}`">
                <span class="report-link"><i class="iconfont iconanquan"></i> 安全</span>
              </router-link>
            </div>
          </template>
          <span v-else>N/A</span>
        </template>
      </el-table-column>
      <el-table-column v-if="showOperation"
                       width="90"
                       :label="$t(`global.operation`)"
                       align="center">
        <template slot-scope="scope">
            <el-button v-hasPermi="{projectName: projectName, action: 'run_workflow',resource:{name:workflowName,type:'workflow'},isBtn:true}"
                       @click="rerun(scope.row)"
                       type="text"
                       icon="el-icon-copy-document"
                       size="mini"
                       class="common-font">
              {{$t(`workflow.clone`)}}
            </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination layout="prev, pager, next"
                     @current-change="changeTaskPage"
                     :current-page="currentPage"
                     :page-size="pageSize"
                     :total="total">
      </el-pagination>
    </div>
  </div>
</template>

<script>
import RepoJump from '@/components/projects/workflow/common/repoJump.vue'
import { workflowTaskDetailAPI, getCustomCloneDetailAPI } from '@api'
import moment from 'moment'
export default {
  data () {
    return {
      durationSet: {}
    }
  },
  methods: {
    convertTimestamp (value) {
      return moment.unix(value).format('MM-DD HH:mm')
    },
    taskDuration (task_id, started) {
      const refresh = () => {
        const duration = Math.floor(Date.now() / 1000) - started
        this.$set(this.durationSet, task_id, duration)
      }
      setInterval(refresh, 1000)
      return ''
    },
    changeTaskPage (val) {
      this.$emit('currentChange', val)
    },
    async rerun (task) {
      const projectName = task.product_name
      const workflowName = task.pipeline_name || task.workflow_name
      const taskId = task.task_id
      if (this.workflowType === 'buildv4') {
        const customDetail = await getCustomCloneDetailAPI(workflowName, taskId, this.projectName)
        if (customDetail) {
          this.$emit('cloneTask', customDetail)
        }
      } else {
        const taskDetail = await workflowTaskDetailAPI(
          projectName,
          workflowName,
          taskId
        )
        if (taskDetail) {
          this.$emit('cloneTask', taskDetail)
        }
      }
    }
  },

  props: {
    taskList: {
      required: true,
      type: Array
    },
    baseUrl: {
      required: true,
      type: String
    },
    showEnv: {
      required: false,
      default: false,
      type: Boolean
    },
    showOperation: {
      required: false,
      default: false,
      type: Boolean
    },
    showTestReport: {
      required: false,
      default: false,
      type: Boolean
    },
    showServiceNames: {
      required: false,
      default: false,
      type: Boolean
    },
    workflowType: {
      default: '',
      type: String
    },
    workflowName: {
      required: false,
      default: '',
      type: String
    },
    displayName: {
      default: '',
      type: String
    },
    workflowID: {
      required: false,
      default: '',
      type: String
    },
    functionTestBaseUrl: {
      required: false,
      default: '',
      type: String
    },
    total: {
      required: false,
      default: 0,
      type: Number
    },
    projectName: {
      required: false,
      default: '',
      type: String
    },
    pageSize: {
      required: false,
      default: 50,
      type: Number
    },
    currentPage: {
      required: false,
      default: 1,
      type: Number
    }
  },
  components: {
    RepoJump
  }
}
</script>

<style lang="less" scoped>
@columnColor: #4a4a4a;

.pagination {
  display: flex;
  justify-content: center;
}

.task-list-container {
  /deep/.el-table {
    color: @columnColor;

    // .status-icon {
    //   display: inline-block;
    //   width: 10px;
    //   height: 10px;
    //   margin-bottom: -2px;
    //   border: 2px solid;
    //   border-radius: 50%;
    // }
  }

  .repo-list {
    .repo-detail-icon {
      margin-right: 8px;
      margin-left: -12px;
      color: @themeColor;
      cursor: pointer;
    }

    .repo-info {
      display: inline-block;
      box-sizing: border-box;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      vertical-align: bottom;

      &:not(:last-child) {
        padding-right: 10px;
      }
    }
  }

  .hover-color {
    &:hover {
      color: @themeColor;
    }

    .service-name-span {
      display: inline-block;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .column-gray {
    color: @fontLightGray;
  }

  .task-id,
  .report-link {
    color: @themeColor;
  }
}
</style>

<style lang="less">
.el-popover.repo-detail-popover {
  margin-left: 8px;
  border-color: @themeColor;

  &[x-placement^=right] .popper__arrow {
    border-right-color: @themeColor;
  }

  .repo-detail {
    .repo-detail-item {
      &:not(:last-child) {
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid @borderGray;
      }
    }
  }

  .color-theme {
    color: @themeColor;
  }
}
</style>
