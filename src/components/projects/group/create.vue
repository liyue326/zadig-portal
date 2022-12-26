<template>
  <div class="var-group-detail">
    <el-form
      class="common-parcel-block primary-form"
      label-width="120px"
      label-position="left"
      ref="createGroupRef"
      :model="groupDetail"
      :rules="rules"
      inline-message
    >
      <el-form-item :label="$t('project.varsGroup.name')" prop="name">
        <el-input v-model="groupDetail.name" size="small" :disabled="!!id" :placeholder="$t('project.varsGroup.inputVarsGroupName')" />
      </el-form-item>
      <el-form-item :label="$t('global.desc')" prop="description">
        <el-input type="textarea" :rows="2" v-model="groupDetail.description" size="small" :placeholder="$t(`workflow.desc`)" />
      </el-form-item>
      <el-form-item :label="$t(`global.var`)" prop="variable_yaml" style="max-width: 1000px;">
        <Resize class="desc mirror" @sizeChange="$refs.codemirror.refresh()">
          <codemirror ref="codemirror" v-model="groupDetail.variable_yaml" :placeholder="$t('project.varsGroup.inputVarsGroupYaml')" />
        </Resize>
      </el-form-item>
    </el-form>
    <div class="bottom">
      <el-button @click="$router.back()" :loading="handleLoading" size="medium">{{$t(`global.cancel`)}}</el-button>
      <el-button @click="handleOpe" :loading="handleLoading" type="primary" size="medium">{{$t(`global.confirm`)}}</el-button>
    </div>
  </div>
</template>

<script>
import Resize from '@/components/common/resize'
import Codemirror from '@/components/projects/common/codemirror.vue'
import bus from '@utils/eventBus'
import {
  getVariablesGroupByIdAPI,
  createVariablesGroupAPI,
  updateVariablesGroupAPI
} from '@api'

export default {
  data () {
    return {
      groupDetail: {
        name: '',
        description: '',
        variable_yaml: ''
      },
      handleLoading: false
    }
  },
  components: {
    Resize,
    Codemirror
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    id () {
      return this.$route.query.id
    },
    rules () {
      return {
        name: {
          required: true,
          trigger: 'change',
          message: this.$t('project.varsGroup.inputVarsGroupName')
        },
        variable_yaml: {
          required: true,
          trigger: 'change',
          message: this.$t('project.varsGroup.inputVarsGroupYaml')
        }
      }
    }
  },
  methods: {
    async getGroupDetail () {
      const res = await getVariablesGroupByIdAPI(
        this.projectName,
        this.id
      ).catch(err => console.log(err))
      if (res) {
        this.groupDetail = res
      }
    },
    handleOpe () {
      this.$refs.createGroupRef.validate().then(async () => {
        const { name, description, variable_yaml } = this.groupDetail
        const payload = {
          name,
          description,
          variable_yaml
        }
        this.handleLoading = true
        const res = await (this.id
          ? updateVariablesGroupAPI(this.projectName, this.id, payload)
          : createVariablesGroupAPI(this.projectName, payload)
        ).catch(err => console.log(err))
        this.handleLoading = false
        if (res) {
          this.$message.success(`${this.id ? '更新' : '创建'}成功！`)
          this.$router.push(`/v1/projects/detail/${this.projectName}/group`)
        } else {
          this.$message.fail(`${this.id ? '更新' : '创建'}失败`)
        }
      })
    }
  },
  created () {
    if (this.id) {
      this.getGroupDetail()
    }
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: this.$t('subTopbarMenu.varsGroup'),
          url: `/v1/projects/detail/${this.projectName}/group`
        },
        { title: this.$route.query.name || this.$t('global.create'), url: '' }
      ]
    })
  }
}
</script>

<style lang="less" scoped>
.var-group-detail {
  height: 100%;
  overflow: auto;

  .bottom {
    margin-bottom: 20px;
    margin-left: 35%;
  }
}
</style>
