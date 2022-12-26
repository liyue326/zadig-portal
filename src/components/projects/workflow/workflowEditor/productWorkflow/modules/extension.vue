<template>
  <el-card class="product-extension">
    <el-form ref="extensionForm" :model="extensionStage" :rules="rules" label-position="left" label-width="100px">
      <el-form-item label="URL">
        <el-row :gutter="10">
          <el-col :span="8">
            <el-form-item prop="url">
              <el-select v-model="extensionStage.url" placeholder="选择外部系统" size="small" clearable>
                <el-option v-for="external in externalList" :key="external.id" :label="external.server" :value="external.server"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="path">
              <el-input v-model="extensionStage.path" placeholder="输入访问路径" size="small"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item label="Headers">
        <el-table :data="extensionStage.headers" style="width: 100%;">
          <el-table-column label="Header Name">
            <template slot-scope="{row}">
              <el-input v-model="row.key" placeholder="Header Name" size="small"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="Header Value">
            <template slot-scope="{row}">
              <el-input v-model="row.value" placeholder="Header Value" size="small"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="value" :label="$t(`global.operation`)" width="100px">
            <template slot-scope="{$index}">
              <el-button style="font-size: 20px;" type="text" icon="el-icon-remove-outline" @click="deleteHeader($index)"></el-button>
              <el-button style="font-size: 20px;" type="text" icon="el-icon-circle-plus-outline" @click="addHeader"></el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="text" @click="addHeader" class="add-header">{{$t(`global.add`)}}</el-button>
      </el-form-item>
      <el-form-item label="是否回调">
        <el-switch v-model="extensionStage.is_callback"></el-switch>
        <div v-show="extensionStage.is_callback">
          请根据
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/project/workflow/#扩展`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
          调用接口：{{`${origin}/api/callback`}}
        </div>
      </el-form-item>
      <el-form-item :label="$t(`global.timeout`)" v-show="extensionStage.is_callback">
        <el-input-number v-model="extensionStage.timeout" :min="1" :max="100" size="small"></el-input-number>分钟
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
import { getExternalSystemsAPI } from '@api'
import bus from '@utils/eventBus'
export default {
  data () {
    this.rules = {
      url: {
        required: true,
        message: '请选择外部系统',
        trigger: 'blur'
      },
      path: {
        required: true,
        message: '请输入访问路径',
        trigger: 'blur'
      }
    }
    return {
      externalList: [],
      origin: location.origin
    }
  },
  props: {
    extensionStage: Object
  },
  methods: {
    addHeader () {
      this.extensionStage.headers.push({ key: '', value: '' })
    },
    deleteHeader (index) {
      this.extensionStage.headers.splice(index, 1)
    }
  },
  created () {
    const key = this.$utils.rsaEncrypt()
    getExternalSystemsAPI(key).then(res => {
      this.externalList = res.external_system
    })
    bus.$on('check-tab:extension', () => {
      this.$refs.extensionForm.validate(valid => {
        bus.$emit('receive-tab-check:extension', valid)
      })
    })
  },
  beforeDestroy () {
    bus.$off('check-tab:extension')
  }
}
</script>

<style lang="less" scoped>
.product-extension {
  /deep/.el-input,
  .el-select {
    width: 100%;
  }

  /deep/.el-form {
    .el-form-item {
      margin-bottom: 12px;
    }
  }

  /deep/.el-table {
    th.el-table__cell {
      padding: 8px 0;
      color: #4a4a4a;
      font-weight: 400;
      line-height: 24px;
      background: #eaeaea;

      &.is-leaf {
        border-block-width: 0;
      }
    }

    .el-table__cell {
      padding: 0;
    }

    .el-table__empty-block {
      min-height: 48px;

      .el-table__empty-text {
        line-height: 48px;
      }
    }
  }

  .add-header {
    margin-left: 5px;
    font-size: 13px;
  }
}
</style>
