<template>
  <div class="auto-deploy">
    <span class="title">{{$t('dataStatistics.overview.deployAutomation')}}</span>
    <div class="chart-container">
      <el-row>
        <el-col :span="14">
          <div class="chart">
            <BarChart v-if="xData.length" :subtext="subText" :xData="xData" :ySuccessData="ySuccessData" :yFailureData="yFailureData" />
          </div>
        </el-col>
        <el-col :span="10">
          <div class="number">
            <el-row :gutter="0" class="auto-deploy-number-container">
              <el-col class="auto-deploy-container-block" :span="12">
                <div>
                  <h2>
                    <ICountUp :delay="delay" :endVal="total" class="counter-number" :options="options" />
                  </h2>
                  <span class="desc">{{$t('dataStatistics.overview.totalDeploys')}}</span>
                </div>
              </el-col>
              <el-col class="auto-deploy-container-block" :span="12">
                <div>
                  <h2 v-if="total !==0">
                    <ICountUp
                      :delay="delay"
                      :endVal="successRate"
                      class="counter-number"
                      :class="checkRateColor(successRate)"
                      :options="percentageOptions"
                    />
                  </h2>
                  <h2 v-else>N/A</h2>
                  <span class="desc">{{$t('dataStatistics.overview.successRate')}}</span>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>/
<script>
import BarChart from '../common/barChart.vue'
import ICountUp from 'vue-countup-v2'
import { getDeployStatisticsAPI } from '@api'
import { ceil } from 'lodash'
export default {
  data () {
    return {
      xData: [],
      ySuccessData: [],
      yFailureData: [],
      subText: this.$t('dataStatistics.overview.recentDeploys'),
      total: 0,
      success: 0,
      successRate: 0,
      delay: 1000,
      percentageOptions: {
        useEasing: true,
        useGrouping: true,
        separator: '',
        decimal: '.',
        prefix: '',
        decimalPlaces: 2,
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
    async getDeployStatistics () {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      const startTime = Math.floor(start.getTime() / 1000)
      const endTime = Math.floor(end.getTime() / 1000)
      const { data, total, success } = await getDeployStatisticsAPI(startTime, endTime)
      this.total = total
      this.success = success
      this.successRate = ceil(success / total * 100)
      this.xData = data.map(da => da.date)
      this.ySuccessData = data.map(da => da.success)
      this.yFailureData = data.map(da => da.failure)
    }
  },
  components: {
    BarChart,
    ICountUp
  },
  mounted () {
    this.getDeployStatistics()
  }
}
</script>
<style lang="less">
.auto-deploy {
  margin: 8px 0;

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

  .chart-container {
    height: 142px;
    background: #fcfcff;
    border: 1px solid #d2d7dc;
    border-radius: 6px;

    .chart {
      width: 100%;
      height: 142px;
    }

    .number {
      .auto-deploy-container-block {
        padding: 40px 0;
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
}
</style>
