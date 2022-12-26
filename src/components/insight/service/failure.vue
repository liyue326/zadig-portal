<template>
  <div style="width: 100%; height: 250px;">
    <el-table :data="serviceData" v-loading="loading" height="250" :show-header="true" class="service-table">
      <el-table-column prop="serviceName" :label="$t(`global.serviceName`)">
        <template slot-scope="scope">
          <router-link :to="`/v1/projects/detail/${scope.row.productName}/services?name=${scope.row.serviceName}`">
            <span class="service-name">{{scope.row.serviceName}}</span>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column prop="totalFailure" :label="$t('dataStatistics.insight.numberOfFailures')">
        <template slot-scope="scope">
          <span>{{scope.row.totalFailure}}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
import { getServiceFailureAPI } from '@api'
export default {
  data () {
    return {
      serviceData: [],
      loading: true
    }
  },
  methods: {
    getServiceFailure () {
      this.loading = true
      const startTime = Math.floor(this.selectedDuration[0] / 1000)
      const endTime = Math.floor(this.selectedDuration[1] / 1000)
      const selectedProjects = this.selectedProjects
      getServiceFailureAPI({
        startDate: startTime,
        endDate: endTime,
        projectNames: selectedProjects
      }).then(res => {
        this.serviceData = res
        this.loading = false
      })
    }
  },
  watch: {
    selectedProjects: {
      handler () {
        this.getServiceFailure()
      },
      immediate: false
    },
    selectedDuration: {
      handler () {
        this.getServiceFailure()
      },
      immediate: false
    }
  },
  mounted () {
    this.getServiceFailure()
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
.service-table {
  width: 100%;
  font-size: 14px;

  .service-name {
    overflow: hidden;
    color: @themeColor;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &.el-table {
    th,
    td {
      padding: 10px;
    }
  }
}
</style>
