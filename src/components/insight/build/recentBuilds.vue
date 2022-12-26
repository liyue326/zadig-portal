<template>
  <div style="width: 100%; height: 250px;">
    <el-table :data="tableData" v-loading="loading" :show-header="true" class="build-table">
      <el-table-column prop="taskId" :label="$t('dataStatistics.insight.taskId')">
        <template slot-scope="scope">
          <router-link
            class="task-link"
            :to="`/v1/projects/detail/${scope.row.productName}/pipelines/${scope.row.type==='workflow'?'multi':'single'}/${scope.row.pipelineName}/${scope.row.taskId}?status=${scope.row.status}`"
          >{{scope.row.pipelineName}}#{{scope.row.taskId}}</router-link>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" :label="$t('dataStatistics.insight.taskTime')">
        <template slot-scope="scope">
          <span class="date-info">{{ $utils.convertTimestamp(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" width="60px" :label="$t(`global.status`)">
        <template slot-scope="scope">
          <el-tag
            effect="dark"
            size="mini"
            :type="$utils.taskElTagType(scope.row.status)"
            close-transition
          >{{ $t(`workflowTaskStatus.${scope.row.status}`) }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getLatestBuildsAPI } from '@api'
export default {
  data () {
    return {
      tableData: [],
      loading: true
    }
  },
  methods: {
    getLatestBuilds () {
      this.loading = true
      const startTime = Math.floor(this.selectedDuration[0] / 1000)
      const endTime = Math.floor(this.selectedDuration[1] / 1000)
      const selectedProjects = this.selectedProjects
      getLatestBuildsAPI({
        startDate: startTime,
        endDate: endTime,
        projectNames: selectedProjects
      }).then(res => {
        this.tableData = res
        this.loading = false
      })
    }
  },
  watch: {
    selectedProjects: {
      handler () {
        this.getLatestBuilds()
      },
      immediate: false
    },
    selectedDuration: {
      handler () {
        this.getLatestBuilds()
      },
      immediate: false
    }
  },
  mounted () {
    this.getLatestBuilds()
  },
  props: {
    selectedProjects: {
      required: true
    },
    selectedDuration: {
      required: true
    }
  }
}
</script>

<style lang="less">
.build-table {
  width: 100%;
  font-size: 12px;

  .task-link {
    color: @themeColor;
  }

  .task-link,
  .date-info {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &.el-table th,
  td {
    padding: 0 !important;
  }
}
</style>
