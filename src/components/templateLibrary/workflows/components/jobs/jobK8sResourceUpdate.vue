<template>
  <div class="job-k8s-deploy">
    <el-form label-width="120px" :model="job" ref="ruleForm" label-position="left" class="mg-t24 mg-b24">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item :label="$t(`workflow.cluster`)" prop="spec.cluster_id" :rules="{ required: true, message: '请选择集群名称', trigger: ['change', 'blur'] }">
        <el-select v-model="job.spec.cluster_id" placeholder="请选择集群名称" size="small" style="width: 220px;" @change="getNamespaceList">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`workflow.namespace`)" prop="spec.namespace" :rules="{required: true, message: '命名空间不能为空', trigger: ['blur','change']}">
        <el-select v-model="job.spec.namespace" filterable placeholder="请选择" size="small" style="width: 220px;" @change="getResourceList">
          <el-option v-for="item in namespaceList" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`workflow.resourceName`)" prop="spec.patch_items" :rules="{required: true, message: '资源名称不能为空', trigger: ['blur','change']}">
        <el-select
          placeholder="请选择"
          size="small"
          :popper-append-to-body="false"
          @change="handleResourceChange"
          style="width: 220px;"
          filterable
          v-model="job.spec.patch_items"
          value-key="value"
          multiple
        >
          <el-option v-for="(item,index) in resourceList" :key="index" :label="`${item.resource_kind}/${item.resource_name}`" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t(`workflow.updateContent`)" prop="spec.patch_content" style="min-height: 150px;">
        <el-collapse v-model="activeName" v-if="job.spec.patch_items.length > 0">
          <div v-for="(item,index) in job.spec.patch_items" :key="index">
            <el-collapse-item :name="item.resource_name" class="mg-l8">
              <template slot="title">{{item.resource_name}}</template>
              <div class="content">
                <div class="content-editor">
                  <div class="flex">
                    <span>模板</span>
                    <el-dropdown @command="handleCommand($event,item)">
                      <span class="el-dropdown-link">
                        {{item.patch_strategy}}
                        <i class="el-icon-arrow-down el-icon--right"></i>
                      </span>
                      <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item command="json">json</el-dropdown-item>
                        <el-dropdown-item command="merge">merge</el-dropdown-item>
                        <el-dropdown-item command="strategic-merge">strategic merge</el-dropdown-item>
                      </el-dropdown-menu>
                    </el-dropdown>
                  </div>
                  <codemirror
                    class="codemirror"
                    ref="yamlEditor"
                    v-model="item.patch_content"
                    style="min-height: 200px; border: 1px solid #ddd;"
                    :options="item.patch_strategy==='json' ? editorJsonOptions:editorOptions"
                    @input="onCmCodeChange($event,item)"
                    @blur="getPatchEnv(item.patch_content,item)"
                  ></codemirror>
                  <div
                    v-if="item.patch_strategy!=='json'&&item.errors && item.errors.length > 0"
                    class="yaml-errors__container yaml-errors__accordion-opened"
                  >
                    <ul class="yaml-errors__errors-list">
                      <li v-for="(error,index) in item.errors" :key="index" class="yaml-errors__errors-list-item">
                        <div class="yaml-errors__errors-list-item-text">{{error.message}}</div>
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="content-env">
                  <div>变量</div>
                  <el-row class="th">
                    <el-col :span="6" class="th-title">键</el-col>
                    <el-col :span="8" class="th-title">类型</el-col>
                    <el-col :span="6" class="th-title">值</el-col>
                  </el-row>
                  <el-row v-for="(app,index) in item.params" :key="index" :gutter="2">
                    <el-col :span="6">
                      <el-form-item>
                        <span>{{app.name}}</span>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item>
                        <el-select
                          v-model="app.type"
                          :placeholder="$t(`global.type`)"
                          size="small"
                          :class="{'partial-width': app.type === 'choice'}"
                          style="display: inline-block; width: 80%; margin-right: 6px;"
                          @change="changeEnvType(index,app)"
                        >
                          <el-option label="字符串" value="string"></el-option>
                          <el-option label="枚举" value="choice"></el-option>
                        </el-select>
                        <i v-show="app.type === 'choice'" class="el-icon-edit edit-icon" @click="updateKeyParams(index,app)"></i>
                      </el-form-item>
                    </el-col>

                    <el-col :span="6">
                      <el-form-item>
                        <el-select v-if="app.type==='choice'" v-model="app.value" placeholder="默认值" size="small" style="max-width: 176px;">
                          <el-option v-for="option in app.choice_option" :key="option" :label="option" :value="option"></el-option>
                        </el-select>
                        <el-input v-if="app.type==='string'" :disabled="app.auto_generate" :placeholder="$t(`global.value`)" v-model="app.value" size="small"></el-input>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-collapse-item>
          </div>
        </el-collapse>
      </el-form-item>
    </el-form>
    <el-dialog :visible.sync="dialogVisible" title="枚举" width="600px" :close-on-click-modal="false" :show-close="false" append-to-body>
      <el-form ref="form" :model="currentVars" label-position="left" label-width="100px">
        <el-form-item label="变量名称">
          <el-input v-model="currentVars.name" size="small"></el-input>
        </el-form-item>
        <el-form-item label="可选值">
          <el-input type="textarea" v-model="currentVars.choice_option" placeholder="可选值之间用英文 “,” 隔开" size="small" rows="4"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveVariable" size="small">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getClusterListAPI,
  getNamespaceListAPI,
  getResourcesListAPI,
  getPatchEnvAPI,
  validateYamlAPI
} from '@api'
import {
  validateJobName,
  editorOptions,
  editorJsonOptions
} from '../../config.js'
import { codemirror } from 'vue-codemirror'
import { debounce, cloneDeep } from 'lodash'

