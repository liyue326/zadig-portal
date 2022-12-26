<template>
  <div class="insight-service">
    <el-row class="row-container" :gutter="20">
      <el-col :span="12">
        <div class="chart-wrapper">
          <div class="chart-container">
            <div class="chart-title">
              <span class="head">{{$t('dataStatistics.insight.serviceHealthiness')}}</span>
              <span class="duration">{{getSetTime}}</span>
            </div>
            <Health :selectedDuration="selectedDuration" :selectedProjects="selectedProjects" />
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-wrapper">
          <div class="chart-container">
            <div class="chart-title">
              <span class="head">{{$t('dataStatistics.insight.frequencyOfWeeklyDeployments')}}</span>
              <span class="duration">{{getSetTime}}</span>
            </div>
            <Deploy :selectedDuration="selectedDuration" :selectedProjects="selectedProjects" />
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row class="row-container" :gutter="20">
      <el-col :span="12">
        <div class="chart-wrapper">
          <div class="chart-container">
            <div class="chart-title">
              <span class="head">{{$t('dataStatistics.insight.serviceDeploymentStatistics')}}</span>
              <span class="duration">{{getSetTime}}</span>
            </div>
            <DeploySummary :selectedDuration="selectedDuration" :selectedProjects="selectedProjects" />
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-wrapper">
          <div class="chart-container">
            <div class="chart-title">
              <span class="head">{{$t('dataStatistics.insight.serviceDeploymentFailedStatistics')}}</span>
              <span class="duration">{{getSetTime}}</span>
            </div>
            <ServiceFailure :selectedDuration="selectedDuration" :selectedProjects="selectedProjects" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import moment from 'moment'
import Health from './health.vue'
import Deploy from './deploy.vue'
import ServiceFailure from './failure.vue'
import DeploySummary from './deploySummary.vue'

export default {
  components: {
    Health,
    Deploy,
    ServiceFailure,
    DeploySummary
  },
  props: {
    selectedProjects: {
      required: true
    },
    selectedDuration: {
      required: true
    }
  },
  computed: {
    getSetTime () {
      const start = moment(Math.floor(this.selectedDuration[0] / 1000), 'X').format('YYYY/MM/DD')
      const end = moment(Math.floor(this.selectedDuration[1] / 1000), 'X').format('YYYY/MM/DD')
      return `${start} - ${end}`
    }
  },
  mounted () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('sidebarMenu.dataInsight'), url: '/v1/insight' },
        { title: this.$t('dataStatistics.insight.deployInsight'), url: '' }

      ]
    })
  }
}
</script>
<style lang="less">
@import '~@assets/css/component/insight-charts.less';
</style>
