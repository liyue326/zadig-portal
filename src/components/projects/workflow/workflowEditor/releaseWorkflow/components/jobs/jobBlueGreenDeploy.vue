<template>
  <div class="job-canary-deploy">
    <el-form label-width="120px" :model="job" ref="ruleForm" class="mg-t24 mg-b24" label-position="left">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item :label="$t(`status.imageRepo`)" prop="spec.docker_registry_id" :rules="{required: true, message: '镜像仓库不能为空', trigger: ['blur','change']}">
        <el-select v-model="job.spec.docker_registry_id" filterable placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`workflow.cluster`)" prop="spec.cluster_id" :rules="{ required: true, message: '请选择集群名称', trigger: ['change', 'blur'] }">
        <el-select v-model="job.spec.cluster_id" placeholder="请选择集群名称" size="small" style="width: 220px;" @change="getNamespaceList">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`workflow.namespace`)" prop="spec.namespace" :rules="{required: true, message: '命名空间不能为空', trigger: ['blur','change']}">
        <el-select
          v-model="job.spec.namespace"
          filterable
          placeholder="请选择"
          size="small"
          style="width: 220px;"
          @change="getCanaryServiceList"
        >
          <el-option v-for="item in namespaceList" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="实例列表">
        <div class="service">
          <el-row>
            <el-col :span="4" class="mg-r8">K8s service 名称</el-col>
            <el-col :span="4" class="mg-r8">容器名称</el-col>
            <el-col :span="4" class="mg-r8">部署超时时间(分钟)</el-col>
            <el-col :span="4"></el-col>
          </el-row>
          <el-row v-for="(item,index) in job.spec.targets" :key="index" class="mg-b8">
            <el-col :span="4" class="mg-r8">
              <el-form-item
                :prop="'spec.targets.'+index+'.k8s_service_name'"
                :rules="{required: true, message: '请选择', trigger: ['blur','change']}"
              >
                <el-select
                  v-model="job.spec.targets[index].k8s_service_name"
                  placeholder="请选择"
                  size="small"
                  @visible-change="filterService($event,index)"
                  @change="handleServiceChange($event,item)"
                >
                  <el-option v-for="(item,index) in canryServiceList" :key="index" :value="item.service_name"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4" class="mg-r8">
              <el-form-item
                :prop="'spec.targets.'+index+'.container_name'"
                :rules="{required: true, message: '请选择', trigger: ['blur','change']}"
              >
                <el-select v-model="item.container_name" placeholder="请选择" size="small">
                  <el-option v-for="(item,index) in item.canryContainerList" :key="index" :value="item"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4" class="mg-r8">
              <el-form-item
                :prop="'spec.targets.'+index+'.deploy_timeout'"
                :rules="{required: true, message: '请输入', trigger: ['blur','change']}"
              >
                <el-input v-model.number="job.spec.targets[index].deploy_timeout" placeholder="请输入部署超时时间" size="small"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item>
                <div class="app-operation">
                  <el-button
                    v-if="job.spec.targets.length>1&&!$refs.serviceRef ||job.spec.targets.length>0 &&$refs.serviceRef"
                    @click="delService(index)"
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
            <el-form ref="serviceRef" label-position="left" :model="serviceInfo">
              <el-col :span="4" class="mg-r8">
                <el-form-item prop="k8s_service_name" :rules="{required: true, message: '请选择', trigger: ['blur','change']}">
                  <el-select v-model="serviceInfo.k8s_service_name" placeholder="请选择" size="small">
                    <el-option v-for="(item,index) in canryServiceList" :key="index" :label="item.service_name" :value="item.service_name"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4" class="mg-r8">
                <el-form-item prop="container_name" :rules="{required: true, message: '请选择', trigger: ['blur','change']}">
                  <el-select v-model="serviceInfo.container_name" placeholder="请选择" size="small">
                    <el-option v-for="(item,index) in curContainer" :key="index" :value="item"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4" class="mg-r8">
                <el-form-item prop="deploy_timeout" :rules="{required: true, message: '请输入', trigger: ['blur','change']}">
                  <el-input v-model.number="serviceInfo.deploy_timeout" placeholder="请输入部署超时时间" size="small"></el-input>
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
  getCanaryServiceListAPI
} from '@api'
import EnvTypeSelect from '../envTypeSelect.vue'
import { validateJobName } from '../../config'
import { cloneDeep } from 'lodash'

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
      dockerList: [],
      clusters: [],
      canryServiceList: [],
      originCanryServiceList: [],
      serviceInfo: {
        k8s_service_name: '',
        container_name: '',
        deploy_timeout: 10
      },
      originJob: {},
      flag: true
    }
  },
  computed: {
    curContainer () {
      const res = this.canryServiceList.find(item => {
        return item.service_name === this.serviceInfo.k8s_service_name
      })
      return res ? res.deployment.container_names : []
    }
  },
  created () {
    this.originJob = cloneDeep(this.job)
    this.getClusterList()
    this.getRegistryWhenBuild()
  },
  methods: {
    filterService (val, index) {
      if (val) {
        const service_names = []
        const arr = []
        this.job.spec.targets.forEach((item, i) => {
          if (index !== i) {
            service_names.push(item.k8s_service_name)
          }
        })
        this.canryServiceList.forEach((service, j) => {
          if (service_names.indexOf(service.service_name) === -1) {
            arr.push(service)
          }
        })
        this.canryServiceList = arr
      } else {
        this.canryServiceList = this.originCanryServiceList
      }
    },
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
          this.getCanaryServiceList()
        })
      }
    },
    getCanaryServiceList () {
      if (this.job.spec.cluster_id && this.job.spec.namespace) {
        getCanaryServiceListAPI(
          this.job.spec.cluster_id,
          this.job.spec.namespace
        ).then(res => {
          this.originCanryServiceList = res
          this.canryServiceList = res
        })
      }
    },
    handleServiceChange (val, item) {
      const res = this.canryServiceList.find(item => {
        return item.service_name === val
      })
      item.canryContainerList = res ? res.deployment.container_names : []
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
      const res = []
      this.canryServiceList.forEach(item => {
        if (item.service_name !== this.serviceInfo.k8s_service_name) {
          res.push(item)
        }
      })
      this.canryServiceList = res
      setTimeout(() => {
        this.serviceInfo = {
          k8s_service_name: '',
          container_name: '',
          canary_percentage: 10,
          deploy_timeout: 10
        }
      }, 500)
    },
    delService (index) {
      this.job.spec.targets.splice(index, 1)
    },
    getData () {
      if (this.$refs.serviceRef) {
        this.job.spec.targets.push(this.serviceInfo)
      }
      return this.job
    },
    validate () {
      if (this.$refs.serviceRef) {
        return this.$refs.serviceRef.validate().then(valod => {
          return this.$refs.ruleForm.validate()
        })
      } else {
        return this.$refs.ruleForm.validate()
      }
    }
  },
  watch: {
    job: {
      handler (val, oldVal) {
        if (val.spec.targets && this.canryServiceList.length > 0) {
          val.spec.targets.forEach(item => {
            this.handleServiceChange(item.k8s_service_name, item)
          })
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>
<style lang="less" scoped>
.job-canary-deploy {
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
