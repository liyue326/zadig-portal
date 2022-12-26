<template>
  <div class="auto-test">
    <span class="title">{{$t('dataStatistics.overview.deployAutomation')}}</span>
    <div class="auto-test-chart-container">
      <el-row :gutter="10">
        <el-col class="number-block" :span="6">
          <div>
            <h2>
              <ICountUp :delay="delay" :endVal="totalCaseCount" class="counter-number" :options="options" />
            </h2>
            <span class="desc">
              <i class="icon iconfont iconvery-testing"></i> {{$t('dataStatistics.overview.totalTestCases')}}
            </span>
          </div>
        </el-col>
        <el-col class="number-block" :span="6">
          <div>
            <h2>
              <ICountUp :delay="delay" :endVal="totalExecCount" class="counter-number" :options="options" />
            </h2>
            <span class="desc">
              <i class="icon iconfont iconzhixing"></i> {{$t('dataStatistics.overview.totalExecutionCount')}}
            </span>
          </div>
        </el-col>
        <el-col class="number-block" :span="6">
          <div>
            <h2 v-if="totalExecCount !==0">
              <ICountUp
                :delay="delay"
                :endVal="successRate"
                class="counter-number"
                :decimals="2"
                :class="checkRateColor(successRate)"
                :options="percentageOptions"
              />
            </h2>
            <h2 v-else>N/A</h2>
            <span class="desc">
              <i class="icon iconfont iconchenggong"></i> {{$t('dataStatistics.overview.successRate')}}
            </span>
          </div>
        </el-col>
        <el-col class="number-block" :span="6">
          <div>
            <h2>
              <ICountUp :delay="delay" :endVal="averageDuration" class="counter-number" :options="options" />
            </h2>
            <span class="desc">
              <i class="icon iconfont iconhaoshi"></i> {{$t('dataStatistics.overview.averageDuration')}}
            </span>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import { getTestStatisticsAPI } from '@api'
import { ceil } from 'lodash'
import ICountUp from 'vue-countup-v2'
export default {
  data () {
    return {
      totalCaseCount: 0,
      totalExecCount: 0,
      successRate: 0,
      averageDuration: 0,
      delay: 1000,
      percentageOptions: {
        useEasing: true,
        useGrouping: true,
        separator: '',
        decimal: '.',
        decimalPlaces: 2,
        prefix: '',
        suffix: '%'
      },
      options: {
        useEasing: true,
        useGrouping: true,
        separator: '',
        decimal: '',
        prefix: '',
        suffix: ''
      }
    }
  },
  methods: {
    checkRateColor (rate) {
      if (rate >= 60) {
        return 'status-good'
      } else if (rate < 60 && rate > 0) {
        return 'status-bad'
      }
    },
    async getTestStatistics () {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      const startTime = Math.floor(start.getTime() / 1000)
      const endTime = Math.floor(end.getTime() / 1000)
      const {
        total_case_count,
        total_exec_count,
        success,
        average_duration
      } = await getTestStatisticsAPI(startTime, endTime)
      this.totalCaseCount = total_case_count
      this.totalExecCount = total_exec_count
      this.successRate = ceil((success / total_exec_count) * 100, 2)
      this.averageDuration = average_duration
    }
  },
  components: {
    ICountUp
  },
  mounted () {
    this.getTestStatistics()
  }
}
</script>
<style lang="less">
.auto-test {
  span {
    font-weight: 300;
  }

  .title {
    color: #4a4a4a;
    font-weight: 300;
    font-size: 14px;
    font-style: normal;
    line-height: 22px;
    letter-spacing: 0;
    text-align: left;
  }

  .auto-test-chart-container {
    height: 142px;
    background: #fcfcff;
    border: 1px solid #d2d7dc;
    border-radius: 6px;

    .number-block {
      padding: 38px 20px;
      text-align: center;

      h2,
      .counter-number {
        display: inline-block;
        color: #333;
        font-weight: 300;
        font-size: 46px;
        line-height: 50px;
        letter-spacing: 0;
      }

      .status-good {
        color: @success;
      }

      .status-bad {
        color: #f5222d;
      }

      .icon {
        color: #646566;
      }

      h2,
      h3,
      h4,
      h5,
      h6,
      p {
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }

      p {
        display: inline-block;
        color: #969799;
        font-size: 25px;
        letter-spacing: 0;
      }

      span.desc {
        display: block;
        color: #888;
        font-size: 14px;
      }
    }
  }
}
</style>
