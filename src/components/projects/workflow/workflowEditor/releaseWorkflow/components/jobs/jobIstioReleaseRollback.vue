<template>
  <div class="job-istio-rollback">
    <el-form :label-width="formLabelWidth" :model="job" ref="ruleForm" label-position="left" class="mg-t24 mg-b24">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item :label="$t(`workflow.cluster`)" prop="spec.cluster_id" :rules="{ required: true, message: '请选择集群名称', trigger: ['change', 'blur'] }">
        <el-select v-model="job.spec.cluster_id" placeholder="请选择集群名称" size="small" style="width: 220px;" @change="getNamespaceList">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`workflow.namespace`)" prop="spec.namespace" :rules="{required: true, message: '命名空间不能为空', trigger: ['blur','change']}">
        <el-select v-model="job.spec.namespace" filterable placeholder="请选择" size="small" style="width: 220px;" @change="getWorkloadList">
          <el-option v-for="(item,index) in namespaceList" :key="index" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`workflow.containerName`)">
        <el-select v-model="job.spec.targets" value-key="workload_name" multiple filterable placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="(item,index) in workloadList" :key="index" :label="`${item.workload_name}/${item.container_name}`" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`global.timeout`)">
        <el-input-number style="width: 220px;" size="mini" :min="1" v-model="job.spec.timeout"></el-input-number>
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
  getNewWorkloadListAPI
} from '@api'
import { validateJobName } from '../../config.js'

export default {
  name: 'JobIstioReleaseRollback',
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
    }
  },
  data () {
    return {
      validateJobName,
      formLabelWidth: '150px',
      namespaceList: [],
      workloadList: [],
      registryList: [],
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
        this.registryList = res
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
      if (this.job.spec.cluster_id && this.job.spec.namespace) {
        getNewWorkloadListAPI(
          this.job.spec.cluster_id,
          this.job.spec.namespace
        ).then(res => {
          this.workloadList = res.map((item) => {
            delete item.workload_type
            return item
          })
        })
      }
    },
    addService () {
      if (this.job.spec.targets.length === 0) {
        this.$refs.serviceRef.validate().then(valid => {
          this.job.spec.targets.push(cloneDeep(this.serviceInfo))
        })
      } else {
        if (this.$refs.serviceRef) {
          this.$refs.serviceRef.validate().then(valid => {
            this.job.spec.targets.push(cloneDeep(this.serviceInfo))
          })
        } else {
          this.$refs.ruleForm.validate().then(valid => {
            this.job.spec.targets.push(cloneDeep(this.serviceInfo))
          })
        }
      }
    },
    getData () {
      return this.job
    },
    validate () {
      return this.$refs.ruleForm.validate()
    }
  }
}
</script>
<style lang="less" scoped>
.job-istio-rollback {
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
