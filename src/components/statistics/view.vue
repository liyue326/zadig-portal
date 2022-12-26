<template>
  <div class="system-statistics-container">
    <section class="overview">
      <div>
        <h3>{{$t('dataStatistics.overview.overview')}}</h3>
        <el-row class="number-container">
          <el-col class="container-block" :span="4">
            <div>
              <h2>
                <ICountUp :delay="delay" :endVal="overview.cluster_count" class="counter-number" :options="options" />
              </h2>
              <p>{{$t('dataStatistics.overview.clustersUnit')}}</p>
              <span>
                <i class="icon iconfont iconjiqun"></i> {{$t('dataStatistics.overview.clusters')}}
              </span>
            </div>
          </el-col>
          <el-col class="container-block" :span="4">
            <div>
              <h2>
                <ICountUp :delay="delay" :endVal="overview.project_count" class="counter-number" :options="options" />
              </h2>
              <p>{{$t('dataStatistics.overview.projectsUnit')}}</p>
              <span>
                <i class="icon iconfont iconxiangmuloading"></i> {{$t('dataStatistics.overview.projects')}}
              </span>
            </div>
          </el-col>
          <el-col class="container-block" :span="4">
            <div>
              <h2>
                <ICountUp :delay="delay" :endVal="overview.service_count" class="counter-number" :options="options" />
              </h2>
              <p>{{$t('dataStatistics.overview.servicesUnit')}}</p>
              <span>
                <i class="icon iconfont iconvery-service"></i> {{$t('dataStatistics.overview.services')}}
              </span>
            </div>
          </el-col>
          <el-col class="container-block" :span="4">
            <div>
              <h2>
                <ICountUp :delay="delay" :endVal="overview.workflow_count" class="counter-number" :options="options" />
              </h2>
              <p>{{$t('dataStatistics.overview.workflowsUnit')}}</p>
              <span>
                <i class="icon iconfont icongongzuoliucheng"></i> {{$t('dataStatistics.overview.workflows')}}
              </span>
            </div>
          </el-col>
          <el-col class="container-block" :span="4">
            <div>
              <h2>
                <ICountUp :delay="delay" :endVal="overview.env_count" class="counter-number" :options="options" />
              </h2>
              <p>{{$t('dataStatistics.overview.environmentsUnit')}}</p>
              <span>
                <i class="icon iconfont iconvery-environ"></i> {{$t('dataStatistics.overview.environments')}}
              </span>
            </div>
          </el-col>
          <el-col class="container-block" :span="4">
            <div>
              <h2>
                <ICountUp :delay="delay" :endVal="overview.artifact_count" class="counter-number" :options="options" />
              </h2>
              <p>{{$t('dataStatistics.overview.artifactsUnit')}}</p>
              <span>
                <i class="icon iconfont iconvery-deli"></i> {{$t('dataStatistics.overview.artifacts')}}
              </span>
            </div>
          </el-col>
        </el-row>
      </div>
    </section>
    <section class="charts-container">
      <div>
        <h3>{{$t('dataStatistics.overview.automationOfProcesses')}}</h3>
        <Build class="build-container" />
        <Deploy class="deploy-container" />
        <Test class="deploy-container" />
      </div>
    </section>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Build from './components/build'
import Deploy from './components/deploy'
import Test from './components/test'
import ICountUp from 'vue-countup-v2'
import { getStatisticsOverviewAPI } from '@api'
export default {
  data () {
    return {
      overview: {
        project_count: 0,
        cluster_count: 0,
        service_count: 0,
        workflow_count: 0,
        env_count: 0,
        artifact_count: 0
      },
      delay: 1000,
      options: {
        useEasing: true,
        useGrouping: true,
        separator: '',
        decimal: '.',
        prefix: '',
        suffix: ''
      }
    }
  },
  methods: {
    async getStatisticsOverview () {
      this.overview = await getStatisticsOverviewAPI()
    }
  },
  components: {
    Build,
    Deploy,
    Test,
    ICountUp
  },
  mounted () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('sidebarMenu.dataOverview'), url: '' }
      ]
    })
    this.getStatisticsOverview()
  }
}
</script>
<style lang="less">
.system-statistics-container {
  height: 100%;
  padding: 22px 24px;
  overflow: auto;
  background: @globalBackgroundColor;

  h3 {
    margin: 0;
    color: #000;
    font-weight: 400;
    font-size: 16px;
    line-height: 22px;
  }

  .charts-container {
    margin-top: 24px;
  }

  .number-container {
    margin-top: 16px;
    background: #fcfcff;
    border: 1px solid #d2d7dc;
    border-radius: 6px;
  }

  .container-block {
    position: relative;
    padding: 15px 20px;
    text-align: center;

    & + ::after {
      position: absolute;
      bottom: 25%;
      left: 0;
      width: 1px;
      height: 50%;
      background: #ccc;
      content: "";
    }

    h2,
    .counter-number {
      display: inline-block;
      padding-right: 0;
      color: #4a4a4a;
      font-weight: 300;
      font-size: 46px;
      line-height: 22px;
      letter-spacing: 0;
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
      font-size: 14px;
      letter-spacing: 0;
    }

    span {
      display: block;
      padding-top: 10px;
      padding-right: 20px;
      color: #888;
      font-size: 14px;
    }

    .icon {
      color: #646566;
    }

    &:last-child {
      border-right: none;
    }
  }
}
</style>
