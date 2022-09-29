<template>
  <div class="filter-status">
    <el-popover ref="popoverRef" placement="bottom" :offset="filterInfo.type ? 90 : 0" trigger="click">
      <div class="filter-content">
        <div class="content left">
          <el-radio-group v-model="filterInfo.type" @change="updateFilter">
            <el-radio v-for="item in filteredItems" :key="item.value" :label="item.value">{{ item.text }}</el-radio>
          </el-radio-group>
          <div class="bottom" style="text-align: center;">
            <el-button type="text" size="mini" @click="clearFilter">清空</el-button>
          </div>
        </div>
        <div class="content right" v-show="filterInfo.type">
          <el-input v-model="filterInfo.search" size="mini" placeholder="搜索" suffix-icon="el-icon-search"></el-input>
          <div class="middle">
            <el-checkbox-group v-model="filterInfo.selectList">
              <el-checkbox
                class="filter-item"
                v-for="(value, index) in filteredList"
                :key="index"
                :label="value"
              >{{ value.text || value }}</el-checkbox>
            </el-checkbox-group>
          </div>
          <div class="bottom">
            <el-button type="primary" plain @click="submit" size="mini" style="width: 100%;">确认</el-button>
          </div>
        </div>
      </div>
      <el-button
        v-show="!filterInfo.searchList.length"
        type="primary"
        slot="reference"
        size="mini"
        plain
        style=" margin-left: 10px; padding: 3px;"
      >
        <i class="iconfont iconfilter"></i>
      </el-button>
    </el-popover>
    <span class="show-filter" v-if="filterInfo.searchList.length">
      <el-button type="primary" size="mini" plain style=" margin-left: 10px; padding: 3px;" @click="clearFilter">
        <i class="el-icon-close" style="font-size: 16px;"></i>
      </el-button>
      <span class="filter-list" v-if="showFilterRes">
        {{ filteredItems.find(item => item.value === filterInfo.type).text || '过滤' }}:
        {{ filterInfo.searchList.map(li =>li.text || li).join(',') }}
      </span>
    </span>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
export default {
  props: {
    filteredItems: {
      type: Array,
      required: true,
      default: () => [] // {value, text}
    },
    defaultFilterList: Object,
    getFilterList: Function,
    showFilterRes: {
      default: true,
      type: Boolean
    }
  },
  data () {
    return {
      filterList: {}, // type: []
      filterInfo: {
        type: '',
        search: '',
        list: [],
        selectList: [],
        searchList: []
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    filteredList () {
      const search = this.filterInfo.search
      return this.filterInfo.list.filter(list => {
        const value = list.text || list
        return value.includes(search)
      })
    }
  },
  methods: {
    init () {
      this.filterInfo = {
        type: '',
        search: '',
        list: [],
        selectList: [],
        searchList: []
      }
      this.filterList = { ...this.defaultFilterList }
    },
    async updateFilter (value) {
      if (!this.filterList[value]) {
        const res = await this.getFilterList({ type: value })
        this.$set(this.filterList, value, res)
      }
      this.filterInfo.search = ''
      this.filterInfo.selectList = []
      this.filterInfo.list = this.filterList[value]
    },
    clearFilter () {
      this.initFilterInfo()
      this.submit(false)
    },
    initFilterInfo () {
      this.filterInfo = {
        type: '',
        search: '',
        list: [],
        selectList: [],
        searchList: []
      }
    },
    submit (close = true) {
      this.$emit('updateFilter', {
        type: this.filterInfo.type,
        list: this.filterInfo.selectList
      })
      this.filterInfo.searchList = cloneDeep(this.filterInfo.selectList)
      if (close) {
        this.$refs.popoverRef.showPopper = false
      }
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="less" scoped>
.filter-status {
  flex: 1;

  .show-filter {
    display: flex;
    align-items: center;

    .filter-list {
      display: inline-block;
      margin-left: 8px;
      font-size: 14px;
    }
  }
}

.filter-content {
  display: flex;
  margin: auto;

  .content {
    position: relative;
    flex: 1 0 auto;
    min-width: 150px;

    .bottom {
      position: absolute;
      right: 0;
      bottom: 3px;
    }

    &.left {
      /deep/.el-radio-group {
        margin-bottom: 28px;

        .el-radio {
          display: block;
          line-height: 2;
        }
      }

      .bottom {
        left: 0;
      }
    }

    &.right {
      padding-left: 12px;
      border-left: 1px solid #ebedef;

      .middle {
        max-height: 200px;
        margin-bottom: 28px;
        padding: 5px;
        overflow: auto;

        /deep/.el-input {
          width: 100%;
        }

        .filter-item {
          display: block;
          line-height: 1.6;
        }
      }

      .bottom {
        left: 12px;
      }
    }
  }
}
</style>
