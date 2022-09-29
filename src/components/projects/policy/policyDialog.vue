<template>
  <el-dialog :visible.sync="dialogVisible" width="50%">
    <div
      slot="title"
      style="text-align: center;"
    >{{ mode | desc }}协作模式 {{ mode === 'updated' ? collaborationData.initName : collaborationData.name }}</div>
    <div class="policy-content">
      <div
        class="title update-name"
        v-if="mode === 'updated' && collaborationData.initName !== collaborationData.name"
      >协作模式名称修改为：{{ collaborationData.name }}</div>
      <div v-for="key in Object.keys(changedInfo)" :key="key">
        <div class="title">
          您将
          <span class="title-weight" :class="[key]">{{ key | desc }}</span>
          以下用户权限：
        </div>
        <div class="content" :style="{ 'margin-top' : key === 'updated' ? '10px' : '0' }">
          <div class="role" v-if="key !== 'updated'">
            <span class="member" v-for="member in changedInfo[key].members" :key="member">{{ member }}</span>
          </div>
          <div v-for="workflow in changedInfo[key].workflows" :key="workflow.name">
            {{ workflow.collaboration_type === 'new' ? '独享': '共享' }}工作流 {{ workflow.name }} ：
            <span
              v-for="(verb, index) in workflow.verbs"
              :key="verb"
            >{{ policyMap.workflow[verb] }}{{ workflow.verbs.length - 1 !== index ? '、' : '' }}</span>
            <span v-if="workflow.verbs.length === 0">无</span>
            权限
          </div>
          <div v-for="product in changedInfo[key].products" :key="product.name">
            {{ product.collaboration_type === 'new' ? '独享': '共享' }}环境 {{ product.name }} ：
            <span
              v-for="(verb, index) in product.verbs"
              :key="verb"
            >{{ policyMap.environment[verb] }}{{ product.verbs.length - 1 !== index ? '、' : '' }}</span>
            <span v-if="product.verbs.length === 0">无</span>
            权限
          </div>
          <div v-if="changedInfo.updated && changedInfo.updated.recycle_day">资源回收策略更新为 {{ changedInfo.updated.recycle_day }} 天。</div>
        </div>
      </div>
      <div class="title">请确认！</div>
    </div>
    <div slot="footer">
      <el-button size="small" @click="dialogVisible = false" :disabled="loading">取 消</el-button>
      <el-button size="small" type="primary" @click="handleCollaboration" :loading="loading">确 定</el-button>
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
      loading: false
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
    desc (val) {
      const info = {
        added: '增加',
        deleted: '删除',
        updated: '更新'
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

  .added {
    color: #06f;
  }

  .deleted {
    color: #f56c6c;
  }

  .updated {
    color: #e6a23c;
  }

  .member {
    margin-right: 10px;
    color: #888;
  }

  .update-name {
    margin-bottom: 15px;
  }

  .title {
    font-size: 15px;
  }

  .content {
    margin-bottom: 10px;
    padding: 0 8px;
    line-height: 2;

    .role {
      line-height: 2.5;
    }
  }
}
</style>
