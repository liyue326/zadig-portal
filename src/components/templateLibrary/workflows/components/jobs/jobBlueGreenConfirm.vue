<template>
  <div class="build-env">
    <el-form label-width="120px" :model="job" ref="ruleForm" class="mg-t24 mg-b24" label-position="left">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item
        prop="spec.from_job"
        label="选择「部署蓝绿环境」任务"
        class="form-item"
      >
        <el-select v-model="job.spec.from_job" placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="(item,index) in allJobList" :key="index" :label="item.name" :value="item.name">{{item.name}}</el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { validateJobName, jobType } from '../../config'
export default {
  name: 'BuildEnv',
  props: {
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
      jobType,
      envList: []
    }
  },
  computed: {
    allJobList () {
      const jobs = []
      this.workflowInfo.stages.forEach(stage => {
        stage.jobs.forEach(job => {
          if (job.type === jobType.blueGreenDeploy) {
            jobs.push(job)
          }
        })
      })
      return jobs
    }
  },
  methods: {
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
.build-env {
  .form-item {
    display: inline-block;
    width: 220px;

    /deep/ .el-form-item__label {
      line-height: 20px;
    }
  }
}
</style>
