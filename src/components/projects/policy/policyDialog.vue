<template>
  <el-dialog :visible.sync="dialogVisible" width="50%">
    <div
      slot="title"
      style="text-align: center;"
    >{{ mode | desc(that) }}协作模式 {{ mode === 'updated' ? collaborationData.initName : collaborationData.name }}</div>
    <div class="policy-content">
      <div
        class="title update-name"
        v-if="mode === 'updated' && collaborationData.initName !== collaborationData.name"
      >协作模式名称修改为：{{ collaborationData.name }}</div>
      <div v-for="key in Object.keys(changedInfo)" :key="key">
        <div v-if="key !== 'updated'" class="title-container">
          <span>确认为以下用户</span>
        </div>
        <ul class="member-container" v-if="key !== 'updated'">
          <li v-for="member in changedInfo[key].members" :key="member" class="member">
            <span class="icon iconfont iconvery-user"></span>
            <span class="name">{{ member }}</span>
          </li>
        </ul>
        <div class="permission-desc">
          <span :class="[key]">{{ key | desc(that) }}</span>
          <span>以下权限</span>
        </div>
        <div class="content">
          <div v-for="workflow in changedInfo[key].workflows" :key="workflow.name" class="resource-container">
            <div class="resource-name">{{ workflow.collaboration_type === 'new' ? '独享': '共享' }}工作流 {{ workflow.display_name }} ：</div>
            <ul class="permission-list">
              <li v-for="(verb, index) in workflow.verbs" :key="index" class="permission">
                <span v-if="key ==='added'||key ==='updated'" class="icon added el-icon-circle-check"></span>
                <span v-if="key ==='deleted'" class="icon deleted el-icon-circle-close"></span>
                <span class="name">{{ policyMap.workflow[verb] }}</span>
              </li>
            </ul>
            <span v-if="workflow.verbs.length === 0">{{$t('global.emptyText')}}</span>
          </div>
          <div v-for="product in changedInfo[key].products" :key="product.name" class="resource-container">
            <div class="resource-name">{{ product.collaboration_type === 'new' ? '独享': '共享' }}环境 {{ product.name }} ：</div>
            <ul class="permission-list">
              <li v-for="(verb, index) in product.verbs" :key="index" class="permission">
                <span v-if="key ==='added'||key ==='updated'" class="icon added el-icon-circle-check"></span>
                <span v-if="key ==='deleted'" class="icon deleted el-icon-circle-close"></span>
                <span class="name">{{ policyMap.environment[verb] }}</span>
              </li>
              <span v-if="product.verbs.length === 0">{{$t('global.emptyText')}}</span>
            </ul>
          </div>
          <div v-if="changedInfo.updated && changedInfo.updated.recycle_day">资源回收策略更新为 {{ changedInfo.updated.recycle_day }} 天。</div>
        </div>
      </div>
    </div>
    <div slot="footer">
      <el-button size="small" @click="dialogVisible = false" :disabled="loading">{{$t(`global.cancel`)}}</el-button>
      <el-button size="small" type="primary" @click="handleCollaboration" :loading="loading">{{$t(`global.confirm`)}}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  createCollaborationAPI,
  updateNewCollaborationAPI,
  deleteCollaborationAPI
} from '@api'
import { cloneDeep } from 'lodash'
export default {
  props: {
    changedInfo: Object,
    visible: Boolean,
    policyMap: Object,
    collaborationData: Object,
    mode: String, // added updated deleted
    deleteMode: Function,
    updateActiveName: Function
  },
  data () {
    return {
      loading: false,
      that: this
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    dialogVisible: {
      get () {
        return this.visible
      },
      set (val) {
        if (!val) {
          this.loading = false
        }
        this.$emit('update:visible', val)
      }
    }
  },
  filters: {
    desc (val, that) {
      const info = {
        added: that.$t('global.add'),
        deleted: that.$t('global.delete'),
        updated: that.$t('global.update')
      }
      return info[val]
    }
  },
  methods: {
    updateCollaboration (payload) {
      this.collaborationData.initName = payload.name
      this.$set(this.collaborationData, 'initCollaboration', cloneDeep(payload))
      this.updateActiveName(payload.name)
      this.$emit('resetDisabled')
    },
    async handleCollaboration () {
      this.loading = true
      let payload = null
      const fn = payload => {
        delete payload.initName
        delete payload.initCollaboration
        delete payload.saveDisabled
        payload.workflows.forEach(workflow => {
          delete workflow.withDeletePermi
          delete workflow.add
        })
        payload.products.forEach(product => {
          delete product.withDeletePermi
          delete product.add
        })
      }

      const init = payload => {
        payload.workflows.forEach(workflow => {
          const deleteId = workflow.verbs.findIndex(verb =>
            verb.startsWith('delete_')
          )
          if (deleteId !== -1) {
            this.$set(workflow, 'withDeletePermi', true)
          }
          return workflow
        })
        payload.products.forEach(product => {
          const deleteId = product.verbs.findIndex(verb =>
            verb.startsWith('delete_')
          )
          if (deleteId !== -1) {
            this.$set(product, 'withDeletePermi', true)
          }
          return product
        })
      }
      switch (this.mode) {
        case 'added':
          payload = cloneDeep(this.collaborationData)
          fn(payload)
          await createCollaborationAPI(this.projectName, payload).then(() => {
            this.$message.success(`您成功生成了 ${payload.name} 协作模式！`)
            fn(this.collaborationData)
            init(this.collaborationData)
            this.updateCollaboration(payload)
          })
          break
        case 'updated':
          payload = cloneDeep(this.collaborationData)
          fn(payload)
          await updateNewCollaborationAPI(
            this.projectName,
            this.collaborationData.initName,
            payload
          ).then(() => {
            this.$message.success(`您成功更新了 ${payload.name} 协作模式！`)
            fn(this.collaborationData)
            init(this.collaborationData)
            this.updateCollaboration(payload)
          })
          break
        case 'deleted':
          const name = this.collaborationData.initName
          await deleteCollaborationAPI(this.projectName, name).then(() => {
            this.$message.success(`您成功删除了 ${name} 协作模式！`)
            delete this.collaborationData.initCollaboration
            this.deleteMode(name)
          })
          break
        default:
          this.$message.error('模式错误：', this.mode)
      }
      this.loading = false
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="less" scoped>
.policy-content {
  .title-weight {
    display: inline-block;
    margin: 0 2px;
    font-weight: 500;
  }

  .update-name {
    margin-bottom: 15px;
  }

  .title-container {
    span {
      color: #303133;
      font-size: 16px;
    }
  }

  .member-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 5px 5px 5px 0;

    .member {
      display: flex;
      padding: 2px 0;
      font-size: 16px;

      .icon {
        color: @themeColor;
      }

      .name {
        margin-left: 5px;
        color: #333;
        font-weight: 300;
      }
    }
  }

  .permission-desc {
    span {
      color: #303133;
      font-size: 16px;

      &.added {
        color: @themeColor;
      }

      &.deleted {
        color: #f56c6c;
      }

      &.updated {
        color: #e6a23c;
      }
    }
  }

  .content {
    margin-bottom: 10px;

    .resource-container {
      margin: 10px 0;
      padding: 4px;
      border: 1px solid #ccc;
      border-radius: 4px;

      .resource-name {
        padding-bottom: 4px;
        color: #29292f;
        font-size: 14px;
      }

      .permission-list {
        .permission {
          .icon {
            margin-right: 2px;

            &.added {
              color: @themeColor;
            }

            &.deleted {
              color: #f56c6c;
            }

            &.updated {
              color: #e6a23c;
            }
          }

          .name {
            font-size: 13px;
          }
        }
      }
    }
  }
}
</style>
