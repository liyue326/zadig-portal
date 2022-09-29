<template>
  <div class="mobile-service-k8s-detail">
    <van-nav-bar left-arrow fixed @click-left="mobileGoback">
      <template #title>
        <span>{{`${serviceName}`}}</span>
      </template>
    </van-nav-bar>
    <van-divider content-position="left">基本信息</van-divider>
    <div class="service-info">
      <van-row>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">外网访问</h2>
            <div class="mobile-block-desc">
              <template v-if="allHosts.length > 0">
                <div v-for="host of allHosts" :key="host.host">
                  <a :href="`http://${host.host}`" class="host" target="_blank">{{ host.host }}</a>
                </div>
              </template>
              <div v-else>无</div>
            </div>
          </div>
        </van-col>
        <van-col span="12">
          <div class="mobile-block">
            <h2 class="mobile-block-title">内网访问</h2>
            <div class="mobile-block-desc">
              <template v-if="allEndpoints.length > 0">
                <div v-for="(ep,index) in allEndpoints" :key="index">
                  <span>{{ `${ep.service_name}:${ep.service_port}` }}</span>
                  <el-popover v-if="index===0" placement="bottom" popper-class="ns-pop" trigger="hover">
                    <span class="title">同 NS 访问：</span>
                    <div v-for="(sameNs,indexSame) in allEndpoints" :key="indexSame+'same'">
                      <span class="addr">{{ `${sameNs.service_name}:${sameNs.service_port}` }}</span>
                      <span
                        v-clipboard:copy="`${sameNs.service_name}:${sameNs.service_port}`"
                        v-clipboard:success="copyCommandSuccess"
                        v-clipboard:error="copyCommandError"
                        class="copy-btn el-icon-copy-document"
                      ></span>
                    </div>
                    <span class="title">跨 NS 访问：</span>
                    <div v-for="(crossNs,indexCross) in allEndpoints" :key="indexCross+'cross'">
                      <span class="addr">{{ `${crossNs.service_name}.${namespace}:${crossNs.service_port}` }}</span>
                      <span
                        v-clipboard:copy="`${crossNs.service_name}.${namespace}:${crossNs.service_port}`"
                        v-clipboard:success="copyCommandSuccess"
                        v-clipboard:error="copyCommandError"
                        class="copy-btn el-icon-copy-document"
                      ></span>
                    </div>
                    <span slot="reference">
                      <i class="show-more el-icon-more"></i>
                    </span>
                  </el-popover>
                </div>
              </template>
              <div v-else>无</div>
            </div>
          </div>
        </van-col>
      </van-row>
    </div>
    <van-divider content-position="left">服务实例</van-divider>
    <div class="container-info">
      <van-collapse v-model="activeContainers">
        <van-collapse-item v-for="(item,index) in currentService.scales" :key="index" :name="index">
          <template #title>
            <div>
              <van-row>
                <van-col :span="8">{{item.name}}</van-col>
                <van-col :span="16">
                  <div v-for="(img,img_index) of item.images" :key="img_index">{{splitImg(img.image) }}</div>
                </van-col>
              </van-row>
            </div>
          </template>
          <template #default>
            <div>
              <div v-if="activePod[index]" class="info-body pod-container">
                <span
                  v-for="(pod,pod_index) of item.pods"
                  :key="pod_index"
                  @click="selectPod(pod,index)"
                  :ref="pod.name"
                  :class="{pod:true, [pod.__color]:true, active: pod===activePod[index] }"
                ></span>
                <div v-if="activePod[index].name" class="pod-info">
                  <van-row :class="['pod-row', activePod[index].__color]" ref="pod-row">
                    <van-col :span="24">
                      <span class="title">实例名称：</span>
                      <span class="content">{{ activePod[index].name }}</span>
                    </van-col>
                  </van-row>
                  <van-row>
                    <van-col :span="24">
                      <span class="title">运行时长：</span>
                      <span class="content">{{ activePod[index].age }}</span>
                    </van-col>
                  </van-row>
                  <van-row>
                    <van-col :span="24">
                      <span class="title">实例 IP：</span>
                      <span class="content">{{ activePod[index].ip }}</span>
                    </van-col>
                  </van-row>
                  <van-row>
                    <van-col :span="24">
                      <span class="title">节点信息：</span>
                      <span class="content">{{ activePod[index].host_ip }}( {{activePod[index].node_name}} )</span>
                    </van-col>
                  </van-row>
                  <van-row>
                    <van-col :span="24">
                      <span class="title">健康探测：</span>
                      <span
                        class="content"
                        :style="{ color: activePod[index].containers_ready ? '#4a4a4a' : 'red' }"
                      >{{ activePod[index].containers_ready ? 'ready' : 'not ready' }}</span>
                      <el-tooltip effect="dark" :content="activePod[index].containers_message" placement="top">
                        <i
                          v-show="!activePod[index].containers_ready"
                          class="el-icon-warning-outline"
                          style="color: red; vertical-align: middle; cursor: pointer;"
                        ></i>
                      </el-tooltip>
                    </van-col>
                  </van-row>
                  <van-row
                    v-for="container of activePod[index].containers"
                    :key="container.name"
                    :class="['container-row', container.__color]"
                  >
                    <div>
                      <span class="title">容器名称：</span>
                      <span class="content">{{ container.name }}</span>
                    </div>
                    <div>
                      <span class="title">当前镜像：</span>
                      <span class="content">{{ container.imageShort }}</span>
                    </div>
                    <div v-if="container.message">
                      <span class="title">错误信息：</span>
                      <span class="content">{{ container.message }}</span>
                    </div>
                    <div>
                      <span class="title">状态：</span>
                      <span class="content">{{ container.status }}</span>
                      <el-tooltip effect="dark" content="未通过健康探测" placement="top">
                        <i
                          v-show="!container.ready"
                          class="el-icon-warning-outline"
                          style="color: red; vertical-align: middle; cursor: pointer;"
                        ></i>
                      </el-tooltip>
                    </div>
                    <div v-if="container.startedAtReadable">
                      <span class="title">启动时间：</span>
                      <span class="content">{{ container.startedAtReadable }}</span>
                    </div>
                    <van-button plain size="mini" type="info" @click="openLog(activePod[index].name,container.name)">实时日志</van-button>
                  </van-row>
                  <van-row type="flex" justify="end">
                    <van-col :span="24" class="op-buttons">
                      <van-button plain size="small" @click="showPodEvents(activePod[index])" type="info">查看事件</van-button>
                    </van-col>
                  </van-row>
                </div>
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
    <van-popup v-model="containerLogModal.visible" closeable close-icon="close" round position="bottom" >
      <MobileContainerLog
        :closed="!containerLogModal.visible"
        :visible="containerLogModal.visible"
        :id="containerLogModal.id"
        :projectName="projectName"
        :envName="envName"
        :podName="containerLogModal.podName"
        :containerName="containerLogModal.containerName"
      />
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
  Tag,
  Loading,
  Button,
  Notify,
  Divider,
  Popup,
  Empty
} from 'vant'
import MobileContainerLog from './common/mobileContainerLog.vue'
import { podEventAPI, getServiceInfo } from '@api'
import moment from 'moment'
export default {
  components: {
    [NavBar.name]: NavBar,
    [Tag.name]: Tag,
    [Loading.name]: Loading,
    [Button.name]: Button,
    [Notify.name]: Notify,
    [Col.name]: Col,
    [Row.name]: Row,
    [Divider.name]: Divider,
    [Collapse.name]: Collapse,
    [CollapseItem.name]: CollapseItem,
    [Popup.name]: Popup,
    [Empty.name]: Empty,
    MobileContainerLog
  },
  data () {
    return {
      currentService: {
        scales: [],
        ingress: [],
        pods: [],
        service_name: '',
        service_endpoints: [],
        expands: []
      },
      activePod: {},
      statusColorMap: {
        running: 'green',
        pending: 'yellow',
        failed: 'red',
        unstable: 'red',
        unknown: 'purple',
        terminating: 'gray'
      },
      activeContainers: [],
      activeHelmNames: [],
      eventsModal: {
        visible: false,
        name: '',
        data: []
      },
      containerLogModal: {
        id: '',
        podName: '',
        containerName: '',
        visible: false,
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
    },
    workLoadType () {
      return this.$route.query.workLoadType
    },
    namespace () {
      return this.$route.query.namespace
    },
    isProd () {
      return this.$route.query.isProd === 'true'
    },
    allHosts () {
      if (this.currentService.ingress) {
        return this.currentService.ingress.reduce(
          (carry, ing) => carry.concat(ing.host_info),
          []
        )
      } else {
        return []
      }
    },
    allEndpoints () {
      if (this.currentService.service_endpoints) {
        return this.currentService.service_endpoints.reduce((carry, point) => {
          if (point.endpoints) {
            return carry.concat(point.endpoints)
          }
          return carry
        }, [])
      } else {
        return []
      }
    }
  },
  methods: {
    copyCommandSuccess (event) {
      Notify({
        type: 'success',
        message: '地址已成功复制到剪贴板'
      })
    },
    copyCommandError (event) {
      Notify({
        type: 'danger',
        message: '地址复制失败'
      })
    },
    openLog (podName, containerName) {
      this.containerLogModal.visible = true
      this.containerLogModal.id = `${podName}-${containerName}`
      this.containerLogModal.podName = podName
      this.containerLogModal.containerName = containerName
    },
    fetchServiceData () {
      const projectName = this.projectName
      const serviceName = this.serviceName
      const workLoadType = this.workLoadType
      const envName = this.envName ? this.envName : ''
      const envType = this.isProd ? 'prod' : ''
      getServiceInfo(
        projectName,
        serviceName,
        envName,
        envType,
        workLoadType
      ).then(res => {
        if (res.scales) {
          if (res.scales.length > 0 && res.scales[0].pods.length > 0) {
            this.$set(this.activePod, 0, res.scales[0].pods[0])
          }
          res.scales.forEach(scale => {
            scale.pods.forEach(pod => {
              pod.status = pod.status.toLowerCase()
              pod.__color = this.statusColorMap[pod.status]
              pod.canOperate = !(
                pod.status in
                {
                  pending: 1,
                  terminating: 1
                }
              )
              pod.containers.forEach(con => {
                con.edit = false
                con.image2Apply = con.image
                con.imageShort = con.image.split('/').pop()
                con.status = con.status.toLowerCase()
                con.__color = this.statusColorMap[con.status]
                con.startedAtReadable = con.started_at
                  ? moment(con.started_at, 'X').format('YYYY-MM-DD HH:mm:ss')
                  : ''
              })
            })
          })
        } else {
          res.scales = []
        }
        this.currentService = res
      })
    },
    selectPod (target, index) {
      this.$set(this.activePod, index, target)
      // https://stackoverflow.com/questions/5041494
      // const sheet = document.styleSheets[0]
      // const len = sheet.cssRules.length
      // sheet.insertRule(`.mobile-service-detail .pod-info .pod-row::before
      //     { left: ${this.$refs[target.name][0].offsetLeft - 13}px!important; }`, len)
      // sheet.insertRule(`.mobile-service-detail .pod-info
      //     { top: ${this.$refs[target.name][0].offsetTop + 30}px!important; }`, len + 1)
    },
    splitImg (img) {
      if (img) {
        if (img.includes('/')) {
          const length = img.split('/').length
          return img.split('/')[length - 1]
        } else {
          return img
        }
      }
    },
    showPodEvents (pod) {
      const projectName = this.projectName
      const podName = pod.name
      const envName = this.envName ? this.envName : ''
      const envType = this.isProd ? 'prod' : ''
      this.eventsModal.visible = true
      podEventAPI(projectName, podName, envName, envType).then(res => {
        this.eventsModal.data = res.map(row => {
          row.firstSeenReadable = moment(row.first_seen, 'X').format(
            'YYYY-MM-DD HH:mm'
          )
          row.lastSeenReadable = moment(row.last_seen, 'X').format(
            'YYYY-MM-DD HH:mm'
          )
          return row
        })
      })
    }
  },
  mounted () {
    this.fetchServiceData()
  }
}
</script>
<style lang="less">
@normal-blue: #0066ff;
@hover-blue: #66b1ff;

@stat-green: #baf19e;
@stat-green-active: #90d76d;
@stat-green-faint: #dff6d4;

@stat-yellow: #f8e0b4;
@stat-yellow-active: #f1bf5a;
@stat-yellow-faint: #fdf4e3;

@stat-red: #f4c9c9;
@stat-red-active: #f98181;
@stat-red-faint: #f6e7e7;

@stat-purple: #d9c6e7;
@stat-purple-active: #aa70d1;
@stat-purple-faint: #ece7f0;

@stat-gray: #d5e1f4;
@stat-gray-active: #aab0bc;
@stat-gray-faint: #e7edf6;

.mobile-service-k8s-detail {
  padding-top: 46px;
  padding-bottom: 50px;

  .host {
    color: @themeColor;
  }

  .container-info {
    margin-top: 20px;

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

  .pod {
    position: relative;
    display: inline-block;
    width: 24px;
    height: 30px;
    margin-right: 5px;
    border-radius: 1px;
    cursor: pointer;

    &.green {
      background-color: @stat-green;

      &.active {
        background-color: @stat-green-active;
      }
    }

    &.yellow {
      background-color: @stat-yellow;

      &.active {
        background-color: @stat-yellow-active;
      }
    }

    &.red {
      background-color: @stat-red;

      &.active {
        background-color: @stat-red-active;
      }
    }

    &.purple {
      background-color: @stat-purple;

      &.active {
        background-color: @stat-purple-active;
      }
    }

    &.gray {
      background-color: @stat-gray;

      &.active {
        background-color: @stat-gray-active;
      }
    }
  }

  .pod-row {
    position: relative;

    &:hover {
      &.green::before {
        border-bottom-color: @stat-green-faint;
      }

      &.yellow::before {
        border-bottom-color: @stat-yellow-faint;
      }

      &.red::before {
        border-bottom-color: @stat-red-faint;
      }

      &.purple::before {
        border-bottom-color: @stat-purple-faint;
      }

      &.gray::before {
        border-bottom-color: @stat-gray-faint;
      }
    }
  }
}
</style>
