<template>
  <div class="values-yaml-container">
    <div class="values-title">
      <span class="title-left">
        <span class="secondary-title">Helm values 文件</span>
        <el-button type="text" class="title-btn" @click="showGitImportDialog = true">{{$t('global.importFromRepository')}}</el-button>
        <el-dropdown placement="bottom" style="margin-left: 10px;" v-if="useVarGroup">
          <el-button
            size="mini"
            icon="el-icon-s-operation"
            type="text"
          />
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="openVarGroupDisable">使用变量组</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </span>
      <i v-if="showDelete" class="el-icon-delete-solid icon-delete" @click="closeValueEdit" />
    </div>
    <Resize class="desc mirror" :resize="setResize.direction" :height="setResize.height" @sizeChange="$refs.codemirror.refresh()">
      <codemirror ref="codemirror" v-model="importRepoInfoUse.overrideYaml" />
    </Resize>
    <el-dialog :title="$t('global.importFromRepository')" :visible.sync="showGitImportDialog" append-to-body>
      <Repository ref="valueRepoRef" :repoSource="importRepoInfoUse.gitRepoConfig" :showAutoSync="showAutoSync" />
      <div slot="footer">
        <el-button @click="showGitImportDialog = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="importOverrideYaml" size="small" :loading="loadValueYamls">导 入</el-button>
      </div>
    </el-dialog>
    <VarGroups v-if="useVarGroup" v-model="varGroupData.visible" :variableSet="varGroupData.variableSet" @updateSourceDetail="updateSourceDetail" />
  </div>
</template>

<script>
import Resize from '@/components/common/resize'
import Codemirror from '../codemirror.vue'
import Repository from './repository.vue'
import VarGroups from './varGroups.vue'
import { cloneDeep } from 'lodash'
import { getValuesYamlFromGitAPI } from '@api'

const valueInfo = {
  yamlSource: '', // customEdit or default(不上传) variableSet repo
  overrideYaml: '',
  gitRepoConfig: {
    codehostID: null,
    owner: '',
    repo: '',
    branch: '',
    valuesPath: '',
    valuesPaths: [],
    autoSync: false,
    namespace: ''
  },
  variableSet: {
    source_id: '',
    autoSync: false
  }
}

export default {
  data () {
    return {
      showGitImportDialog: false,
      loadValueYamls: false,
      varGroupData: {
        visible: false,
        variableSet: null
      }
    }
  },
  props: {
    showDelete: {
      default: false,
      type: Boolean
    },
    showAutoSync: {
      default: false,
      type: Boolean
    },
    resize: {
      type: Object,
      default: () => {
        return {
          height: '300px',
          direction: 'none'
        }
      }
    },
    importRepoInfo: Object,
    useVarGroup: Boolean
  },
  computed: {
    setResize () {
      return {
        height: '200px',
        direction: 'none',
        ...this.resize
      }
    },
    importRepoInfoUse: {
      get () {
        const external = {}
        if (!this.importRepoInfo.gitRepoConfig) {
          external.gitRepoConfig = cloneDeep(valueInfo.gitRepoConfig)
        }
        if (!this.importRepoInfo.variableSet && this.useVarGroup) {
          external.variableSet = cloneDeep(valueInfo.variableSet)
        }
        return Object.assign(this.importRepoInfo, external)
      },
      set (val) {
        this.$emit('update:importRepoInfo', val)
        return val
      }
    }
  },
  methods: {
    importOverrideYaml () {
      this.$refs.valueRepoRef.validate().then(async () => {
        this.loadValueYamls = true
        const res = await getValuesYamlFromGitAPI(
          this.importRepoInfoUse.gitRepoConfig
        ).catch(error => {
          this.loadValueYamls = false
          console.log(error)
        })
        this.loadValueYamls = false
        if (res) {
          this.showGitImportDialog = false
          this.importRepoInfoUse.overrideYaml = res
          this.importRepoInfoUse.yamlSource = 'repo'
        }
      })
    },
    closeValueEdit () {
      this.importRepoInfoUse.yamlSource = 'default'
      this.$emit('closeValueEdit')
    },
    validate () {
      return Promise.all([Promise.resolve(true)])
    },
    resetValueRepoInfo () {
      this.$refs.valueRepoRef.resetSource()
    },
    openVarGroupDisable () {
      this.varGroupData.visible = true
      this.varGroupData.variableSet = this.importRepoInfoUse.variableSet || null
    },
    updateSourceDetail (data) {
      this.importRepoInfoUse.overrideYaml = data.overrideYaml
      this.importRepoInfoUse.variableSet = data.variableSet
      this.importRepoInfoUse.yamlSource = data.yamlSource
    }
  },
  components: {
    Codemirror,
    Resize,
    Repository,
    VarGroups
  }
}
</script>

<style lang="less" scoped>
.values-yaml-container {
  margin: 12px 0;
  line-height: 1;

  .desc-title {
    padding: 6px 0;
  }

  .values-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;

    .title-left {
      flex: 1 1 auto;

      .secondary-title {
        margin-bottom: 0;
      }

      .title-btn {
        margin-left: 10px;
        padding: 0;
        font-weight: 300;
        font-size: 12px;
      }
    }

    .icon-delete {
      flex: 0 0 auto;
      color: #f56c6c;
      font-size: 14px;
      cursor: pointer;
    }
  }

  .desc {
    color: #a1a3a7;
    font-size: 14px;

    .height-40 {
      height: 40px;
      line-height: 40px;
    }

    /deep/.el-input {
      .el-input__inner {
        width: 100%;
      }
    }
  }

  /deep/.el-select {
    width: 100%;
  }
}

/deep/.el-dialog__body {
  padding: 10px 20px;
}
</style>
