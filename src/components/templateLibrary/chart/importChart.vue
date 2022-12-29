<template>
  <div class="import-chart-container">
    <el-form ref="gitForm" :model="template" label-position="left" label-width="140px" :rules="rules">
      <el-form-item :label="$t(`templates.helmChart.templateName`)" prop="name">
        <el-input v-model="template.name" :placeholder="$t(`templates.helmChart.inputTemplateName`)" size="small" :disabled="isUpdate"></el-input>
      </el-form-item>
      <el-form-item label-width="0">
        <GitRepo
          @triggleAction="$emit('triggleAction')"
          @canUpdateEnv="$emit('canUpdateEnv', $event)"
          :currentService="currentService"
          @input="$emit('input', $event)"
          :controlParam="controlParam"
          :value="value"
          ref="gitRepo"
          @selectPath="selectedPath($event)"
        />
      </el-form-item>
      <el-form-item  style="text-align: right;">
        <el-button
          type="primary"
          @click="createChartTemplate"
          :disabled="!template.name || disabled"
          size="small"
          :loading="loading"
        >{{isUpdate? $t(`templates.helmChart.update`):$t(`templates.helmChart.load`)}}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import GitRepo from '../../projects/serviceMgr/helm/components/common/gitRepo.vue'
import { createChartTemplateAPI, updateChartTemplateAPI, getRepoFilesAPI } from '@api'

const controlParam = {
  hiddenCreateButton: true,
  hiddenRepoSelect: true,
  justSelectOneFile: true
}
export default {
  data () {
    return {
      template: {
        name: ''
      },
      disabled: true,
      loading: false,
      currentService: null,
      isUpdate: false
    }
  },
  props: {
    value: Boolean,
    chartCurrentService: Object
  },
  computed: {
    rules () {
      return {
        name: [{ required: true, message: this.$t(`templates.helmChart.inputTemplateName`), trigger: 'blur' }]
      }
    }
  },
  methods: {
    selectedPath (emitParams) {
      emitParams.path = emitParams.path[0]
      this.template = Object.assign({}, this.template, emitParams)
      this.disabled = false
    },
    async createChartTemplate () {
      this.loading = true
      let res
      const name = this.template.name
      const refVal = this.$refs.gitRepo.getGitSourceType(this.template.codehostId)
      if (refVal === 'gerrit' || refVal === 'gitee' || refVal === 'gitee-enterprise') {
        const params = {
          codehostId: this.template.codehostId,
          repoOwner: this.template.owner,
          repoName: this.template.repo,
          branchName: this.template.branch,
          path: this.template.path,
          type: 'gerrit',
          namespace: this.template.namespace
        }
        await getRepoFilesAPI(params)
      }
      if (this.isUpdate) {
        res = await updateChartTemplateAPI(
          this.template.name,
          this.template
        ).catch(err => {
          this.loading = false
          console.log(err)
        })
      } else {
        res = await createChartTemplateAPI(this.template).catch(err => {
          this.loading = false
          console.log(err)
        })
      }

      if (res) {
        this.$message.success(
          `${this.isUpdate ? this.$t(`templates.helmChart.updateSuccess`, { name: this.template.name }) : this.$t(`templates.helmChart.loadSuccess`, { name: this.template.name })}`
        )
        this.loading = false
        this.resetField()
        this.$emit('input', false)
        this.$emit('importChart', {
          create: !this.isUpdate,
          update: this.isUpdate,
          name: name
        })
      }
    },
    resetField () {
      this.template.name = ''
      this.$refs.gitRepo.closeSelectRepo()
      this.$nextTick(() => {
        this.$refs.gitForm.clearValidate()
        this.$refs.gitRepo.$refs.sourceForm.clearValidate()
      })
    }
  },
  watch: {
    value: {
      handler (val) {
        if (val && this.chartCurrentService) {
          const current = this.chartCurrentService
          this.template = {
            name: current.name,
            codehostId: current.codehost_id,
            owner: current.repo_owner,
            repo: current.repo_name,
            branch: current.branch_name,
            path: current.load_path,
            namespace: current.namespace
          }
          this.isUpdate = true
          this.disabled = false
        }
        if (!val) {
          this.resetField()
          this.isUpdate = false
          this.disabled = true
          this.loading = false
        }
        this.currentService = this.chartCurrentService
      },
      immediate: true
    }
  },
  components: {
    GitRepo
  },
  created () {
    this.controlParam = controlParam
  }
}
</script>

<style lang="less" scoped>
.import-chart-container {
  padding: 5px;

  .repo-attr {
    span {
      display: inline-block;
      width: 128px;
      margin-bottom: 20px;
      padding-right: 12px;
      line-height: 40px;
      text-align: right;
    }

    /deep/.el-input {
      width: 200px;
    }
  }

  /deep/.el-form-item {
    .el-form-item {
      margin-bottom: 22px;
    }
  }
}
</style>
