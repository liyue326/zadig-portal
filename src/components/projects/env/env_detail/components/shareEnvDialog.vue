<template>
  <el-dialog :title="mode ==='enable'?'开启自测模式':'关闭自测模式'" :visible.sync="shareEnvDialogVisible" width="750px" class="share-env-dialog">
    <div v-if="mode === 'enable' " class>
      <span class="title">满足以下两个条件即可开启环境自测模式</span>
      <ul class="requirements">
        <li>
          服务已使用 Tracing
          <span class="desc">无法检测，请自行确保，否则开启后功能不可用</span>
        </li>
        <li>
          环境所在集群已经安装 Istio
          <span class="result">
            <i v-if="checkIstioResult === 'success'" class="success el-icon-circle-check"></i>
            <i v-if="checkIstioResult === 'failed'" class="failed el-icon-circle-close"></i>
            <i v-if="checkIstioLoading" class="el-icon-loading"></i>
          </span>
          <span class="recheck" @click="checkingClusterIstio">重新检测</span>
        </li>
        <li>
          服务调用链检测情况
          <span class="result">
            <i v-if="checkWorkloadsResult === 'success'" class="success el-icon-circle-check"></i>
            <el-tooltip v-if="checkWorkloadsResult === 'failed'" placement="top">
              <div slot="content">
                服务 {{ serviceWithoutWorkloads.join(',') }} 没有 K8s Service，请参考
                <a
                  href="https://docs.koderover.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >文档</a>
                ，确认是否满足自测模式开启条件
              </div>
              <i class="warning el-icon-warning-outline"></i>
            </el-tooltip>
            <i v-if="checkWorkloadsLoading" class="el-icon-loading"></i>
          </span>
          <span class="recheck" @click="checkingWorkloads">重新检测</span>
        </li>
      </ul>
      <div v-if="checkIstioResult === 'failed'">
        <el-alert show-icon :closable="false" type="error">
          <span slot="title">
            环境中未检测到 Istio 组件，通过下述方法使用 istioctl 工具快速安装 Istio，Istio 相关知识请参考
            <a
              href="https://istio.io/latest/docs/setup/install/"
              target="_blank"
              rel="noopener noreferrer"
            >Istio 文档</a>
          </span>
        </el-alert>
        <div class="command">
          istioctl install --set profile=demo -y
          <span
            v-clipboard:copy="`istioctl install --set profile=demo -y`"
            v-clipboard:success="copyCommandSuccess"
            v-clipboard:error="copyCommandError"
            class="el-icon-document-copy copy"
          ></span>
        </div>
      </div>
    </div>
    <div v-if="mode === 'disable'">
      <span class="desc">关闭 {{envName}} 环境的自测模式，子环境会被全部删除，请确认</span>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="shareEnvDialogVisible = false">{{$t(`global.cancel`)}}</el-button>
      <el-button
        v-if="mode === 'enable'"
        size="small"
        :disabled="checkIstioResult===''|| checkIstioResult==='failed'"
        @click="enableShareEnv"
        type="primary"
      >{{$t('global.confirm')}}</el-button>
      <el-button v-else-if="mode === 'disable'" @click="disableShareEnv" size="small" type="primary">{{$t('global.confirm')}}</el-button>
    </span>
  </el-dialog>
</template>
<script>
import {
  checkingClusterIstioAPI,
  checkingK8sServiceWorkloadsAPI,
  enableShareEnvAPI,
  disableShareEnvAPI
} from '@/api'
export default {
  name: 'shareEnvDialog',
  props: {
    projectName: String,
    envName: String,
    clusterId: String,
    mode: {
      type: String,
      default: 'enable'
    }
  },
  data () {
    return {
      shareEnvDialogVisible: false,
      checkIstioLoading: false,
      checkWorkloadsLoading: false,
      checkIstioResult: '',
      checkWorkloadsResult: '',
      serviceWithoutWorkloads: []
    }
  },
  methods: {
    openDialog () {
      this.shareEnvDialogVisible = true
      this.checkingClusterIstio()
      this.checkingWorkloads()
    },
    closeDialog () {
      this.shareEnvDialogVisible = true
    },
    async checkingClusterIstio () {
      this.checkIstioLoading = true
      this.checkIstioResult = ''
      const clusterId = this.clusterId
      const result = await checkingClusterIstioAPI(clusterId).catch(err => {
        this.checkIstioLoading = false
        console.log(err)
      })
      this.checkIstioLoading = false
      if (result) {
        this.checkIstioResult = 'success'
      } else {
        this.checkIstioResult = 'failed'
      }
    },
    async checkingWorkloads () {
      this.checkWorkloadsLoading = true
      this.serviceWithoutWorkloads = []
      this.checkWorkloadsResult = ''
      const projectName = this.projectName
      const envName = this.envName
      const result = await checkingK8sServiceWorkloadsAPI(
        envName,
        projectName
      ).catch(err => {
        this.checkWorkloadsLoading = false
        this.serviceWithoutWorkloads = []
        console.log(err)
      })
      this.checkWorkloadsLoading = false
      if (result && result.length === 0) {
        this.checkWorkloadsResult = 'success'
      } else {
        this.checkWorkloadsResult = 'failed'
        this.serviceWithoutWorkloads = result.map(item => item.split('/')[0])
      }
    },
    async enableShareEnv () {
      const projectName = this.projectName
      const envName = this.envName
      const res = await enableShareEnvAPI(envName, projectName).catch(err => {
        console.log(err)
        this.shareEnvDialogVisible = false
      })
      if (res) {
        this.$message({
          type: 'success',
          message: '自测模式开启成功'
        })
        this.$emit('statusChange', 'enable')
        this.shareEnvDialogVisible = false
      }
    },
    async disableShareEnv () {
      const projectName = this.projectName
      const envName = this.envName
      const res = await disableShareEnvAPI(envName, projectName).catch(err => {
        this.shareEnvDialogVisible = false
        console.log(err)
      })
      if (res) {
        this.$message({
          type: 'success',
          message: '自测模式关闭成功'
        })
        this.$emit('statusChange', 'disable')
        this.shareEnvDialogVisible = false
      }
    },
    copyCommandSuccess (event) {
      this.$message({
        message: '命令已成功复制到剪贴板',
        type: 'success'
      })
    },
    copyCommandError (event) {
      this.$message({
        message: '命令复制失败',
        type: 'error'
      })
    }
  }
}
</script>

<style lang="less" scoped>
.share-env-dialog {
  /deep/ .el-dialog__header {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #e4e4e4;
  }

  /deep/.el-dialog__body {
    padding: 30px 40px;

    .el-alert {
      padding: 8px 8px;
    }

    .title {
      color: #000;
      font-weight: 400;
      font-size: 18px;
    }

    .requirements {
      margin-top: 20px;
      margin-bottom: 20px;

      li {
        margin-bottom: 10px;
        list-style: inside;

        .result {
          font-size: 18px;

          .success {
            color: #67c23a;
          }

          .failed {
            color: #f56c6c;
          }

          .warning {
            color: #e6a23c;
          }
        }

        .recheck {
          display: inline-block;
          margin-left: 12px;
          color: @themeColor;
          font-size: 13px;
          cursor: pointer;

          &:hover {
            color: #3385ff;
          }
        }

        .desc {
          color: #999;
          font-size: 12px;
        }
      }
    }

    .command {
      margin-top: 5px;
      padding: 5px 10px;
      font-size: 16px;
      background: #f5f7fa;
      border-radius: 3px;

      .copy {
        color: @themeColor;
        cursor: pointer;
      }
    }
  }
}
</style>
