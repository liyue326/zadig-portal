<template>
  <div class="values-yaml-container">
    <div
      class="secondary-title"
      :style="{ 'margin-bottom': importRepoInfoUse.showParams.showImport ? '0' : '16px'}"
    >{{ importRepoInfoUse.showParams.title }}</div>
    <div class="values-yaml-content">
      <el-button v-if="importRepoInfoUse.showParams.showImport" type="text" class="title-btn" @click="showGitImportDialog = true">从代码库导入</el-button>
      <Resize class="desc mirror" @sizeChange="$refs.codemirror.refresh()">
        <codemirror ref="codemirror" v-model="importRepoInfoUse.overrideYaml" :placeholder="placeholder" :cmOption="cmOption"></codemirror>
      </Resize>
      <div
        v-if="importRepoInfoUse.showParams.checkAssociated && (importRepoInfoUse.services && importRepoInfoUse.services.length)"
        style="margin-top: 16px;"
      >
        <el-checkbox v-model="importRepoInfoUse.restart_associated_svc">重启关联服务 {{ importRepoInfoUse.services.join('、') }}</el-checkbox>
      </div>
    </div>
    <el-dialog title="环境配置 - 从代码库导入" :visible.sync="showGitImportDialog" append-to-body>
      <Repository ref="valueRepoRef" :repoSource="importRepoInfoUse.gitRepoConfig" :fileType="'k8sYaml'" showAutoSync></Repository>
      <div slot="footer">
        <el-button @click="showGitImportDialog = false" size="small">取 消</el-button>
        <el-button type="primary" @click="importConfigYaml" size="small" :loading="loadValueYamls">导 入</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Resize from '@/components/common/resize'
import Codemirror from '../codemirror.vue'
import Repository from '../importValues/repository.vue'
import { cloneDeep } from 'lodash'
import { getConfigYamlAPI } from '@api'

const valueInfo = {
  overrideYaml: '',
  gitRepoConfig: {
    codehostID: null,
    owner: '',
    repo: '',
    branch: '',
    valuesPaths: [],
    namespace: '',
    autoSync: false
  }
}

const showParams = {
  title: '添加环境配置',
  showImport: true,
  checkAssociated: false
}

export default {
  data () {
    return {
      showGitImportDialog: false,
      loadValueYamls: false
    }
  },
  props: {
    importRepoInfo: Object,
    cmOption: {
      type: Object,
      default: () => {
        return {
          readOnly: false
        }
      }
    },
    placeholder: {
      type: String,
      default: '可直接粘贴 Ingress、ConfigMap、Secret、PVC 类型的 K8s YAML 文件'
    }
  },
  computed: {
    importRepoInfoUse: {
      get () {
        const defaultParams = {}
        if (!this.importRepoInfo.gitRepoConfig) {
          defaultParams.gitRepoConfig = cloneDeep(valueInfo.gitRepoConfig)
        }
        if (!this.importRepoInfo.showParams) {
          defaultParams.showParams = cloneDeep(showParams)
        }
        this.$refs.valueRepoRef && this.$refs.valueRepoRef.resetSource()
        return Object.assign(this.importRepoInfo, defaultParams)
      }
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    importConfigYaml () {
      this.$refs.valueRepoRef.validate().then(async () => {
        const repoConfig = this.importRepoInfoUse.gitRepoConfig
        const params = {
          codehostId: repoConfig.codehostID,
          repoOwner: repoConfig.namespace,
          repoName: repoConfig.repo,
          branchName: repoConfig.branch,
          path: repoConfig.valuesPaths[0],
          isDir: false,
          projectName: this.projectName
        }
        this.loadValueYamls = true
        const res = await getConfigYamlAPI(params).catch(error =>
          console.log(error)
        )
        this.loadValueYamls = false
        if (res) {
          this.showGitImportDialog = false
          this.importRepoInfoUse.overrideYaml = res
          this.importRepoInfoUse.initYaml = res
        }
      })
    }
  },
  components: {
    Codemirror,
    Resize,
    Repository
  }
}
</script>

<style lang="less" scoped>
.values-yaml-container {
  margin: 12px 0;
  line-height: 1;

  .values-yaml-content {
    padding: 0 20px;

    .title-btn {
      font-weight: 300;
      font-size: 12px;
    }

    .desc {
      color: #a1a3a7;
      font-size: 14px;
    }
  }
}

/deep/.el-dialog {
  .el-dialog__header {
    text-align: center;
    border-bottom: 1px solid #d2d2d2;
  }

  .el-dialog__body {
    padding: 40px 106px 0;
  }
}
</style>
