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
import 'echarts/lib/chart/line'
import { getDaliyBuildsFeqAPI } from '@api'
export default {
  data () {
    return {
      option: {
        color: ['#67c23a', '#ff1949', 'orange', '#ccc'],
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        legend: {
          data: [this.$t('workflowTaskStatus.passed'), this.$t('workflowTaskStatus.failed'), this.$t('workflowTaskStatus.timeout'), this.$t('workflowTaskStatus.cancelled')]
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [
          {
            show: true,
            type: 'category',
            boundaryGap: true,
            data: [],
            axisTick: {
              show: false
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            axisTick: {
              show: false
            },
            axisLine: {
              show: false,
              lineStyle: {
                color: '#000000a6'
              }
            }
          }
        ],
        series: [
          {
            name: this.$t('workflowTaskStatus.passed'),
            type: 'line',
            smooth: true,
            stack: '总量',
            areaStyle: {},
            data: []
          },
          {
            name: this.$t('workflowTaskStatus.failed'),
            type: 'line',
            smooth: true,
            stack: '总量',
            areaStyle: {},
            data: []
          }
        ]
      }

    }
  },
  methods: {
    getDaliyBuildsFeq () {
      const startTime = Math.floor(this.selectedDuration[0] / 1000)
      const endTime = Math.floor(this.selectedDuration[1] / 1000)
      const selectedProjects = this.selectedProjects
      getDaliyBuildsFeqAPI({ startDate: startTime, endDate: endTime, projectNames: selectedProjects }).then((res) => {
        this.option.xAxis[0].data = res.map(element => {
          return element.date
        })
        this.option.series[0].data = res.map(element => {
          return element.success
        })
        this.option.series[1].data = res.map(element => {
          return element.failure
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
        this.getDaliyBuildsFeq()
      },
      immediate: false
    },
    selectedProjects: {
      handler () {
        this.getDaliyBuildsFeq()
      },
      immediate: false
    }
  },
  mounted () {
    this.getDaliyBuildsFeq()
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
