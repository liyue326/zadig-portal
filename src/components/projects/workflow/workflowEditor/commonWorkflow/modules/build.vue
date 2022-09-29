<template>
  <div class="build-config-container">
    <div class="section">
      <el-form ref="addConfigForm" :model="buildInfo" :rules="buildInfoRules" label-position="left" label-width="80px">
        <span class="item-title">构建环境</span>
        <div class="divider item"></div>
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="系统" prop="image_id" label-width="60px">
              <el-select size="mini" v-model="buildInfo.image_id" placeholder="请选择">
                <el-option v-for="(sys, index) in systems" :key="index" :label="sys.label" :value="sys.id">
                  <span>
                    {{ sys.label }}
                    <el-tag v-if="sys.image_from === 'custom'" type="info" size="mini" effect="light">自定义</el-tag>
                  </span>
                </el-option>
                <el-option value="">
                  <router-link to="/v1/system/imgs" style="color: #606266;">新建自定义构建镜像</router-link>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="资源" label-width="50px">
              <el-select size="mini" v-model="buildInfo.res_req" placeholder="请选择">
                <el-option label="高 | CPU: 16 核 内存: 32 GB" value="high"></el-option>
                <el-option label="中 | CPU: 8 核 内存: 16 GB" value="medium"></el-option>
                <el-option label="低 | CPU: 4 核 内存: 8 GB" value="low"></el-option>
                <el-option label="最低 | CPU: 2 核 内存: 2 GB" value="min"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-form ref="buildApp" :inline="true" :model="buildInfo" class="form-bottom-0" label-position="top" label-width="80px">
        <span class="item-title">应用列表</span>
        <el-button v-if="buildInfo.install_items.length === 0" style="padding: 0;" @click="addFirstBuildApp()" size="mini" type="text">新增</el-button>
        <div class="divider item"></div>
        <el-row v-for="(app, build_app_index) in buildInfo.install_items" :key="build_app_index">
          <el-col :span="12">
            <el-form-item
              :prop="'install_items.' + build_app_index + '.name'"
              :rules="{
                    required: true,
                    message: '应用名不能为空',
                    trigger: 'blur',
                  }"
            >
              <el-select
                style="width: 100%;"
                v-model="buildInfo.install_items[build_app_index]"
                placeholder="请选择应用"
                size="mini"
                value-key="id"
                filterable
              >
                <el-option
                  v-for="(app, index) in allApps"
                  :key="index"
                  :label="`${app.name} ${app.version} `"
                  :value="{
                        name: app.name,
                        version: app.version,
                        id: app.name + app.version,
                      }"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <div class="app-operation">
                <el-button
                  v-if="buildInfo.install_items.length >= 1"
                  @click="deleteBuildApp(build_app_index)"
                  type="danger"
                  size="mini"
                  plain
                >删除</el-button>
                <el-button
                  v-if="
                        build_app_index ===
                        buildInfo.install_items.length - 1
                      "
                  @click="addBuildApp(build_app_index)"
                  type="primary"
                  size="mini"
                  plain
                >新增</el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="section">
      <RepoSelect ref="repoSelect" :validObj="validRepoObj" :config="buildConfig" showDivider addBtnMini shortDescription showFirstLine/>
    </div>
    <div class="section">
      <el-form ref="cacheDir" :inline="true" :model="buildInfo" class="form-bottom-0" label-position="left" label-width="130px">
        <span class="item-title">缓存策略</span>
        <div class="divider item"></div>
        <el-form-item label="使用工作空间缓存">
          <el-switch v-model="buildInfo.job_ctx.clean_workspace" active-color="#0066ff"></el-switch>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="缓存自定义目录">
              <el-button
                v-if="
                        !this.buildInfo.job_ctx.caches ||
                        this.buildInfo.job_ctx.caches.length === 0
                      "
                style="padding: 0;"
                @click="addFirstCacheDir()"
                type="text"
              >新增</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-for="(dir, index) in buildInfo.job_ctx.caches" :key="index">
          <el-col :span="14">
            <el-form-item :label="index === 0 ? '' : ''">
              <el-input v-model="buildInfo.job_ctx.caches[index]" style="width: 100%;" size="mini">
                <template slot="prepend">$WORKSPACE/</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item :label="index === 0 ? '' : ''">
              <div class="app-operation">
                <el-button v-if="buildInfo.job_ctx.caches.length >= 1" @click="deleteCacheDir(index)" type="danger" size="mini" plain>删除</el-button>
                <el-button
                  v-if="index === buildInfo.job_ctx.caches.length - 1"
                  @click="addCacheDir(index)"
                  type="primary"
                  size="mini"
                  plain
                >新增</el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="section">
      <el-form ref="buildScript" :model="buildInfo" label-position="left" label-width="80px">
        <span class="item-title">构建脚本</span>
        <el-tooltip effect="dark" placement="top-start">
          <div slot="content">
            当前可用环境变量如下，可在构建脚本中进行引用
            <br />$WORKSPACE&nbsp;&nbsp;工作目录
            <br />$TASK_ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;工作流任务 ID
            <br />$IMAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;输出镜像名称
            <br />$SERVICE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;构建的服务名称
            <br />$SERVICE_MODULE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;构建的服务组件名称
            <br />$DIST_DIR&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;构建出的 Tar 包的目的目录
            <br />$PKG_FILE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;构建出的 Tar 包名称
            <br />$ENV_NAME&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;执行的环境名称
            <br />$BUILD_URL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;构建任务的 URL
            <br />$CI&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            值恒等于 true，表示当前环境是 CI/CD 环境
            <br />$ZADIG&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;值恒等于
            true，表示在 Zadig 系统上执行脚本
            <br />&lt;REPO&gt;_PR 构建过程中指定代码仓库使用的 Pull Request 信息
            <br />&lt;REPO&gt;_BRANCH 构建过程中指定代码仓库使用的分支信息
            <br />&lt;REPO&gt;_TAG 构建过程中指定代码仓库使用 Tag 信息
            <br />&lt;REPO&gt;_COMMIT_ID 构建过程中指定代码的 commit 信息
          </div>
          <span class="variable">变量</span>
        </el-tooltip>
        <div class="divider item"></div>
        <el-row>
          <el-col class="deploy-script" :span="24">
            <Resize :height="'150px'">
              <Editor v-model="buildInfo.job_ctx.build_steps[0].scripts" lang="sh" theme="xcode" width="100%" height="100%"></Editor>
            </Resize>
          </el-col>
        </el-row>
      </el-form>
      <el-form :model="buildInfo" ref="file_archive" class="stcov label-at-left">
        <div class="dashed-container">
          <span class="title">交付物归档</span>
          <el-form-item label="存放路径：">
            <el-input v-model="buildInfo.job_ctx.artifact_path" size="mini">
              <template slot="prepend">$WORKSPACE/</template>
            </el-input>
          </el-form-item>
        </div>
      </el-form>
    </div>
  </div>
