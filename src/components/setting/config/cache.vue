<template>
  <div class="config-cache-container">

    <template>
      <el-alert type="info"
                :closable="false">
        <template>
          支持清理系统中的镜像缓存，详情可参考
          <el-link style="font-size: 14px; vertical-align: baseline;"
                   type="primary"
                   :href="`https://docs.koderover.com/zadig/settings/system-settings/#缓存清理`"
                   :underline="false"
                   target="_blank">{{$t(`global.helpDoc`)}}</el-link>
        </template>
      </el-alert>
    </template>
    <div class="cache-container">
      <span class="item">镜像缓存清理</span>
      <el-button size="mini"
                 type="danger"
                 @click="cleanCache"
                 :disabled="cleanStatus && cleanStatus.status === 'cleaning'"
                 plain
                 round>一键清理</el-button>
      <div class="timing">
        <span>定时清理</span>
        <el-switch v-model="cleanStatus.cron_enabled"></el-switch>
        <span v-if="cleanStatus.cron_enabled">
          <el-input style="width: 200px;" size="small" v-model="cleanStatus.cron"  placeholder="Cron 表达式"></el-input>
          <el-button size="mini" type="primary" @click="timingClean" plain round>{{$t(`global.save`)}}</el-button>
        </span>
      </div>
      <template v-if="cleanStatus">
        <div class="desc">
          <span class="title">{{$t('global.status')}} :</span>
          <el-tag size="mini"
                  :type="tagTypeMap[cleanStatus.status]">{{statusMap[cleanStatus.status]}}
          </el-tag>
        </div>
        <div v-if="cleanStatus.status!=='failed'"
             class="desc">
          <span class="title">{{descMap[cleanStatus.status]}}</span>
          <span
                v-if="cleanStatus.status!=='unStart'">{{convertTimestamp(cleanStatus.update_time)}}</span>
        </div>
        <div v-if="cleanStatus.status==='failed'"
             class="desc">
          <el-row>
            <el-col :span="1"> <span class="title">原因：</span></el-col>
            <el-col :span="23">
              <div v-for="(pod,index) in cleanStatus.dind_clean_infos"
                   :key="index">
                <span class="pod-name">{{pod.pod_name}}</span>
                <span class="error-msg">{{pod.error_message}}</span>
              </div>
            </el-col>
          </el-row>
        </div>
        <div v-else-if="cleanStatus.status==='success' && cleanStatus.dind_clean_infos.length > 0"
             class="desc">
          <el-row>
            <el-col :span="1"> <span class="title">信息：</span></el-col>
            <el-col :span="23">
              <div v-for="(pod,index) in cleanStatus.dind_clean_infos"
                   :key="index">
                <span class="pod-name">{{pod.pod_name}}</span>
                <span class="info-msg">{{pod.clean_info}}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </template>
      <el-divider></el-divider>
    </div>
  </div>
</template>
<script>
import { cleanCacheAPI, getCleanCacheStatusAPI, timingCleanAPI } from '@api'
import moment from 'moment'
export default {
  data () {
    return {
      cleanStatus: {
        cron_enabled: false,
        cron: ''
      },
      timerId: null,
      finishedReq: false,
      statusMap: {
        cleaning: '清理中',
        success: '清理完成',
        failed: '清理失败',
        unStart: '未执行过清理'
      },
      tagTypeMap: {
        cleaning: '',
        success: 'success',
        failed: 'danger',
        unStart: 'info'
      },
      descMap: {
        cleaning: '开始时间：',
        success: '完成时间：'
      }
    }
  },
  methods: {
    async getCleanStatus () {
      this.cleanStatus = await getCleanCacheStatusAPI()
      if (this.cleanStatus.status !== 'cleaning') {
        return
      };
      if (!this.finishedReq) {
        this.timerId = setTimeout(this.getCleanStatus, 3000)
      }
    },
    cleanCache () {
      this.$confirm('停止的容器、所有未被容器使用的网络、无用的镜像和构建缓存镜像将被删除，确认清理？', '提示', {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(() => {
        cleanCacheAPI().then(response => {
          this.getCleanStatus()
          this.$message({
            type: 'info',
            message: '正在进行缓存清理'
          })
        }).catch(() => {
          this.$message.error('缓存清理失败')
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消清理'
        })
      })
    },
    timingClean () {
      const { cron, cron_enabled } = this.cleanStatus
      const params = {
        cron, cron_enabled
      }
      if (cron_enabled && !cron) {
        this.$message({
          type: 'warning',
          message: '请填入 Cron 表达式'
        })
        return
      }
      timingCleanAPI(params).then(res => {
        this.$message({
          type: 'success',
          message: '设置成功'
        })
      })
    },
    convertTimestamp (value) {
      return moment.unix(value).format('YYYY-MM-DD HH:mm:ss')
    }
  },
  watch: {
    'cleanStatus.cron_enabled' (newVal, oldVal) {
      if (!newVal) {
        this.timingClean()
      }
    }
  },
  activated () {
    this.getCleanStatus()
  },
  beforeDestroy () {
    this.finishedReq = true
    clearTimeout(this.timerId)
  }
}
</script>

<style lang="less">
.config-cache-container {
  position: relative;
  flex: 1;
  overflow: auto;
  font-size: 13px;

  .cache-container {
    padding-top: 15px;
    padding-bottom: 15px;

    .item {
      color: #303133;
      font-size: 16px;
    }

    .timing {
      height: 46px;
      margin: 16px 0;
      line-height: 46px;
    }

    .desc {
      margin-top: 10px;
    }

    span.title {
      color: #909399;
    }

    span.error-msg {
      color: #ff1949;
    }

    span.info-msg {
      color: #303133;
    }
  }
}
</style>
