<template>
  <div class="job-deploy">
    <el-form label-width="90px" :model="job" ref="ruleForm" class="mg-t24 mg-b24">
      <el-form-item label="任务名称" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item label="环境" :required="job.spec.envType && job.spec.envType !== 'runtime'">
        <el-form-item prop="spec.env" v-if="!job.spec.envType ||job.spec.envType === 'runtime'" class="form-item">
          <el-select v-model="job.spec.env" placeholder="请选择" size="small" clearable>
            <el-option v-for="item in envList" :key="item.id" :label="item.name" :value="item.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          prop="spec.env"
          required
          v-if="job.spec.envType === 'fixed'"
          class="form-item"
          :rules="{required: true, message: '请选择环境', trigger: ['blur', 'change']}"
        >
          <el-select v-model="job.spec.env" placeholder="请选择" size="small">
            <el-option v-for="item in envList" :key="item.id" :label="item.name" :value="item.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          prop="spec.env"
          required
          v-if="job.spec.envType === 'other'"
          class="form-item"
          :rules="{required: true, message: '请选择环境', trigger: ['blur', 'change']}"
        >
          <el-select v-model="job.spec.env" placeholder="请选择" filterable size="small">
            <el-option v-for="(item,index) in globalEnv" :key="index" :label="item" :value="item">{{item}}</el-option>
          </el-select>
        </el-form-item>
        <EnvTypeSelect v-model="job.spec.envType" isFixed isRuntime isOther style="display: inline-block;" />
      </el-form-item>
      <el-form-item label="服务" :required="job.spec.serviceType && job.spec.serviceType!=='runtime'">
        <el-form-item prop="spec.service_and_images" v-if="!job.spec.serviceType || job.spec.serviceType === 'runtime'" class="form-item">
          <el-select size="small" v-model="job.spec.service_and_images" multiple filterable clearable value-key="value">
            <el-option
              v-for="(service,index) in originServiceAndBuilds"
              :key="index"
              :value="service"
              :label="`${service.service_name}/${service.service_module}`"
            >{{`${service.service_name}/${service.service_module}`}}</el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          prop="spec.job_name"
          v-if="job.spec.serviceType === 'other'"
          required
          class="form-item"
          :rules="{required: true, message: '请选择服务', trigger: ['blur', 'change']}"
        >
          <el-select v-model="job.spec.job_name" placeholder="请选择" size="small">
            <el-option v-for="(item,index) in allJobList" :key="index" :label="item.name" :value="item.name">{{item.name}}</el-option>
          </el-select>
        </el-form-item>
        <EnvTypeSelect v-model="job.spec.serviceType" isRuntime isOther isService style="display: inline-block;" />
      </el-form-item>
      <el-form-item label="服务状态检测" class="status-check">
        <span slot="label">
          服务状态检测
          <el-tooltip effect="dark" content="开启后，部署任务会轮询服务运行状态，待服务正常运行，任务状态才为成功。" placement="top">
            <i class="el-icon-question" style="cursor: pointer;"></i>
          </el-tooltip>
        </span>
        <el-form-item prop="spec.skip_check_run_status" class="form-item" :rules="{required: false}">
          <el-switch v-model="job.spec.skip_check_run_status" :active-value="false" :inactive-value="true" active-color="#0066ff"></el-switch>
        </el-form-item>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { listProductAPI } from '@/api'
import EnvTypeSelect from '../envTypeSelect.vue'
import { validateJobName } from '../../config'

export default {
  name: 'JobDeploy',
  props: {
    projectName: {
      type: String,
      default: ''
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
      formLabelWidth: '90px',
      envList: []
    }
  },
  computed: {
    allJobList () {
      const allJobList = this.workflowInfo.stages
        .map(stage => {
          return stage.jobs
        })
        .flat()
      return allJobList.filter(job => job.name !== this.job.name)
    }
  },
  created () {
    this.getEnvList()
  },
  methods: {
    getEnvList () {
      const projectName = this.projectName
      listProductAPI(projectName).then(res => {
        this.envList = res
      })
    },
    getData () {
      this.job.spec.service_and_images.forEach(item => {
        delete item.module_builds
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
.job-deploy {
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
