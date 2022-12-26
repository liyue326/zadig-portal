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
import 'echarts/lib/chart/bar'

export default {
  data () {
    return {
      option: {
        title: {
          text: this.text,
          subtext: this.subtext,
          textStyle: {
            color: '#666666'
          },
          subtextStyle: {
            color: '#999999'
          }
        },
        color: ['#67c23a', '#ff1949'],
        backgroundColor: 'rgba(252,252,252,0)',
        bar: {
          itemStyle: {
            normal: {
              barBorderWidth: 0,
              barBorderColor: '#ccc'
            },
            emphasis: {
              barBorderWidth: 0,
              barBorderColor: '#ccc'
            }
          }
        },
        tooltip: {
          trigger: 'axis'
        },
        // TODO: THIS
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
          data: this.xData,
          axisLine: {
            show: true,
            lineStyle: {
              color: '#cccccc'
            }
          }
        },
        yAxis: {
          axisTick: { show: false },
          axisLine: {
            show: false,
            lineStyle: {
              color: '#000000a6'
            }
          },
          axisLabel: {
            interval: 0
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
            data: this.ySuccessData
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
            data: this.yFailureData
          }
        ]
      }
    }
  },
  components: {
    'v-chart': ECharts
  },
  props: {
    text: {
      required: false,
      type: String,
      default: ''
    },
    subtext: {
      required: false,
      type: String,
      default: ''
    },
    xData: {
      required: true,
      type: Array,
      default () {
        return []
      }
    },
    ySuccessData: {
      required: true,
      type: Array,
      default () {
        return []
      }
    },
    yFailureData: {
      required: true,
      type: Array,
      default () {
        return []
      }
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
