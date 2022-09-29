<template>
  <div class="job-k8s-deploy">
    <el-form :label-width="formLabelWidth" :model="job" ref="ruleForm" class="mg-t24 mg-b24">
      <el-form-item label="任务名称" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item label="镜像仓库" prop="spec.docker_registry_id" :rules="{required: true, message: '镜像仓库不能为空', trigger: ['blur','change']}">
        <el-select v-model="job.spec.docker_registry_id" placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="集群" prop="spec.cluster_id" :rules="{ required: true, message: '请选择集群名称', trigger: ['change', 'blur'] }">
        <el-select v-model="job.spec.cluster_id" placeholder="请选择集群名称" size="small" style="width: 220px;" @change="getNamespaceList">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="命名空间" prop="spec.namespace" :rules="{required: true, message: '命名空间不能为空', trigger: ['blur','change']}">
        <el-select v-model="job.spec.namespace" filterable placeholder="请选择" size="small" style="width: 220px;" @change="getWorkloadList">
          <el-option v-for="item in namespaceList" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="容器" prop="spec.targets"  :required="job.spec.source && job.spec.source !== 'runtime'" >
        <el-select v-model="job.spec.targets" placeholder="请选择" size="small" style="width: 220px;" filterable multiple value-key="target">
          <el-option v-for="item in workloadList" :key="item.target" :label="item.target" :value="item"></el-option>
        </el-select>
        <EnvTypeSelect v-model="job.spec.source" isRuntime isFixed style="display: inline-block;" />
      </el-form-item>
      <el-form-item label="服务状态检测" class="status-check">
        <span slot="label">
          容器状态检测
          <el-tooltip effect="dark" content="开启后，部署任务会轮询容器运行状态，待容器正常运行，任务状态才为成功。" placement="top">
            <i class="el-icon-question" style="cursor: pointer;"></i>
          </el-tooltip>
        </span>
        <el-form-item prop="spec.skip_check_run_status" class="form-item" :rules="{required: false}">
          <el-switch v-model="job.spec.skip_check_run_status" :active-value="false" :inactive-value="true" active-color="#0066ff"></el-switch>
        </el-form-item>
      </el-form-item>
      <el-form-item label="超时时间">
        <el-input-number size="mini" :min="1" v-model="job.spec.timeout"></el-input-number>
        <span>分钟</span>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {
  getRegistryWhenBuildAPI,
  getClusterListAPI,
  getNamespaceListAPI,
  getWorkloadListAPI
} from '@api'
import EnvTypeSelect from '../envTypeSelect.vue'
import { validateJobName } from '../../config.js'

export default {
  name: 'JobK8sDeploy',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    job: {
      type: Object,
      default: () => ({})
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    },
    globalEnv: {
      type: Array,
      default: () => []
    },
    originServiceAndBuilds: {
      type: Array,
      default: () => []
    }
  },
  components: {
    EnvTypeSelect
  },
  data () {
    return {
      validateJobName,
      formLabelWidth: '90px',
      namespaceList: [],
      workloadList: [],
      dockerList: [],
      clusters: []
    }
  },
  created () {
    this.getClusterList()
    this.getRegistryWhenBuild()
  },
  methods: {
    getRegistryWhenBuild () {
      getRegistryWhenBuildAPI().then(res => {
        this.dockerList = res
      })
    },
    getClusterList () {
      return getClusterListAPI().then(res => {
        this.clusters = res.filter(element => element.status === 'normal')
        this.getNamespaceList()
      })
    },
    getNamespaceList () {
      if (this.job.spec.cluster_id) {
        return getNamespaceListAPI(this.job.spec.cluster_id).then(res => {
          this.namespaceList = res
          this.getWorkloadList()
        })
      }
    },
    getWorkloadList () {
      if (this.job.spec.cluster_id) {
        return getWorkloadListAPI(
          this.job.spec.cluster_id,
          this.job.spec.namespace
        ).then(res => {
          this.workloadList = res.map(item => {
            const obj = {
              target: item,
              image: ''
            }
            return obj
          })
        })
      }
    },
    getData () {
      this.job.spec.targets = this.job.spec.targets.map(item => {
        const obj = {
          target: item.target || item,
          image: ''
        }
        return obj
      })
      return this.job
    },
    validate () {
      return this.$refs.ruleForm.validate()
    }
  }
}
</script>
<style lang="less" scoped>
.job-k8s-deploy {
  .form-item {
    display: inline-block;
    width: 220px;
  }

  .status-check {
    /deep/ .el-form-item__label {
      line-height: 20px;
    }
  }
}
</style>
