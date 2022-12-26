<template>
  <el-dialog :fullscreen="true" custom-class="create-project" :before-close="handleClose" :visible.sync="dialogVisible">
    <header class="project-contexts-modal__header">{{isEdit?$t(`project.createProjectComp.editProjectInfo`):$t(`project.createProjectComp.createProject`)}}</header>
    <section class="project-contexts-modal__content">
      <el-form
        :model="projectForm"
        :rules="rules"
        label-position="right"
        ref="projectForm"
        label-width="120px"
        class="demo-projectForm"
        inline-message
      >
        <el-form-item :label="$t(`project.projectName`)" prop="project_name">
          <el-input @keyup.native="()=>projectForm.project_name=projectForm.project_name.trim()" v-model="projectForm.project_name"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`project.createProjectComp.projectIdentifier`)" prop="product_name" class="label-icon">
          <span slot="label">
            {{$t(`project.createProjectComp.projectIdentifier`)}}
            <el-tooltip effect="dark" :content="$t(`project.createProjectComp.projectIdentifierTip`)" placement="top">
              <i class="el-icon-question" style="margin-left: 5px;"></i>
            </el-tooltip>
          </span>
          <el-input :disabled="!showProjectName" v-model="projectForm.product_name"></el-input>
          <span v-if="!isEdit" @click="editProjectName = editProjectName ? false : true" class="edit-btn">
            <i :class="[editProjectName ? 'el-icon-finished' : 'el-icon-edit-outline']"></i>
          </span>
        </el-form-item>
        <el-form-item prop="desc" :label="$t(`global.desc`)">
          <el-input type="textarea" :rows="1" :placeholder="$t(`global.inputDesc`)" v-model="projectForm.desc"></el-input>
        </el-form-item>
        <el-form-item v-if="!isEdit" :label="$t(`project.createProjectComp.type`)">
          <div class="project-type">
            <div
              class="project-type-item"
              v-for="typeItem in projectTypeList"
              :key="typeItem.type"
              @click="switchType(typeItem.type)"
              :class="{selected: projectType === typeItem.type}"
            >
              <i class="type-icon" :class="[projectType === typeItem.type ? 'el-icon-success selected' : typeItem.icon]"></i>
              <div class="project-type-item__desc">
                <div class="title">{{ typeItem.title }}</div>
                <div class="desc">{{ typeItem.firstDesc }}</div>
                <div class="desc">{{ typeItem.secondDesc }}</div>
              </div>
            </div>
          </div>
          <div class="type-link">
            <i class="icon el-icon-warning-outline"></i>
            <el-link
              type="primary"
              href="https://docs.koderover.com/zadig/pages/compatibility/"
              target="_blank"
              :underline="false"
            >{{$t(`project.createProjectComp.compatibility`)}}</el-link>
          </div>
        </el-form-item>
        <div v-if="!isEdit" class="advanced-title">
          <el-button type="text" @click="showAdvanced = !showAdvanced">
            {{$t(`project.createProjectComp.advancedConfigurations`)}}
            <i :class="{'el-icon-arrow-right': !showAdvanced, 'el-icon-arrow-down': showAdvanced }"></i>
          </el-button>
        </div>
        <div v-show="showAdvanced || isEdit">
          <el-form-item :label="$t(`project.createProjectComp.accessPermission`)" prop="public">
            <el-select v-model="projectForm.public" popper-class="access-permission">
              <el-option :label="$t(`project.createProjectComp.private`)" :value="false">
                <div class="title">{{$t(`project.createProjectComp.private`)}}</div>
                <div class="desc">{{$t(`project.createProjectComp.privateDesc`)}}</div>
              </el-option>
              <el-option :label="$t(`project.createProjectComp.public`)" :value="true">
                <div class="title">{{$t(`project.createProjectComp.public`)}}</div>
                <div class="desc">{{$t(`project.createProjectComp.publicDesc`)}}</div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t(`project.createProjectComp.projectAdministrator`)" v-if="!isEdit" prop="admins">
            <el-select v-model="projectForm.admins" filterable multiple remote :remote-method="remoteMethod" :loading="loading" :placeholder="$t(`project.createProjectComp.inputUsernameToSearch`)">
              <el-option
                v-for="user in users"
                :key="user.uid"
                :label="user.name ? `${user.account}(${user.name})` : user.account"
                :value="user.uid"
              >
                <span v-if="user.identity_type">
                  <i class="iconfont" :class="'icon'+user.identity_type"></i>
                  <span>{{user.name ? `${user.account}(${user.name})` : user.account}}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="!isEdit" :label="$t(`project.createProjectComp.specifiedCluster`)" prop="cluster_ids">
            <el-select filterable multiple clearable v-model="projectForm.cluster_ids" :placeholder="$t(`project.createProjectComp.selectCluster`)">
              <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
            </el-select>
          </el-form-item>
        </div>
      </el-form>
    </section>
    <footer class="project-contexts-modal__footer">
      <el-button type="primary" @click="submitForm('projectForm')">{{isEdit?$t(`project.createProjectComp.confirmUpdate`):$t(`project.createProjectComp.createNow`)}}</el-button>
    </footer>
  </el-dialog>