export default {
  name: 'JobK8sDeploy',
  props: {
    job: {
      type: Object,
      default: () => ({})
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    },
    globalEnv: {
      type: Array,
      default: () => []
    }
  },
  components: {
    codemirror
  },
  data () {
    return {
      validateJobName,
      editorOptions,
      editorJsonOptions,
      namespaceList: [],
      resourceList: [],
      clusters: [],
      dialogVisible: false,
      currentVars: {},
      curItem: {}
    }
  },
  computed: {
    activeName () {
      return this.job.spec.patch_items.map(item => item.resource_name)
    }
  },
  created () {
    this.getClusterList()
  },
  methods: {
    getClusterList () {
      return getClusterListAPI().then(res => {
        this.clusters = res.filter(element => element.status === 'normal')
        this.getNamespaceList()
      })
    },
    getNamespaceList () {
      if (this.job.spec.cluster_id) {
        return getNamespaceListAPI(this.job.spec.cluster_id).then(res => {
          this.namespaceList = res
          this.getResourceList()
        })
      }
    },
    getResourceList () {
      if (this.job.spec.namespace) {
        return getResourcesListAPI(
          this.job.spec.cluster_id,
          this.job.spec.namespace
        ).then(res => {
          res.forEach(item => {
            item.value = `${item.resource_kind}/${item.resource_name}`
          })
          this.resourceList = res
        })
      }
    },
    handleResourceChange (val) {
      val.forEach(item => {
        if (!item.patch_strategy) {
          item.patch_strategy = 'strategic-merge'
        }
      })
    },
    handleCommand (val, item) {
      if (val === 'json') {
        this.$set(
          item,
          'patch_content',
          JSON.stringify([
            {
              op: '',
              path: '',
              value: ''
            }
          ])
        )
      } else {
        this.$set(item, 'patch_content', '')
      }
      this.$set(item, 'patch_strategy', val)
    },
    onCmCodeChange: debounce(function (newCode, item) {
      if (item.patch_strategy === 'json') return
      this.$set(item, 'errors', [])
      this.validateYaml(newCode, item)
    }, 200),
    validateYaml (code, item) {
      validateYamlAPI({ yaml: code }).then(res => {
        if (res && res.length > 0) {
          this.$set(item, 'errors', res)
          this.$forceUpdate()
        } else if (res && res.length === 0) {
          this.$set(item, 'errors', [])
        }
      })
    },
    getPatchEnv (val, item) {
      const params = {
        patch_content: val,
        params: item.params
      }
      getPatchEnvAPI(params).then(res => {
        this.$set(item, 'params', res)
      })
    },
    changeEnvType (index, item) {
      this.curItem = item
      this.curItem.value = ''
      this.updateKeyParams(index, this.curItem)
    },
    updateKeyParams (index, item) {
      this.curItem = item
      this.dialogVisible = true
      const current = item
      this.currentVars = cloneDeep({
        index,
        ...current,
        choice_option: current.choice_option
          ? current.choice_option.join(',')
          : ''
      })
    },
    saveVariable () {
      this.dialogVisible = false
      const choice_option = this.currentVars.choice_option.split(',')
      this.curItem.choice_option = choice_option
      this.$set(this.curItem, 'name', this.currentVars.name)
      if (!choice_option.includes(this.curItem.value)) {
        this.curItem.value = ''
      }
    },
    getData () {
      this.job.spec.patch_items.forEach(item => {
        if (item.errors) {
          delete item.errors
        }
      })
      return this.job
    },
    validate () {
      const errors = []
      this.job.spec.patch_items.forEach(item => {
        if (item.errors && item.errors.length > 0) {
          errors.push(item.errors)
        }
      })
      if (errors.length > 0) {
        this.$message({
          message: '请检查模板格式',
          type: 'error'
        })
      } else {
        return this.$refs.ruleForm.validate()
      }
    }
  },
  watch: {
    job: {
      handler (val) {
        if (val) {
          val.spec.patch_items.forEach(item => {
            item.value = `${item.resource_kind}/${item.resource_name}`
          })
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>
<style lang="less" scoped>
.job-k8s-deploy {
  .form-item {
    display: inline-block;
    width: 220px;
  }

  .content {
    display: flex;
    justify-content: space-between;

    &-editor {
      width: 50%;
      margin-right: 16px;

      .flex {
        display: flex;
        justify-content: space-between;

        .el-dropdown-link {
          color: #06f;
          cursor: pointer;
        }
      }

      .yaml-errors__container {
        position: relative;
        margin-bottom: 0;
        overflow-y: hidden;
        background-color: #eb5848;

        .yaml-errors__errors-list {
          max-height: 0;
          max-height: 180px;
          margin: 0;
          padding: 0 15px;
          padding-top: 5px;
          padding-bottom: 5px;
          list-style: none;
          background-color: #eb5848;
          transition: max-height 200ms ease-out;

          .yaml-errors__errors-list-item {
            display: flex;
            align-items: center;
            min-height: 35px;
            padding-left: 10px;
            color: #fff;
            font-size: 14px;
            background-color: #eb5848;
            border-bottom: 1px solid #ff7666;

            .yaml-errors__errors-list-item-counter {
              margin-right: 20px;
              font-weight: bold;
            }

            .yaml-errors__errors-list-item-text {
              flex: 1;
              width: 300px;
              max-width: 100%;
              padding: 5px 0;
              line-height: 20px;
            }

            &:last-child {
              border-bottom: none;
            }
          }
        }
      }
    }

    &-env {
      flex: 1;

      .th {
        margin-bottom: 16px;
        padding: 4px;
        font-weight: 500;
        background: #eaeaea;

        &-title {
          display: inline-block;
          color: @primaryColor;
          font-weight: 300;
          font-size: 14px;
          line-height: 28px;
        }
      }

      .el-icon-edit {
        cursor: pointer;
      }
    }
  }

  .status-check {
    /deep/ .el-form-item__label {
      line-height: 20px;
    }
  }
}
</style>
