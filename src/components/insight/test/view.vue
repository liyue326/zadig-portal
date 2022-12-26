<template>
  <div class="insight-test">
    <el-row class="row-container" :gutter="20">
      <el-col :span="8">
        <div class="chart-wrapper">
          <div class="chart-container">
            <div class="chart-title">
              <span class="head">{{$t('dataStatistics.insight.testTrend')}}</span>
              <span class="duration">{{getSetTime}}</span>
            </div>
            <Trend :selectedDuration="selectedDuration" :selectedProjects="selectedProjects" />
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-wrapper">
          <div class="chart-container">
            <div class="chart-title">
              <span class="head">{{$t('dataStatistics.insight.testHealthiness')}}</span>
              <span class="duration">{{getSetTime}}</span>
            </div>
            <Health :selectedDuration="selectedDuration" :selectedProjects="selectedProjects" />
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-wrapper">
          <div class="chart-container">
            <div class="chart-title">
              <span class="head">{{$t('dataStatistics.insight.testBenefits')}}</span>
              <span class="duration">{{getSetTime}}</span>
            </div>
            <TestCases :selectedDuration="selectedDuration" :selectedProjects="selectedProjects" />
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row class="row-container" :gutter="20">
      <el-col :span="8">
        <div class="chart-wrapper">
          <div class="chart-container">
            <div class="chart-title">
              <span class="head">{{$t('dataStatistics.insight.averageTestDuration')}}</span>
              <span class="duration">{{getSetTime}}</span>
            </div>
            <AverageTestDuration :selectedDuration="selectedDuration" :selectedProjects="selectedProjects" />
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-wrapper">
          <div class="chart-container">
            <div class="chart-title">
              <span class="head">{{$t('dataStatistics.insight.deliveryDeployByWeek')}}</span>
              <span style="visibility: hidden;" class="duration">{{getSetTime}}</span>
            </div>
            <Deploy :selectedDuration="selectedDuration" :selectedProjects="selectedProjects" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import moment from 'moment'
import Trend from './trend.vue'
import Health from './health.vue'
import AverageTestDuration from './averageDuration.vue'
import TestCases from './testCases.vue'
import Deploy from './deploy.vue'
export default {
  components: {
    Health,
    AverageTestDuration,
    Trend,
    TestCases,
    Deploy
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
      const start = moment(
        Math.floor(this.selectedDuration[0] / 1000),
        'X'
      ).format('YYYY/MM/DD')
      const end = moment(
        Math.floor(this.selectedDuration[1] / 1000),
        'X'
      ).format('YYYY/MM/DD')
      return `${start} - ${end}`
    }
  },
  mounted () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('sidebarMenu.dataInsight'), url: '/v1/insight' },
        { title: this.$t('dataStatistics.insight.testInsight'), url: '' }
      ]
    })
  }
}
</script>
<style lang="less">
@import '~@assets/css/component/insight-charts.less';
</style>
