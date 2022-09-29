<template>
  <el-dropdown @command="handleCommand($event,value)" class="dropdown">
    <span class="el-dropdown-link">
      <i class="iconfont iconshuru" v-if="!type || type === 'runtime'"></i>
      <i class="iconfont icongudingzhi" v-if="type === 'fixed'"></i>
      <i class="iconfont iconhanshu" v-if="type === 'other'"></i>
    </span>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item command="runtime" v-if="isRuntime">
        <span class="iconfont iconshuru"></span>
        运行时输入
      </el-dropdown-item>
      <el-dropdown-item command="fixed" v-if="isFixed">
        <span class="iconfont icongudingzhi"></span>
        固定值
      </el-dropdown-item>
      <el-dropdown-item command="other" v-if="isOther">
        <span class="iconfont iconhanshu"></span>
        {{isService?'其他任务输出':'全局变量'}}
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>
<script>
export default {
  components: {},
  model: {
    prop: 'value',
    event: 'change'
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    isFixed: {
      type: Boolean,
      default: false
    },
    isRuntime: {
      type: Boolean,
      default: false
    },
    isOther: {
      type: Boolean,
      default: false
    },
    isService: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      type: ''
    }
  },
  methods: {
    handleCommand (val) {
      this.type = val
      this.$emit('change', val)
    }
  },
  watch: {
    value: {
      handler (val) {
        this.type = val
      },
      immediate: true
    }
  }
}
</script>
<style lang="less" scoped>
.dropdown {
  color: #06f;
  cursor: pointer;

  .iconfont {
    cursor: pointer;
  }
}
</style>
