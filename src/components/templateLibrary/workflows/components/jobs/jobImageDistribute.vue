<template>
  <div class="job-deploy">
    <el-form label-width="120px" :model="job" ref="ruleForm" label-position="left" class="mg-t24 mg-b24">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item :label="$t(`global.serviceModule`)">
        <el-form-item prop="spec.targets" v-if="job.spec.source === 'runtime'" class="form-item">
          <el-select size="small" key="2" v-model="job.spec.targets" filterable clearable value-key="value" multiple style="width: 220px;">
            <el-option
              v-for="(service,index) in originServiceAndBuilds"
              :key="index"
              :value="service"
              :label="`${service.service_name}/${service.service_module}`"
            >{{`${service.service_name}/${service.service_module}`}}</el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="spec.job_name" v-if="job.spec.source === 'other'" class="form-item">
          <el-select key="1" v-model="job.spec.job_name" placeholder="请选择" size="small" style="width: 220px;">
            <el-option v-for="(item,index) in allJobList" :key="index" :label="item.name" :value="item.name">{{item.name}}</el-option>
          </el-select>
        </el-form-item>
        <EnvTypeSelect v-model="job.spec.source" isRuntime isOther isService style="display: inline-block;" />
      </el-form-item>
      <el-form-item class="long-item" label="源镜像仓库" v-if="job.spec.source!=='other'" prop="spec.source_registry_id">
        <el-select v-model="job.spec.source_registry_id" filterable placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item class="long-item" label="目标镜像仓库" prop="spec.target_registry_id">
        <el-select v-model="job.spec.target_registry_id" filterable placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <section>
        <div style="margin-bottom: 8px;">
          <el-button type="primary" size="small" plain @click="advanced_setting_modified = !advanced_setting_modified">
            {{$t(`project.createProjectComp.advancedConfigurations`)}}
            <i :class="[advanced_setting_modified ? 'el-icon-arrow-up' : 'el-icon-arrow-down']" style="margin-left: 8px;"></i>
          </el-button>
        </div>
        <AdvancedConfig
          v-if="advanced_setting_modified"
          ref="advancedConfigRef"
          class="common-parcel-block"
          :isCreate="job.isCreate"
          :buildConfig="job"
          secondaryProp="spec"
          @validateFailed="advanced_setting_modified = true"
          :validObj="validObj"
          hiddenCache
          hiddenSystem
        ></AdvancedConfig>
      </section>
    </el-form>
  </div>
</template>

<script>
import { getRegistryWhenBuildAPI, getAssociatedBuildsAPI } from '@/api'
import EnvTypeSelect from '../envTypeSelect.vue'
import { validateJobName } from '../../config'
import AdvancedConfig from '@/components/projects/build/advancedConfig.vue'
import ValidateSubmit from '@utils/validateAsync'

export default {
  name: 'JobImageDistrubute',
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
    job: {
      type: Object,
      default: () => ({})
    }
  },
  components: {
    EnvTypeSelect,
    AdvancedConfig
  },
  data () {
    return {
      validateJobName,
      validObj: new ValidateSubmit(),
      formLabelWidth: '120px',
      dockerList: [],
      originServiceAndBuilds: [],
      advanced_setting_modified: false
    }
  },
  computed: {
    allJobList () {
      const allJobList = this.workflowInfo.stages
        .map(stage => {
          return stage.jobs
        })
        .flat()
      return allJobList.filter(
        job => job.name !== this.job.name && job.type === 'zadig-build'
      )
    }
  },
  created () {
    this.getRegistryWhenBuild()
    this.getServiceAndBuildList()
  },
  methods: {
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
    },
    getServiceAndBuildList () {
      const projectName = this.projectName
      getAssociatedBuildsAPI(projectName, true).then(res => {
        res.forEach(item => {
          item.value = `${item.service_name}/${item.service_module}`
        })
        this.originServiceAndBuilds = res
      })
    },
    getData () {
      if (this.job.spec.targets.length > 0) {
        this.job.spec.targets.forEach(item => {
          delete item.module_builds
        })
      }
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

  .long-item {
    /deep/ .el-form-item__label {
      line-height: 20px;
    }
  }

  .common-parcel-block {
    padding: 0;
  }
}
</style>
