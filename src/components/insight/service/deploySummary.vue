<template>
  <div style="width: 100%; height: 100%;">
    <v-chart :options="option"
             :autoresize="true" />
  </div>
</template>
<script>
import ECharts from 'vue-echarts'
import 'echarts/lib/component/title'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/legend'
import 'echarts/lib/chart/bar'
import { getServiceDeploySummaryAPI } from '@api'

export default {
  data () {
    return {
      option: {
        color: ['#67c23a', '#ff1949'],
        tooltip: {
          trigger: 'axis'
        },
        // TODO: HELP WITH THIS
        legend: {
          data: [this.$t('workflowTaskStatus.passed'), this.$t('workflowTaskStatus.failed')]
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          show: true,
          type: 'value'

        },
        yAxis: {
          type: 'category',
          data: [],
          axisTick: { show: false },
          axisLine: {
            show: false,
            lineStyle: {
              color: '#000000a6'
            }
          }
        },
        series: [
          {
            name: this.$t('workflowTaskStatus.passed'),
            type: 'bar',
            stack: '总量',
            barMaxWidth: 45,
            label: {
              normal: {
                show: false,
                position: 'insideRight'
              }
            },
            data: []
          },
          {
            name: this.$t('workflowTaskStatus.failed'),
            type: 'bar',
            stack: '总量',
            barMaxWidth: 45,
            label: {
              normal: {
                show: false,
                position: 'insideRight'
              }
            },
            data: []
          }
        ]
      }

    }
  },
  methods: {
    getServiceDeploySummary () {
      const startTime = Math.floor(this.selectedDuration[0] / 1000)
      const endTime = Math.floor(this.selectedDuration[1] / 1000)
      const selectedProjects = this.selectedProjects
      getServiceDeploySummaryAPI({ startDate: startTime, endDate: endTime, projectNames: selectedProjects }).then((res) => {
        this.option.yAxis.data = res.map((element, index) => {
          return element.serviceName
        })
        this.option.series[0].data = res.map(element => {
          if (element.totalSuccess) {
            return element.totalSuccess
          } else {
            return ''
          }
        })
        this.option.series[1].data = res.map(element => {
          if (element.totalFailure) {
            return element.totalFailure
          } else {
            return ''
          }
        })
      })
    }
  },
  components: {
    'v-chart': ECharts
  },
  watch: {
    selectedDuration: {
      handler () {
        this.getServiceDeploySummary()
      },
      immediate: false
    },
    selectedProjects: {
      handler () {
        this.getServiceDeploySummary()
      },
      immediate: false
    }

  },
  mounted () {
    this.getServiceDeploySummary()
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