</template>
<script>
import {
  usersAPI,
  createProjectAPI,
  getSingleProjectAPI,
  updateSingleProjectAPI,
  getClusterListAPI
} from '@api'
const pinyin = require('pinyin')
export default {
  data () {
    return {
      dialogVisible: true,
      users: [],
      loading: false,
      editProjectName: false,
      radio: true,
      projectForm: {
        project_name: '',
        product_name: '',
        admins: [],
        cluster_ids: [],
        desc: '',
        enabled: true,
        public: false,
        product_feature: {
          basic_facility: 'kubernetes',
          deploy_type: 'k8s',
          create_env_type: 'system'
        }
      },
      allCluster: [],
      showAdvanced: false
    }
  },
  computed: {
    currentUserId () {
      return this.$store.state.login.userinfo.uid
    },
    isEdit () {
      return this.$route.path.includes('/projects/edit')
    },
    showProjectName () {
      return !this.isEdit && this.editProjectName
    },
    projectName () {
      if (this.isEdit) {
        return this.$route.params.project_name
      } else {
        return false
      }
    },
    projectType () {
      const feature = this.projectForm.product_feature
      if (feature.basic_facility === 'cloud_host') {
        return 'host'
      } else if (feature.create_env_type === 'external') {
        return 'external'
      } else if (feature.deploy_type === 'helm') {
        return 'helm'
      } else {
        return 'k8s'
      }
    },
    projectTypeList () {
      return [
        {
          type: 'k8s', // can't be modified
          title: this.$t(`project.createProjectComp.yamlProject`),
          firstDesc: this.$t(`project.createProjectComp.yamlProjectFirstDesc`),
          secondDesc: this.$t(`project.createProjectComp.yamlProjectSecondDesc`),
          icon: 'iconfont iconk8s'
        },
        {
          type: 'helm',
          title: this.$t(`project.createProjectComp.helmProject`),
          firstDesc: this.$t(`project.createProjectComp.helmProjectFirstDesc`),
          secondDesc: this.$t(`project.createProjectComp.helmProjectSecondDesc`),
          icon: 'iconfont iconhelmrepo'
        },
        {
          type: 'external',
          title: this.$t(`project.createProjectComp.hostingProject`),
          firstDesc: this.$t(`project.createProjectComp.hostingProjectFirstDesc`),
          secondDesc: this.$t(`project.createProjectComp.hostingProjectSecondDesc`),
          icon: 'iconfont iconvery-trustee'
        },
        {
          type: 'host',
          title: this.$t(`project.createProjectComp.hostsProject`),
          firstDesc: this.$t(`project.createProjectComp.hostsProjectFirstDesc`),
          secondDesc: this.$t(`project.createProjectComp.hostsProjectSecondDesc`),
          icon: 'iconfont iconzhuji'
        }
      ]
    },
    rules () {
      const validateProjectName = (rule, value, callback) => {
        if (typeof value === 'undefined' || value === '') {
          callback(new Error(this.$t(`project.createProjectComp.inputProjectIdentifier`)))
        } else {
          if (!/^[a-z0-9-]+$/.test(value)) {
            callback(new Error(this.$t(`project.createProjectComp.inputProjectIdentifierCheck`)))
          } else {
            callback()
          }
        }
      }
      return {
        project_name: [
          { required: true, message: this.$t(`project.createProjectComp.inputProjectName`), trigger: 'blur' }
        ],
        product_name: [
          { required: true, trigger: 'change', validator: validateProjectName }
        ],
        admins: [
          {
            type: 'array',
            required: true,
            message: this.$t(`project.createProjectComp.selectProjectAdmin`),
            trigger: 'change'
          }
        ],
        cluster_ids: [
          {
            type: 'array',
            required: true,
            message: this.$t(`project.createProjectComp.selectCluster`),
            trigger: 'change'
          }
        ],
        public: [
          { required: true, message: this.$t(`project.createProjectComp.selectProjectAccessPermission`), trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    switchType (type) {
      this.projectForm.product_feature = {
        basic_facility: 'kubernetes',
        create_env_type: 'system',
        deploy_type: 'k8s'
      }
      const feature = this.projectForm.product_feature
      switch (type) {
        case 'k8s':
          break
        case 'helm':
          feature.deploy_type = 'helm'
          break
        case 'external':
          feature.create_env_type = 'external'
          break
        case 'host':
          feature.basic_facility = 'cloud_host'
          break
      }
    },
    getUsers () {
      const payload = {
        page: 1,
        per_page: 200
      }
      usersAPI(payload).then(res => {
        this.users = res.users
      })
    },
    remoteMethod (query) {
      if (query !== '') {
        this.loading = true
        const payload = {
          name: query
        }
        usersAPI(payload).then(res => {
          this.loading = false
          this.users = res.users
        })
      } else {
        this.getUsers()
      }
    },
    handleClose () {
      if (this.isEdit) {
        this.$router.push(`/v1/projects/detail/${this.projectName}/detail`)
      } else {
        this.$router.push('/v1/projects')
      }
    },
    createProject (payload) {
      createProjectAPI(payload).then(res => {
        this.$message({
          type: 'success',
          message: this.$t(`project.createProjectComp.successfullySaved`)
        })
        this.$store.dispatch('getProjectList')
        if (payload.product_feature.basic_facility === 'kubernetes') {
          if (payload.product_feature.create_env_type === 'external') {
            this.$router.push(
              `/v1/projects/create/${payload.product_name}/host/config?step=1`
            )
            return
          }
          if (payload.product_feature.deploy_type === 'k8s') {
            this.$router.push(
              `/v1/projects/create/${payload.product_name}/k8s/info?rightbar=step`
            )
          }
          if (payload.product_feature.deploy_type === 'helm') {
            this.$router.push(
              `/v1/projects/create/${payload.product_name}/helm/info?rightbar=step`
            )
          }
        } else if (payload.product_feature.basic_facility === 'cloud_host') {
          this.$router.push(
            `/v1/projects/create/${payload.product_name}/pm/info`
          )
        }
      })
    },
    updateSingleProject (projectName, payload) {
      updateSingleProjectAPI(projectName, payload).then(res => {
        this.$message({
          type: 'success',
          message: this.$t(`project.createProjectComp.successfullyUpdated`)
        })
        this.$store.dispatch('getProjectList')
        this.$router.push('/v1/projects')
      })
    },
    getProject (projectName) {
      getSingleProjectAPI(projectName).then(res => {
        this.projectForm = res
        if (res.team_id === 0) {
          this.projectForm.team_id = null
        }
      })
    },
    submitForm (formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          if (this.isEdit) {
            this.updateSingleProject(
              this.projectForm.product_name,
              this.projectForm
            )
          } else {
            if (
              this.projectForm.product_feature.basic_facility === 'cloud_host'
            ) {
              this.projectForm.product_feature.deploy_type = 'k8s'
              this.projectForm.product_feature.create_env_type = 'system'
            }
            this.createProject(this.projectForm)
          }
        } else {
          return false
        }
      })
    },
    resetForm (formName) {
      this.$refs[formName].resetFields()
    },
    getCluster () {
      getClusterListAPI().then(res => {
        this.allCluster = res
        this.projectForm.cluster_ids = res.map(cluster => cluster.id)
      })
    }
  },
  watch: {
    'projectForm.project_name': {
      handler (val, old_val) {
        if (!this.isEdit) {
          this.projectForm.product_name = pinyin(val, {
            style: pinyin.STYLE_NORMAL
          }).join('')
        }
      }
    }
  },
  mounted () {
    if (this.isEdit) {
      this.getProject(this.projectName)
    } else {
      this.getUsers()
      this.getCluster()
      this.projectForm.admins.push(this.currentUserId)
    }
  }
}
</script>

<style lang="less" scoped>
@itemWidth: 400px;

.tooltip-key {
  display: inline-block;
  width: 130px;
}

/deep/.el-dialog__header {
  padding: 0;
}

/deep/.el-dialog__body {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: calc(~'100% - 20px');
  padding: 15px 20px 10px;
}

.create-project {
  .icon {
    cursor: pointer;
  }

  .project-contexts-modal__header {
    width: 80%;
    min-width: 800px;
    margin: 0 auto 16px;
    padding-bottom: 14px;
    font-weight: 300;
    font-size: 18px;
    line-height: 22px;
    text-align: center;
    border-bottom: 1px solid rgba(210, 210, 210, 0.5);
  }

  .project-contexts-modal__content {
    flex: 1 0 auto;
    margin-left: calc(~'50% - 300px');

    /deep/.el-form {
      &.demo-projectForm {
        .el-input,
        .el-select,
        .el-textarea {
          width: @itemWidth;
          font-weight: 300;

          .el-input {
            width: 100%;
          }

          .el-textarea__inner {
            height: 40px;
            line-height: 30px;
          }
        }
      }

      .el-form-item__label {
        font-weight: 300;
      }

      .el-form-item {
        margin-bottom: 8px;
        font-weight: 300;

        .el-form-item__content {
          line-height: 38px;

          .type-link {
            line-height: 22px;

            .icon {
              margin-right: 5px;
              color: #a0a0a0;
              font-size: 16px;
              vertical-align: text-bottom;
            }

            .el-link {
              font-weight: 300;
              font-size: 12px;
            }
          }
        }
      }

      .edit-btn {
        display: inline-block;
        margin-left: 6px;
        padding: 0 8px;
        font-size: 16px;
        line-height: 28px;
        border: 1px solid rgba(118, 122, 200, 0.5);
        border-radius: 4px;
        cursor: pointer;
      }

      .project-type {
        box-sizing: border-box;
        width: @itemWidth;
        padding: 8px;
        line-height: 22px;
        background: rgba(160, 160, 255, 0.01);
        border: 1px solid rgba(210, 215, 220, 0.3);
        border-radius: 4px;

        .project-type-item {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          padding: 8px 0;
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;

          &:not(:last-child) {
            margin-bottom: 2px;
          }

          .project-type-item__desc {
            .title {
              margin-bottom: 5px;
              color: #000;
              font-size: 14px;
            }

            .desc {
              color: #a0a0a0;
              font-size: 12px;
              line-height: 20px;
            }
          }

          .type-icon {
            flex: 0 0 74px;
            font-size: 24px;
            text-align: center;

            &.selected {
              color: @themeColor;
            }
          }

          &:hover {
            background: #fafafc;
          }

          &.selected {
            background: #fafafc;
            border-color: @themeColor;

            .project-type-item__desc {
              .title {
                color: @projectNameColor;
              }

              .desc {
                color: #4a4a4a;
              }
            }

            .icon {
              color: @themeColor;
              font-size: 20px;
            }
          }
        }
      }

      .advanced-title {
        .el-button {
          padding: 6px 0;
          font-weight: 300;
        }
      }
    }

    .small-title {
      color: #ccc;
      font-size: 12px;
    }

    .el-radio--mini {
      &.is-bordered {
        width: 135px;
        margin-right: 0;
      }
    }
  }

  .project-contexts-modal__footer {
    width: 80%;
    min-width: 800px;
    margin: 16px auto 0;
    padding-top: 14px;
    text-align: center;
    border-top: 1px solid rgba(210, 210, 210, 0.5);
  }
}
</style>

<style lang="less">
@itemWidth: 400px;

.access-permission {
  width: @itemWidth;

  .el-select-dropdown__item {
    height: auto;
    padding: 8px 20px;
    font-weight: 400;
    line-height: 22px;
    white-space: normal;

    &:not(:last-child) {
      border-bottom: 1px solid rgba(210, 210, 210, 0.5);
    }

    .title {
      font-size: 14px;
    }

    .desc {
      margin-top: 8px;
      color: #a0a0a0;
      font-size: 12px;
    }

    &.selected {
      color: @themeColor;

      .desc {
        color: inherit;
      }
    }
  }
}
</style>
