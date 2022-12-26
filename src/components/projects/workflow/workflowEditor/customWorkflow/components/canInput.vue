<template>
  <div class="can-input" :style="{width: width}">
    <span v-if="!isCanInput">
      <el-tooltip effect="dark" :content="inputValue" placement="top">
        <span>{{ $utils.tailCut(inputValue,14) }}</span>
      </el-tooltip>
      <span class="tip" v-if="!inputValue">{{placeholder}}</span>
      <i class="icon el-icon-edit" @click="handleInput(true)" v-show="!isCanInput" v-if="from==='ui'&&!disabled"></i>
    </span>
    <span v-else class="input">
      <el-form-item prop="display_name" :rules="{required: true,message:this.$t(`workflow.inputWorkflowName`), trigger: ['blur', 'change']}">
        <el-input
          v-model="inputValue"
          type="text"
          size="mini"
          :placeholder="placeholder"
          @focus="handleInput(true)"
          @blur="handleInput(false)"
        ></el-input>
      </el-form-item>
      <el-button type="text" @click="handleInput(false)" size="mini" class="mg-l8">{{$t(`global.confirm`)}}</el-button>
    </span>
  </div>
</template>

<script>
export default {
  name: 'CanInput',
  data () {
    return {
      isCanInput: false
    }
  },
  props: {
    placeholder: {
      type: String,
      default: '请输入'
    },
    width: {
      type: String,
      default: '200px'
    },
    value: {
      type: String,
      default: ''
    },
    from: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    inputValue: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  },
  methods: {
    handleInput (val) {
      this.isCanInput = val
    }
  }
}
</script>

<style lang="less" scoped>
.can-input {
  display: flex;
  align-items: center;
  width: 100%;
  color: @projectNameColor;
  font-size: 14px;
  // max-width: 150px;

  .tip {
    color: #a0a0a0;
  }

  .icon {
    display: inline-block;
    margin-left: 8px;
  }

  .input {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
