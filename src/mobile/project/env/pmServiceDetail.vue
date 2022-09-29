<template>
  <div class="mobile-service-pm-detail">
    <van-nav-bar left-arrow fixed @click-left="mobileGoback">
      <template #title>
        <span>{{`${serviceName}`}}</span>
      </template>
    </van-nav-bar>
    <div class="service-info">
      <van-row>
        <van-col span="24">
          <div class="mobile-block">
            <h2 class="mobile-block-title">服务名称</h2>
            <div class="mobile-block-desc">
              <span>{{`${serviceName}`}}</span>
            </div>
          </div>
        </van-col>
      </van-row>
    </div>
    <van-divider content-position="left">服务状态</van-divider>
    <div class="container-info">
      <van-collapse v-model="activeContainers">
        <van-collapse-item v-for="(item,index) in envStatus" :key="index" :name="index">
          <template #title>
            <span>{{item.address}}</span>
          </template>
          <template #value>
            <span>{{item.pm_info.name}}</span>
          </template>
          <template #default>
            <div class="info-body pod-container">
              <div class="pod-info">
                <van-row v-if="item.pm_info" class="pod-row" ref="pod-row">
                  <van-col :span="24">
                    <span class="title">主机标签：</span>
                    <span class="content">{{item.pm_info.label}}</span>
                  </van-col>
                </van-row>
                <van-row>
                  <van-col :span="24">
                    <span class="title">状态：</span>
                    <span class="health-check" :class="statusColorMap[item.status]">{{statusTranslation[item.status]}}</span>
                  </van-col>
                </van-row>
                <van-row>
                  <van-col :span="24">
                    <span class="title">探活配置：</span>
                    <div v-for="item,index in currentService.health_checks" :key="index">
                      <span v-if="item.port && item.protocol">{{`${item.protocol}:${item.port}`}}</span>
                      <span v-else-if="item.protocol">{{`${item.protocol}`}}</span>
                      <span v-if="item.path">{{`${item.path}`}}</span>
                    </div>
                  </van-col>
                </van-row>
                <van-row>
                  <!-- <van-col :span="24" class="op-buttons">
                    <van-button plain size="small" type="info">登录</van-button>
                  </van-col>-->
                </van-row>
              </div>
            </div>
          </template>
        </van-collapse-item>
      </van-collapse>
    </div>
    <van-popup v-model="eventsModal.visible" closeable close-icon="close" round position="bottom" :style="{ height: '40%' }">
      <van-empty v-if="eventsModal.data.length === 0" description="暂时没有事件" />
      <el-table :data="eventsModal.data" v-else>
        <el-table-column prop="message" label></el-table-column>
        <el-table-column prop="reason" width="80" label></el-table-column>
      </el-table>
    </van-popup>
  </div>
</template>
<script>
import {
  Col,
  Collapse,
  CollapseItem,
  Row,
  NavBar,
  Loading,
  Button,
  Divider,
  Popup
} from 'vant'
import { serviceTemplateAPI } from '@api'
import { sortBy } from 'lodash'
export default {
  components: {
    [NavBar.name]: NavBar,
    [Loading.name]: Loading,
    [Button.name]: Button,
    [Col.name]: Col,
    [Row.name]: Row,
    [Divider.name]: Divider,
    [Collapse.name]: Collapse,
    [CollapseItem.name]: CollapseItem,
    [Popup.name]: Popup
  },
  data () {
    return {
      currentService: {},
      envStatus: [],
      statusColorMap: {
        Running: 'green',
        Error: 'red'
      },
      statusTranslation: {
        Running: '健康',
        Error: '不健康'
      },
      activeContainers: [],
      eventsModal: {
        visible: false,
        name: '',
        data: []
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    originProjectName () {
      return this.$route.query.originProjectName
    },
    serviceName () {
      return this.$route.params.service_name
    },
    envName () {
      return this.$route.params.env_name
    }
  },
  methods: {
    fetchServiceData () {
      const projectName = this.projectName
      const serviceName = this.serviceName
      const envName = this.envName
      serviceTemplateAPI(serviceName, 'pm', projectName).then(res => {
        this.currentService = res
        if (res.env_statuses) {
          this.envStatus = sortBy(
            res.env_statuses.filter(element => {
              return element.env_name === envName
            }),
            'host_id'
          )
        }
      })
    }
  },
  mounted () {
    this.fetchServiceData()
  }
}
</script>
<style lang="less">
.mobile-service-pm-detail {
  padding-top: 46px;
  padding-bottom: 50px;

  .container-info {
    margin-top: 20px;

    .health-check {
      &.green {
        color: @success;
      }

      &.red {
        color: #ff1949;
      }
    }

    .van-collapse {
      .van-collapse-item {
        .van-collapse-item__wrapper {
          .van-collapse-item__content {
            .pod-container {
              .title {
                color: #7a8599;
                font-size: 14px;
              }

              .content {
                color: #4a4a4a;
              }

              .pod-info {
                .container-row {
                  margin-bottom: 10px;
                  padding: 4px 4px;
                  border: 1px solid #ccc;
                  border-radius: 4px;

                  &:last-child {
                    margin-bottom: 0;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  .pod-row {
    position: relative;
  }

  .op-buttons {
    margin-top: 10px;
  }
}
</style>
