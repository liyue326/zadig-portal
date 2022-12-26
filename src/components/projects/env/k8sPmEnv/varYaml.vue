<template>
  <div class="variable-list">
    <div class="primary-title" style="margin-bottom: 0;">
      <span>{{$t('environments.k8s.globalVariables')}}</span>
      <i
        style="margin-left: 10px; cursor: pointer;"
        :class="[showYaml ? 'el-icon-arrow-up' : 'el-icon-arrow-down']"
        @click="showYaml = !showYaml"
      ></i>
    </div>
    <div class="content" v-show="showYaml">
      <Resize class="desc mirror" @sizeChange="$refs.codemirror.refresh()">
        <CodeMirror ref="codemirror" v-model="curYaml" />
      </Resize>
    </div>
  </div>
</template>

<script>
import Resize from '@/components/common/resize'
import CodeMirror from '@/components/projects/common/codemirror.vue'
export default {
  props: {
    value: {
      default: '',
      type: String
    }
  },
  data () {
    return {
      showYaml: false
    }
  },
  computed: {
    curYaml: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  },
  components: {
    Resize,
    CodeMirror
  }
}
</script>

<style lang="less" scoped>
.variable-list {
  .content {
    width: 90%;
    max-width: 1000px;
    margin-top: 14px;
  }
}
</style>
