<template>
  <div style="width: 100%; height: 100%;">
    <v-chart :options="option" :autoresize="true" />
  </div>
</template>
<script>
import ECharts from 'vue-echarts'
import 'echarts/lib/component/title'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/legend'
import 'echarts/lib/chart/line'
import { getTestDeployAPI } from '@api'
import moment from 'moment'
export default {
  data () {
    return {
      option: {
        legend: {
          data: []
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          show: true,
          type: 'category',
          boundaryGap: true,
          data: [],
          axisTick: {
            show: false
          },
          axisLine: {
            lineStyle: {
              color: '#000000a6'
            }
          }
        },
        yAxis: {
          type: 'value',
          boundaryGap: true,
          axisTick: {
            show: false
          },
          axisLine: {
            show: false,
            lineStyle: {
              color: '#000000a6'
            }
          }
        },
        series: [
          {
            data: [],
            type: 'line',
            smooth: true
          }
        ],
        color: ['#0066ff'],
        tooltip: {
          trigger: 'axis',
          formatter: params => {
            if (params && params.length && params[0]) {
              const { data, marker, name } =
                params && params.length && params[0]
              return `${name}<br/>${marker}${this.$t('dataStatistics.insight.deliveryDeployByWeek')}: ${data.value}`
            }
            return '-'
          }
        }
      }
    }
  },
  methods: {
    getTestDeploy () {
      const startTime = Math.floor(this.selectedDuration[0] / 1000)
      const endTime = Math.floor(this.selectedDuration[1] / 1000)
      const selectedProjects = this.selectedProjects
      getTestDeployAPI({
        startDate: startTime,
        endDate: endTime,
        selectedProjects: selectedProjects
      }).then(res => {
        this.option.xAxis.data = res
          .map(element => {
            return moment(element.day, 'X').format('YYYY-MM-DD')
          })
          .reverse()
        this.option.series[0].data = res
          .map(element => {
            return {
              date: element.day,
              value: element.deliveryDeploy
            }
          })
          .reverse()
      })
    }
  },
  components: {
    'v-chart': ECharts
  },
  watch: {
    selectedDuration: {
      handler () {
        this.getTestDeploy()
      },
      immediate: false
    },
    selectedProjects: {
      handler () {
        this.getTestDeploy()
      },
      immediate: false
    }
  },
  mounted () {
    this.getTestDeploy()
  },
  props: {
    selectedDuration: {
      required: true
    },
    selectedProjects: {
      required: true
    }
  }
}
</script>
<style lang="less">
.echarts {
  width: 100% !important;
  height: 100% !important;
}
</style>
