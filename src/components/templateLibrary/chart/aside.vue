<template>
  <div class="chart-aside">
    <div class="aside-bar">
      <div class="bar-title" :class="{selected:selected === 'var' }" @click="selected = 'var'">{{$t(`templates.helmChart.variablesList`)}}</div>
      <div class="bar-title" :class="{selected:selected === 'reference' }" @click="selected = 'reference'">{{$t(`templates.helmChart.referenceList`)}}</div>
    </div>
    <div class="aside-content">
      <ReferenceList v-if="selected === 'reference'"/>
      <VariableList v-if="selected === 'var'" :systemVariables="systemVariables" :customVariables="customVariables"/>
    </div>
  </div>
</template>

<script>
import ReferenceList from './aside/referenceList.vue'
import VariableList from './aside/variableList.vue'
export default {
  data () {
    return {
      selected: 'var'
    }
  },
  props: {
    systemVariables: {
      require: true,
      type: Array
    },
    customVariables: {
      require: true,
      type: Array
    }
  },
  components: {
    ReferenceList,
    VariableList
  }
}
</script>

<style lang="less" scoped>
.chart-aside {
  display: flex;
  flex-direction: row-reverse;

  .aside-bar {
    width: 47px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;

    .bar-title {
      margin: 0 0 1px 1px;
      padding: 20px 17px;
      text-transform: uppercase;
      transition: all 0.5s;
      writing-mode: vertical-rl;

      &.selected,
      &:hover {
        background-color: #fff;
        box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
      }
    }
  }

  .aside-content {
    flex: 1;
    width: calc(~'100% - 47px');
  }
}
</style>
