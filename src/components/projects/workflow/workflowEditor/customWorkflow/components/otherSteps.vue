<template>
  <section class="other-step-container">
    <div class="common-parcel-block" v-if="object_storage_upload_enabled || post_script_enabled">
      <div v-for="(step, index) in otherSteps" :key="index">
        <div class="dashed-container" v-if="post_script_enabled && step.name === 'shell'">
          <div class="primary-title">
            Shell 脚本执行
            <el-button type="text" @click="removeScript" icon="el-icon-delete"></el-button>
          </div>
          <div class="script-content">
            <Editor v-model="shell.script" height="100%"></Editor>
          </div>
        </div>
        <el-form
          v-if="object_storage_upload_enabled && step.name === 'archive'"
          :model="archive"
          :rules="object_storage_rules"
          ref="objectStorageRef"
          label-width="170px"
          class="secondary-form"
          label-position="left"
        >
          <div class="dashed-container">
            <span class="primary-title">
              文件存储
              <el-button type="text" @click="removeObject" icon="el-icon-delete"></el-button>
            </span>
            <el-form-item label="对象存储" prop="object_storage_id">
              <el-select
                size="small"
                v-model="archive.object_storage_id"
                placeholder="请选择对象存储"
                @change="$refs.objectStorageRef[0].clearValidate()"
              >
                <el-option v-for="(item,index) in objectStorageList" :key="index" :label="`${item.endpoint}/${item.bucket}`" :value="item.id"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="上传文件" prop="upload_detail">
              <template v-if="archive.upload_detail.length > 0">
                <el-row v-for="(item,index) in archive.upload_detail" :key="index">
                  <el-col :span="11">
                    <el-input v-model="item.file_path" style="max-width: 100%;" size="small">
                      <template slot="prepend">$WORKSPACE/</template>
                    </el-input>
                  </el-col>
                  <el-col :span="1" style="text-align: center;">to</el-col>
                  <el-col :span="8">
                    <el-input v-model="item.dest_path" size="small"></el-input>
                  </el-col>
                  <el-col :span="4">
                    <div class>
                      <el-button @click="removeObjectStorage(index)" type="danger" icon="el-icon-minus" size="mini" circle plain></el-button>
                      <el-button
                        v-if="index === archive.upload_detail.length - 1"
                        type="primary"
                        icon="el-icon-plus"
                        @click="addObjectStorage"
                        size="mini"
                        circle
                        plain
                      ></el-button>
                    </div>
                  </el-col>
                </el-row>
              </template>
              <el-button v-else type="plain" icon="el-icon-plus" @click="addObjectStorage" size="mini" circle plain></el-button>
            </el-form-item>
          </div>
        </el-form>
      </div>
    </div>
    <div style="margin: 14px 0 8px;">
      <el-dropdown @command="addExtra">
        <el-button type="primary" size="small" plain>
          添加步骤
          <i style="margin-left: 8px;" class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="script" :disabled="post_script_enabled">Shell 脚本执行</el-dropdown-item>
          <el-dropdown-item command="object" :disabled="object_storage_upload_enabled">文件存储</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </section>
</template>

<script>
import Editor from 'vue2-ace-bind'
import { getStorageListAPI } from '@api'
export default {
  props: {
    steps: Array,
    validObj: Object
  },
  data () {
    return {
      object_storage_rules: {
        object_storage_id: [
          {
            type: 'string',
            message: '请选择对象存储',
            required: true,
            trigger: 'blur'
          }
        ],
        upload_detail: [
          {
            type: 'array',
            required: true,
            validator: (rule, value, callback) => {
              const empty = value.every(item => {
                return !item.file_path || !item.dest_path
              })
              if (value.length === 0) {
                callback(new Error('请至少添加一个上传文件'))
              } else if (empty) {
                callback(new Error('上传文件路径为空，请检查'))
              } else {
                callback()
              }
            }
          }
        ]
      },
      objectStorageList: [],
      object_storage_upload_enabled: false,
      post_script_enabled: false
    }
  },
  computed: {
    archive () {
      const archive = this.steps.find(step => step.name === 'archive')
      return archive ? archive.spec : null
    },
    shell () {
      const shell = this.steps.find(step => step.name === 'shell')
      return shell ? shell.spec : null
    },
    otherSteps () {
      return this.steps.filter(step => ['archive', 'shell'].includes(step.name))
    }
  },
  methods: {
    initStepStatus (steps) {
      this.object_storage_upload_enabled = !!steps.archive
      this.post_script_enabled = true
      this.addExtra('script')
    },
    addExtra (command) {
      if (command === 'script') {
        this.post_script_enabled = true
        if (!this.shell) {
          this.steps.push({
            name: 'shell',
            type: 'shell',
            spec: {
              script: '#!/bin/bash\nset -e'
            }
          })
        }
      }
      if (command === 'object') {
        this.object_storage_upload_enabled = true
        if (!this.archive) {
          this.steps.push({
            name: 'archive',
            type: 'archive',
            spec: {
              object_storage_id: '',
              upload_detail: [] // { file_path: '', dest_path: '' }
            }
          })
        }
      }
    },
    removeScript () {
      this.post_script_enabled = false
      const id = this.steps.findIndex(step => step.name === 'shell')
      this.steps.splice(id, 1)
    },
    removeObject () {
      this.object_storage_upload_enabled = false
      const id = this.steps.findIndex(step => step.name === 'archive')
      this.steps.splice(id, 1)
    },
    addObjectStorage () {
      this.archive.upload_detail.push({
        file_path: '',
        dest_path: ''
      })
    },
    removeObjectStorage (index) {
      this.archive.upload_detail.splice(index, 1)
    },
    getUsedData () {
      const key = this.$utils.rsaEncrypt()
      getStorageListAPI(key).then(res => {
        this.objectStorageList = res
      })
    },
    validate () {
      const valid = []
      if (this.object_storage_upload_enabled) {
        valid.push(this.$refs.objectStorageRef[0].validate())
      }
      return Promise.all(valid)
    }
  },
  created () {
    this.getUsedData()
    this.validObj.addValidate({
      name: 'otherStepsValid',
      valid: this.validate
    })
  },
  components: {
    Editor
  }
}
</script>

<style lang="less" scoped>
.other-step-container {
  .common-parcel-block {
    padding: 0;

    .primary-title {
      margin: 0;
      line-height: 28px;
    }

    /deep/.el-form.secondary-form {
      .el-input,
      .el-select {
        width: 100%;
      }

      .el-form-item {
        margin-bottom: 15px;
      }
    }
  }

  .script-content {
    height: 250px;
    border: 1px solid @borderGray;
  }
}
</style>