</template>
<script>
import { getAllAppsAPI, getImgListAPI } from '@api'
import Editor from 'vue2-ace-bind'
import Resize from '@/components/common/resize.vue'
import Codemirror from '@/components/projects/common/codemirror.vue'
import ValidateSubmit from '@utils/validateAsync'
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'

const buildInfo = {
  enabled: true,
  type: 'buildv3',
  build_os: 'xenial',
  image_from: 'koderover',
  image_id: '',
  res_req: 'low',
  job_ctx: {
    clean_workspace: true,
    artifact_path: '',
    caches: [],
    build_steps: [
      {
        type: 'shell',
        scripts: '#!/bin/bash\nset -e'
      }
    ],
    builds: []
  },
  install_items: []
}

export default {
  props: {
    isEdit: Boolean,
    validObj: Object
  },
  data () {
    this.buildInfoRules = {
      image_id: [
        {
          type: 'string',
          required: true,
          message: '请选择构建系统',
          trigger: 'blur'
        }
      ]
    }
    return {
      buildInfo: cloneDeep(buildInfo),
      buildConfig: {
        repos: []
      },
      allApps: [],
      systems: [],
      validRepoObj: new ValidateSubmit()
    }
  },
  methods: {
    async validate () {
      const res = await this.validRepoObj.validateAll()
      if (!res[1]) {
        return Promise.reject(false)
      }
      const validList = [this.$refs.addConfigForm.validate()]
      if (this.$refs.buildApp) {
        validList.push(this.$refs.buildApp.validate())
      }
      if (this.$refs.cacheDir) {
        validList.push(this.$refs.cacheDir.validate())
      }
      return Promise.all(validList)
    },
    addFirstCacheDir () {
      if (
        !this.buildInfo.job_ctx.caches ||
        this.buildInfo.job_ctx.caches.length === 0
      ) {
        this.$set(this.buildInfo.job_ctx, 'caches', [])
        this.buildInfo.job_ctx.caches.push('')
      }
    },
    addCacheDir (index) {
      this.$refs.cacheDir.validate(valid => {
        if (valid) {
          this.buildInfo.job_ctx.caches.push('')
        } else {
          return false
        }
      })
    },
    deleteCacheDir (index) {
      this.buildInfo.job_ctx.caches.splice(index, 1)
    },
    addBuildApp (index) {
      this.$refs.buildApp.validate(valid => {
        if (valid) {
          this.buildInfo.install_items.push({
            name: '',
            version: '',
            id: ''
          })
        } else {
          return false
        }
      })
    },
    addFirstBuildApp () {
      this.buildInfo.install_items.push({
        name: '',
        version: '',
        id: ''
      })
    },
    deleteBuildApp (index) {
      this.buildInfo.install_items.splice(index, 1)
    },
    async loadPage () {
      getAllAppsAPI().then(response => {
        const apps = this.$utils.sortVersion(response, 'name', 'asc')
        this.allApps = apps.map((app, index) => {
          return {
            name: app.name,
            version: app.version,
            id: app.name + app.version
          }
        })
      })
      getImgListAPI().then(response => {
        this.systems = response
        if (!this.isEdit) {
          this.buildInfo.image_id = this.systems[0].id
        }
      })
    },
    getRestoredBuild () {
      const { buildv3 } = cloneDeep(this.commonInfo)
      this.buildInfo = { ...cloneDeep(buildInfo), ...buildv3 }
      this.buildConfig.repos = buildv3.job_ctx ? buildv3.job_ctx.builds : []
    },
    updateCommonInfo () {
      const system = this.systems.find(system => system.id === this.buildInfo.image_id)
      this.buildInfo.image_from = system.image_from
      this.buildInfo.build_os = system.value
      this.buildInfo.job_ctx.builds = this.buildConfig.repos
      this.$store.commit('UPDATE_COMMON_INFO', { buildv3: this.buildInfo })
    }
  },
  components: {
    Editor,
    Resize,
    Codemirror
  },
  computed: {
    ...mapState({
      commonInfo: state => state.commonWorkflow.commonInfo
    })
  },
  created () {
    this.loadPage()
  },
  activated () {
    this.getRestoredBuild()
    this.validObj.addValidate({
      name: '构建',
      valid: this.validate
    })
  },
  deactivated () {
    this.updateCommonInfo()
  }
}
</script>
<style lang="less" scoped>
@import url('~@assets/css/common/scroll-bar.less');

.deploy-script {
  margin-top: 10px;
  margin-bottom: 10px;

  .ace_editor.ace-xcode {
    &:hover {
      .scrollBar();
    }
  }
}

.build-config-container {
  flex: 1;
  height: 100%;
  padding: 15px;
  overflow: auto;
  font-size: 13px;

  .divider {
    width: 100%;
    height: 1px;
    margin: 5px 0 15px 0;
    background-color: #dfe0e6;

    &.item {
      width: 30%;
    }
  }

  .section {
    margin-bottom: 15px;
  }

  .el-form {
    .item-title {
      font-size: 15px;
    }

    .variable {
      color: #06f;
      font-size: 13px;
      cursor: pointer;
    }
  }

  .form-bottom-0 {
    .el-form-item {
      margin-bottom: 0;
    }
  }

  .app-operation {
    .el-button + .el-button {
      margin-left: 0;
    }
  }
}
</style>
