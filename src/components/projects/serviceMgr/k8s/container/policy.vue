<template>
  <div class="policy-container">
    <div class="form-container">
      <el-form :model="projectForm" :rules="rules" label-position="top" ref="projectForm" label-width="100px">
        <el-form-item label="服务部署超时设置（分钟）" prop="timeout">
          <el-input v-model.number="projectForm.timeout"></el-input>
        </el-form-item>
        <el-form-item prop="auto_deploy.enable" v-if="showAutoUpdate">
          <span slot="label">
            <span>服务自动更新</span>
            <el-tooltip effect="dark" content="开启自动更新后，服务配置变更时，Zadig 会自动将其部署到项目中所有环境中" placement="top">
              <i class="pointer el-icon-warning"></i>
            </el-tooltip>
          </span>
          <span>开启自动更新</span>
          <el-switch v-model="projectForm.auto_deploy.enable" />
        </el-form-item>
        <el-form-item label="交付物命名规则设置">
          <span slot="label">
            交付物命名规则设置
            <el-tooltip effect="dark" placement="top">
              <div slot="content">
                镜像和 TAR 包规则可以通过变量和常量组装生成：
                <br />
                <div v-for="item in tipList" :key="item.key" >
                  <span v-html="item.key" style="display: inline-block; width: 140px;"></span> <span>{{item.label}}</span>
                </div>
                <br />
                <div>注意：</div>
                <div>- 常量字符只能是大小写字母、数字、中划线、下划线和点，即 [a-zA-Z0-9_.-]</div>
                <div>- 常量字符的首个字符以大小写字母或数字开头，最大长度为 127 个字符</div>
                <div>- 如使用 其他 代码源， <span v-html="'{{.REPO_PR}}、{{.REPO_COMMIT_ID}}'"></span> 变量不支持</div>
              </div>
              <i class="el-icon-question"></i>
            </el-tooltip>
          </span>
          <CusDeliverable
            :customImageRule="projectForm.custom_image_rule"
            :customTarRule="projectForm.custom_tar_rule"
            ref="cusDeliverable"
          />
        </el-form-item>
      </el-form>
    </div>
    <div class="operation-container">
      <el-button type="primary" size="small" @click="submitForm('projectForm')" :disabled="!isProjectAdmin">保存策略</el-button>
    </div>
  </div>
</template>
<script>
import { getSingleProjectAPI, updateSingleProjectAPI, queryUserBindingsAPI } from '@api'
import store from 'storejs'
import CusDeliverable from '../../../detail_ope/components/cusDeliverable.vue'
const validateDeployTimeout = (rule, value, callback) => {
  const reg = /^[0-9]+.?[0-9]*/
  if (!reg.test(value)) {
    callback(new Error('时间应为数字'))
  } else {
    if (value > 0) {
      callback()
    } else {
      callback(new Error('请输入正确的时间范围'))
    }
  }
}
export default {
  components: {
    CusDeliverable
  },
  props: {
    service: {
      type: Array,
      default: () => [
        { build_name: '' }
      ]
    }
  },
  data () {
    return {
      userBindings: [],
      projectForm: {
        timeout: null,
        custom_image_rule: {},
        auto_deploy: {
          enable: false
        }
      },
      rules: {
        timeout: [
          {
            required: true,
            trigger: 'change',
            validator: validateDeployTimeout
          }
        ]
      },
      tipList: [
        { key: '{{.TIMESTAMP}}', label: '时间戳' },
        { key: '{{.TASK_ID}}', label: '工作流任务 ID' },
        { key: '{{.REPO_BRANCH}}', label: '代码分支名称' },
        { key: '{{.REPO_PR}}', label: '代码 PR ID' },
        { key: '{{.REPO_TAG}}', label: '代码 TAG' },
        { key: '{{.REPO_COMMIT_ID}}', label: '代码 Commit ID' },
        { key: '{{.PROJECT}}', label: '项目名称' },
        { key: '{{.SERVICE}}', label: '服务名称' },
        { key: '{{.IMAGE_NAME}}', label: '镜像名称' },
        { key: '{{.ENV_NAME}}', label: '环境名称' }
      ]
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    showAutoUpdate () {
      const project = this.$store.getters.projectList.find(
        project => project.name === this.projectName
      )
      if (!this.projectName) {
        return false
      } else if (project && (project.deployType === 'helm' || project.deployType === 'k8s')) {
        return true
      } else {
        return false
      }
    },
    isProjectAdmin () {
      if (this.$utils.roleCheck('admin')) {
        return true
      } else if (this.userBindings.length > 0) {
        return this.userBindings.some(item => item.role === 'project-admin')
      } else {
        return false
      }
    }
  },
  methods: {
    getPolicy (projectName) {
      getSingleProjectAPI(projectName).then(res => {
        this.projectForm = res
        if (!res.timeout) {
          this.$set(this.projectForm, 'timeout', 10)
        }
        if (!res.auto_deploy) {
          this.$set(this.projectForm, 'auto_deploy', { enable: false })
        }
      })
    },
    async getUserBinding (projectName) {
      const userInfo = store.get('userInfo')
      const userBindings = await queryUserBindingsAPI(
        userInfo.uid,
        projectName
      ).catch(error => console.log(error))
      if (userBindings) {
        this.userBindings = userBindings
      }
    },
    updatePolicy (projectName, payload) {
      updateSingleProjectAPI(projectName, payload).then(res => {
        this.$emit('closeDrawer', true)
        this.$message({
          type: 'success',
          message: '策略更新成功'
        })
      })
    },
    submitForm (formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          this.$refs.cusDeliverable.saveConfig()
          this.projectForm.custom_image_rule = this.$refs.cusDeliverable.custom_image_rule
          this.projectForm.custom_tar_rule = this.$refs.cusDeliverable.custom_tar_rule
          this.updatePolicy(this.projectForm.product_name, this.projectForm)
        } else {
          return false
        }
      })
    },
    resetForm (formName) {
      this.$refs[formName].resetFields()
    }
  },
  mounted () {
    this.getUserBinding(this.projectName)
    this.getPolicy(this.projectName)
  }
}
</script>
<style lang="less">
.policy-container {
  display: flex;
  flex-direction: column;
  height: 100%;

  .form-container {
    display: flex;
    flex: 1;
    box-sizing: border-box;
    width: 100%;
    margin-bottom: 10px;
    padding: 10px;
    overflow: auto;

    .el-form {
      width: 100%;

      /deep/.el-popper.tip {
        .tooltip-key {
          display: inline-block;
          width: 280px !important;
        }
      }
    }
  }

  .operation-container {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    height: 32px;
  }
}
</style>
