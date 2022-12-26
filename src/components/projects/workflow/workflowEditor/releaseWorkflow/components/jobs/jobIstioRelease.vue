<template>
  <div class="job-istio-release">
    <el-form :label-width="formLabelWidth" :model="job" ref="ruleForm" label-position="left" class="mg-t24 mg-b24">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item label="任务类型" prop="spec.first">
        <el-select v-model="job.spec.first" filterable placeholder="请选择" size="small" style="width: 220px;">
          <el-option label="首个 Istio 发布任务" :value="true"></el-option>
          <el-option label="非首个 Istio 发布任务" :value="false"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="!job.spec.first" label="选择首个 Istio 发布任务" prop="spec.from_job" class="select">
        <el-select v-model="job.spec.from_job" placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="(item,index) in allJobList" :key="index" :label="item" :value="item">{{item}}</el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="job.spec.first"
        :label="$t(`status.imageRepo`)"
        prop="spec.registry_id"
        :rules="{required: true, message: '镜像仓库不能为空', trigger: ['blur','change']}"
      >
        <el-select v-model="job.spec.registry_id" filterable placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in registryList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="job.spec.first"
        :label="$t(`workflow.cluster`)"
        prop="spec.cluster_id"
        :rules="{ required: true, message: '请选择集群名称', trigger: ['change', 'blur'] }"
      >
        <el-select v-model="job.spec.cluster_id" placeholder="请选择集群名称" size="small" style="width: 220px;" @change="getNamespaceList">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="job.spec.first"
        :label="$t(`workflow.namespace`)"
        prop="spec.namespace"
        :rules="{required: true, message: '命名空间不能为空', trigger: ['blur','change']}"
      >
        <el-select
          v-model="job.spec.namespace"
          filterable
          placeholder="请选择"
          size="small"
          style="width: 220px;"
          @change="getDeploymentsAndVirtualServices"
        >
          <el-option v-for="(item,index) in namespaceList" :key="index" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`global.timeout`)" prop="spec.timeout">
        <el-input-number style="width: 220px;" size="mini" :min="1" v-model="job.spec.timeout"></el-input-number>
        <span>分钟</span>
      </el-form-item>
      <el-form-item label="新版本副本百分比" prop="spec.replica_percentage">
        <el-input-number style="width: 220px;" size="mini" :min="1" :max="100" v-model="job.spec.replica_percentage"></el-input-number>
      </el-form-item>
      <el-form-item label="新版本流量百分比" prop="spec.weight">
        <el-input-number style="width: 220px;" size="mini" :min="1"  :max="100" v-model="job.spec.weight"></el-input-number>
      </el-form-item>
      <el-form-item v-if="job.spec.first" label="实例列表">
        <div class="service">
          <el-row>
            <el-col :span="4" class="mg-r8">Workload 名称</el-col>
            <el-col :span="4" class="mg-r8">容器名称</el-col>
            <el-col :span="4" class="mg-r8">Virtual Service 名称</el-col>
            <el-col :span="4" class="mg-r8">Virtual Service Host</el-col>
            <el-col :span="4"></el-col>
          </el-row>
          <el-row v-for="(item,index) in job.spec.targets" :key="index" class="mg-b8">
            <el-col :span="4" class="mg-r8">
              <el-form-item
                :prop="'spec.targets.'+index+'.workload_name'"
                :rules="{required: true, message: '请选择', trigger: ['blur','change']}"
              >
                <el-select v-model="job.spec.targets[index].workload_name" placeholder="请选择" size="small" clearable>
                  <el-option v-for="(item,index) in deployments" :key="index" :value="item.name" :label="item.name"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4" class="mg-r8">
              <el-form-item
                :prop="'spec.targets.'+index+'.container_name'"
                :rules="{required: true, message: '请选择', trigger: ['blur','change']}"
              >
                <el-select v-model="item.container_name" placeholder="请选择" size="small" clearable>
                  <el-option v-for="(item,index) in containers[item.workload_name]" :key="index" :value="item.name"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4" class="mg-r8">
              <el-form-item
                :prop="'spec.targets.'+index+'.virtual_service_name'"
                :rules="{required: false, message: '可选填', trigger: ['blur','change']}"
              >
                <el-select v-model="item.virtual_service_name" placeholder="可选填" size="small" allow-create filterable clearable>
                  <el-option v-for="(item,index) in virtualServices" :key="index" :value="item.name" :label="item.name"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4" class="mg-r8">
              <el-form-item :prop="'spec.targets.'+index+'.host'" :rules="{required: true, message: '请选择或者填写', trigger: ['blur','change']}">
                <el-select v-model="item.host" placeholder="请选择或者填写" size="small" allow-create filterable clearable>
                  <el-option
                    v-for="(item,index) in virtualHosts[item.virtual_service_name]"
                    :key="index"
                    :value="item"
                    :label="item"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item>
                <div class="app-operation">
                  <el-button
                    v-if="job.spec.targets.length>1&&!$refs.serviceRef ||job.spec.targets.length>0 &&$refs.serviceRef"
                    @click="deleteService(index)"
                    type="danger"
                    size="mini"
                    icon="el-icon-minus"
                    circle
                    plain
                  ></el-button>
                  <el-button @click="addService()" type="primary" size="mini" icon="el-icon-plus" circle plain></el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="originJob.spec.targets.length===0&&flag">
            <el-form ref="serviceRef" :model="serviceInfo">
              <el-col :span="4" class="mg-r8">
                <el-form-item prop="workload_name" :rules="{required: true, message: '请选择', trigger: ['blur','change']}">
                  <el-select v-model="serviceInfo.workload_name" placeholder="请选择" size="small" clearable>
                    <el-option v-for="(item,index) in deployments" :key="index" :label="item.name" :value="item.name"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4" class="mg-r8">
                <el-form-item prop="container_name" :rules="{required: true, message: '请选择', trigger: ['blur','change']}">
                  <el-select v-model="serviceInfo.container_name" placeholder="请选择" size="small" clearable>
                    <el-option v-for="(item,index) in containers[serviceInfo.workload_name]" :key="index" :value="item.name"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4" class="mg-r8">
                <el-form-item prop="virtual_service_name" :rules="{required: true, message: '请选择', trigger: ['blur','change']}">
                  <el-select v-model="serviceInfo.virtual_service_name" placeholder="请选择" size="small" clearable>
                    <el-option v-for="(item,index) in virtualServices" :key="index" :value="item.name" :label="item.name"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4" class="mg-r8">
                <el-form-item prop="host" :rules="{required: true, message: '请选择', trigger: ['blur','change']}">
                  <el-select v-if="virtualHosts[serviceInfo.virtual_service_name]" v-model="serviceInfo.host" placeholder="请选择" size="small" clearable>
                    <el-option v-for="(item,index) in virtualHosts[serviceInfo.virtual_service_name]" :key="index" :value="item"></el-option>
                  </el-select>
                  <el-input v-else size="small" v-model="serviceInfo.host" placeholder="请输入 Host"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item>
                  <div class="app-operation">
                    <el-button
                      v-if="job.spec.targets.length>0"
                      @click="flag=false"
                      type="danger"
                      size="mini"
                      icon="el-icon-minus"
                      circle
                      plain
                    ></el-button>
                    <el-button @click="addService()" type="primary" size="mini" icon="el-icon-plus" circle plain></el-button>
                  </div>
                </el-form-item>
              </el-col>
            </el-form>
          </el-row>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {
  getRegistryWhenBuildAPI,
  getClusterListAPI,
  getNamespaceListAPI,
  getDeploymentsAPI,
  getIstioVirtualServicesAPI
} from '@api'
import { validateJobName, jobType } from '../../config.js'
import { cloneDeep } from 'lodash'
export default {
  name: 'JobIstioRelease',
  props: {
    projectName: {
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
      formLabelWidth: '180px',
      namespaceList: [],
      registryList: [],
      clusters: [],
      deployments: [],
      containers: {},
      originJob: {},
      virtualServices: [],
      virtualHosts: {},
      flag: true,
      serviceInfo: {
        workload_name: '',
        container_name: '',
        virtual_service_name: '',
        host: ' '
      }
    }
  },
  computed: {
    allJobList () {
      const jobs = []
      this.workflowInfo.stages.forEach(stage => {
        stage.jobs.forEach(job => {
          if (job.type === jobType.istioRelease) {
            jobs.push(job.name)
          }
        })
      })
      jobs.pop()
      return jobs
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
        this.getDeploymentsAndVirtualServices()
      },
      immediate: true
    }
  },
  methods: {
    getData () {
      if (this.$refs.serviceRef) {
        this.job.spec.targets.push(this.serviceInfo)
      }
      return this.job
    },
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
        })
      }
    },
    getIstioVirtualServices () {
      if (this.job.spec.cluster_id && this.job.spec.namespace) {
        return getIstioVirtualServicesAPI(
          this.job.spec.cluster_id,
          this.job.spec.namespace
        ).then(res => {
          this.virtualServices = res
          res.forEach(item => {
            this.$set(this.virtualHosts, item.name, item.hosts)
          })
        })
      }
    },
    getDeployments () {
      if (this.job.spec.cluster_id && this.job.spec.namespace) {
        getDeploymentsAPI(
          this.job.spec.cluster_id,
          this.job.spec.namespace
        ).then(res => {
          this.deployments = res
          res.forEach(item => {
            this.$set(this.containers, item.name, item.containers)
          })
        })
      }
    },
    getDeploymentsAndVirtualServices () {
      this.getDeployments()
      this.getIstioVirtualServices()
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
      setTimeout(() => {
        this.serviceInfo = {
          workload_name: '',
          container_name: '',
          virtual_service_name: '',
          host: ' '
        }
      }, 500)
    },
    deleteService (index) {
      this.job.spec.targets.splice(index, 1)
    },
    validate () {
      return this.$refs.ruleForm.validate()
    }
  },
  created () {
    this.originJob = cloneDeep(this.job)
    this.getClusterList()
    this.getRegistryWhenBuild()
  }
}
</script>
<style lang="less" scoped>
.job-istio-release {
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
