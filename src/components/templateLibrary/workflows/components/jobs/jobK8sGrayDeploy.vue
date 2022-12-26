<template>
  <div class="job-k8s-deploy">
    <el-form label-width="120px" :model="job" ref="ruleForm" class="mg-t24 mg-b24" label-position="left">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name" >
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item :label="$t(`workflow.grayTaskType`)" prop="spec.docker_registry_id">
        <el-select v-model="job.spec.first" placeholder="请选择" size="small" style="width: 220px;">
          <el-option label="首个灰度任务" :value="true"></el-option>
          <el-option label="非首个灰度任务" :value="false"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="!job.spec.first" label="选择首个灰度任务" prop="spec.docker_registry_id" class="select">
        <el-select v-model="job.spec.from_job" placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="(item,index) in allJobList" :key="index" :label="item" :value="item">{{item}}</el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="job.spec.first"
        :label="$t(`status.imageRepo`)"
        prop="spec.docker_registry_id"
      >
        <el-select v-model="job.spec.docker_registry_id" filterable placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="job.spec.first"
        :label="$t(`workflow.cluster`)"
        prop="spec.cluster_id"
      >
        <el-select v-model="job.spec.cluster_id" placeholder="请选择集群名称" size="small" style="width: 220px;" @change="getNamespaceList">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="job.spec.first"
        :label="$t(`workflow.namespace`)"
        prop="spec.namespace"
      >
        <el-select v-model="job.spec.namespace" filterable placeholder="请选择" size="small" style="width: 220px;" @change="getWorkloadList">
          <el-option v-for="item in namespaceList" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="job.spec.first" :label="$t(`workflow.containerName`)" prop="spec.targets">
        <el-select
          v-model="job.spec.targets"
          placeholder="请选择"
          size="small"
          style="width: 220px;"
          filterable
          multiple
          value-key="workload_name"
        >
          <el-option
            v-for="item in workloadList"
            :key="item.workload_name"
            :label="`${item.container_name}/${item.workload_name}`"
            :value="item"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`workflow.grayPercentage`)" prop="spec.gray_scale">
        <el-input-number size="mini" :min="1" v-model="job.spec.gray_scale"></el-input-number>
      </el-form-item>
      <el-form-item :label="$t(`global.timeout`)" prop="spec.deploy_timeout">
        <el-input-number size="mini" :min="1" v-model="job.spec.deploy_timeout"></el-input-number>
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
import EnvTypeSelect from '../envTypeSelect.vue'
import { validateJobName, jobType } from '../../config.js'

export default {
  name: 'JobK8sDeploy',
  props: {
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
    }
  },
  components: {
    EnvTypeSelect
  },
  data () {
    return {
      validateJobName,
      jobType,
      namespaceList: [],
      workloadList: [],
      dockerList: [],
      clusters: []
    }
  },
  computed: {
    allJobList () {
      const jobs = []
      this.workflowInfo.stages.forEach(stage => {
        stage.jobs.forEach(job => {
          if (job.type === jobType.grayDeploy) {
            jobs.push(job.name)
          }
        })
      })
      jobs.pop()
      return jobs
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
      if (this.job.spec.namespace) {
        return getNewWorkloadListAPI(
          this.job.spec.cluster_id,
          this.job.spec.namespace
        ).then(res => {
          this.workloadList = res
        })
      }
    },
    getData () {
      delete this.job.spec.first
      return this.job
    },
    validate () {
      return this.$refs.ruleForm.validate()
    }
  },
  watch: {
    'job.spec': {
      handler (val) {
        if (!val.from_job) {
          this.$set(this.job.spec, 'first', true)
        } else {
          this.$set(this.job.spec, 'first', false)
        }
        this.getNamespaceList()
      },
      immediate: true
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

  .select {
    /deep/ .el-form-item__label {
      line-height: 20px;
    }
  }
}
</style>
