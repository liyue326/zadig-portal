<template>
  <div class="aside__wrap">
    <div class="aside__inner">
      <div class="aside-bar">
        <div class="tabs__wrap tabs__wrap_vertical">
          <div class="tabs__item" :class="{'selected': $route.query.rightbar === 'reference'}" @click="changeRoute('reference')">
            <span class="step-name">{{$t(`templates.build.referenceList`)}}</span>
          </div>
        </div>
      </div>
      <div class="aside__content">
        <div v-if="$route.query.rightbar === 'reference'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t(`templates.build.referenceList`)}}</div>
          </header>
          <div class="service-aside-box__content">
            <el-table :data="buildReference" stripe style="width: 100%;">
              <el-table-column prop="build_name" :label="$t(`templates.build.buildName`)">
                <template slot-scope="scope">
                  <router-link
                    :to="`/v1/projects/detail/${scope.row.project_name}/builds/detail/${scope.row.build_name}`"
                  >{{scope.row.build_name}}</router-link>
                </template>
              </el-table-column>
              <el-table-column prop="service_module" :label="$t(`global.serviceModule`)">
                <template slot-scope="scope">
                  <template v-if="scope.row.service_module.length > 0">
                    <span v-for="(item,index) in scope.row.service_module" :key="index" style="display: block;">{{item}}</span>
                  </template>
                  <span v-else>{{$t(`templates.build.noneVariable`)}}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { getBuildTemplateReferenceAPI } from '@api'

export default {
  props: {
    isEdit: {
      required: false,
      type: Boolean
    },
    buildConfig: {
      required: true,
      type: Object
    }
  },
  data () {
    return {
      buildReference: []
    }
  },
  computed: {
    buildTemplateId () {
      return this.$route.query.id
    }
  },
  methods: {
    async getBuildReference (id) {
      if (this.isEdit) {
        const res = await getBuildTemplateReferenceAPI(id).catch(err => {
          console.log(err)
        })
        if (res) {
          this.buildReference = res
        }
      }
    },
    changeRoute (step) {
      this.$router.replace({
        query: Object.assign({}, this.$route.query, {
          rightbar: step
        })
      })
    }
  },
  watch: {
    buildConfig: {
      handler (val, old_val) {
        if (val) {
          this.getBuildReference(val.id)
        }
      },
      immediate: false
    }
  }
}
</script>
<style lang="less">
.aside__wrap {
  position: relative;
  display: flex;
  flex: 1;
  height: 100%;

  .service-aside-right--resizable {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99;
    width: 5px;
    height: 100%;
    border-left: 1px solid transparent;
    transition: border-color ease-in-out 200ms;
  }

  .aside__inner {
    display: flex;
    flex: 1;
    flex-direction: row-reverse;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);

    .aside__content {
      flex: 1;
      width: 200px;
      overflow-x: hidden;
      background-color: #fff;

      .service-aside--variables {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        height: 100%;

        .service-aside-box__header {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 35px;
          padding: 10px 7px 10px 20px;

          .service-aside-box__title {
            margin-right: 20px;
            margin-bottom: 0;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
          }
        }

        .service-aside-box__content {
          flex-grow: 1;
          padding: 12px 16px;
          overflow-x: hidden;
          overflow-y: auto;

          h4 {
            margin: 0;
            padding: 0;
            color: #909399;
            font-weight: 300;
          }

          .el-table td,
          .el-table th {
            padding: 6px 0;
          }
        }

        .service-aside-help__content {
          display: flex;
          flex: 1;
          flex-direction: column;
          height: 100%;
          padding: 0 20px 10px 20px;
          overflow-y: auto;
        }
      }

      .btn-container {
        padding: 0 10px 10px 10px;
        box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.05);
      }
    }

    .aside-bar {
      .tabs__wrap_vertical {
        flex-direction: column;
        width: 47px;
        height: 100%;
        background-color: #f5f5f5;
        border: none;

        .tabs__item {
          position: relative;
          display: flex;
          align-items: center;
          padding: 20px 17px;
          color: #000;
          font-size: 13px;
          text-transform: uppercase;
          text-orientation: mixed;
          background-color: #f5f5f5;
          border: none;
          border-top: 1px solid transparent;
          cursor: pointer;
          transition: background-color 150ms ease, color 150ms ease;

          &.selected {
            z-index: 1;
            background-color: #fff;
            border: none;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          &:hover {
            z-index: 2;
            color: #000;
            background-color: #fff;
            border: none;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          .step-name {
            font-weight: 500;
            font-size: 14px;
            writing-mode: vertical-rl;
          }
        }
      }

      .tabs__wrap {
        display: flex;
        justify-content: flex-start;
        height: 56px;
      }
    }
  }
}
</style>
