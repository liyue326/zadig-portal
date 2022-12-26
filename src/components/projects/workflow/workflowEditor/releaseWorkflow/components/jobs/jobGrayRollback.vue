<template>
  <div class="job-gray-rollback">
    <el-form label-width="120px" :model="job" ref="ruleForm" class="mg-t24 mg-b24" label-position="left">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name" >
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>

      <el-form-item :label="$t(`workflow.cluster`)" prop="spec.cluster_id" >
        <el-select v-model="job.spec.cluster_id" placeholder="请选择集群名称" size="small" @change="getNamespaceList" style="width: 220px;">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`workflow.namespace`)" prop="spec.namespace" >
        <el-select v-model="job.spec.namespace" filterable placeholder="请选择" size="small" @change="getDeploymentList" style="width: 220px;">
          <el-option v-for="item in namespaceList" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        label="Deployment 名称"
        prop="spec.targets"
        class="label"
      >
        <el-select v-model="job.spec.targets" filterable multiple placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in deploymentList" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        label="超时时间(分钟)"
        prop="spec.rollback_timeout"
        class="label"
      >
        <el-input v-model="job.spec.rollback_timeout" size="small" style="width: 220px;"></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {
  getClusterListAPI,
  getNamespaceListAPI,
  getDeploymentListAPI
} from '@api'
import EnvTypeSelect from '../envTypeSelect.vue'
import { validateJobName } from '../../config'

export default {
  name: 'JobCanaryDeploy',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    job: {
      type: Object,
      default: () => ({})
    }
  },
  components: {
    EnvTypeSelect
  },
  data () {
    return {
      validateJobName,
      namespaceList: [],
      clusters: [],
      deploymentList: []
    }
  },

  created () {
    this.getClusterList()
    this.job.spec.targets = this.job.spec.targets.map(
      item => item.workload_name
    )
  },
  methods: {
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
          this.getDeploymentList()
        })
      }
    },
    getDeploymentList () {
      const { cluster_id, namespace } = this.job.spec
      if (namespace) {
        getDeploymentListAPI(cluster_id, namespace).then(res => {
          this.deploymentList = res
        })
      }
    },
    getData () {
      this.job.spec.targets = this.job.spec.targets.map(item => {
        const obj = {}
        obj.workload_name = item
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
.job-gray-rollback {
  .form-item {
    display: inline-block;
    width: 220px;
  }

  .label {
    /deep/ .el-form-item__label {
      line-height: 20px;
    }
  }
}
</style>
