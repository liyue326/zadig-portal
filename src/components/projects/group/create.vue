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
      <el-form-item label="变量组名称" prop="name">
        <el-input v-model="groupDetail.name" size="small" :disabled="!!id" placeholder="请输入变量组名称" />
      </el-form-item>
      <el-form-item label="描述信息" prop="description">
        <el-input type="textarea" :rows="2" v-model="groupDetail.description" size="small" placeholder="描述信息" />
      </el-form-item>
      <el-form-item label="变量" prop="variable_yaml" style="max-width: 1000px;">
        <Resize class="desc mirror" @sizeChange="$refs.codemirror.refresh()">
          <codemirror ref="codemirror" v-model="groupDetail.variable_yaml" :placeholder="'输入 YAML 格式变量'" />
        </Resize>
      </el-form-item>
    </el-form>
    <div class="bottom">
      <el-button @click="$router.back()" :loading="handleLoading" size="medium">取消</el-button>
      <el-button @click="handleOpe" :loading="handleLoading" type="primary" size="medium">确定</el-button>
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
      rules: {
        name: {
          required: true,
          trigger: 'change',
          message: '请填写变量组名称'
        },
        variable_yaml: {
          required: true,
          trigger: 'change',
          message: '请输入 YAML 格式变量'
        }
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
    }
  },
  methods: {
    async getGroupDetail () {
      const res = await getVariablesGroupByIdAPI(
        this.projectName,
        this.id
      ).catch(err => window.console.log(err))
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
        ).catch(err => window.console.log(err))
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
        { title: '项目', url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: '变量组',
          url: `/v1/projects/detail/${this.projectName}/group`
        },
        { title: this.$route.query.name || '新建', url: '' }
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
