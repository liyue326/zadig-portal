<template>
  <div class="template-library-subtopbar-container">
    <div class="nav-container">
      <div class="nav-content">
        <ul v-if="routerList.length > 0" class="nav-item-list">
          <router-link v-for="(item,index) in routerList" :key="index" active-class="active" :to="item.url">
            <li class="nav-item">
              <i v-if="item.icon" class="icon" :class="[item.icon]"></i>
              <span class="name">{{item.name}}</span>
            </li>
          </router-link>
          <router-link :to="`/v1/template/workflows`" v-if="hasPlutus" active-class="active">
            <li class="nav-item">
              <i class="icon iconfont icongongzuoliucheng"></i>
              <span class="name">{{$t(`global.workflow`)}}</span>
            </li>
          </router-link>
        </ul>
      </div>
    </div>
    <div class="operation">
      <template>
        <el-dropdown
          v-if="$route.path === `/v1/template/workflows`"
          @command="createWorkflowTemplate"
          placement="bottom"
          trigger="click"
        >
          <button type="button" class="display-btn el-button">
            <i class="el-icon-plus"></i>
            &nbsp;&nbsp;{{$t(`workflow.workflowTemplate`)}}&nbsp;&nbsp;
            <i class="el-icon-caret-bottom el-icon--right"></i>
          </button>
          <el-dropdown-menu slot="dropdown" class="create-workflow-template">
            <el-dropdown-item command="custom">{{$t(`workflow.customWorkflow`)}}</el-dropdown-item>
            <el-dropdown-item command="release">{{$t(`workflow.releaseWorkflow`)}}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </template>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  data () {
    return {}
  },
  props: {},
  computed: {
    routerList () {
      return [
        {
          name: 'K8s YAML',
          icon: 'iconfont iconvery-k8s',
          url: `/v1/template/k8s-yamls`
        },
        {
          name: 'Helm Chart',
          icon: 'iconfont iconhelmrepo',
          url: `/v1/template/charts`
        },
        {
          name: 'Dockerfile',
          icon: 'iconfont icondocker',
          url: `/v1/template/dockerfiles`
        },
        {
          name: this.$t(`global.build`),
          icon: 'iconfont iconvery-build',
          url: `/v1/template/builds`
        }
      ]
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  methods: {
    createWorkflowTemplate (val) {
      this.$router.push(`/v1/template/workflows/config?type=${val}`)
    }
  }
}
</script>
<style lang="less">
.template-library-subtopbar-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 60px;
  padding-right: 40px;
  padding-left: 26px;
  background-color: #fff;

  .nav-container {
    .nav-content {
      .nav-item-list {
        display: flex;

        .nav-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          padding: 9px 12px;
          color: #000;
          font-weight: 300;
          font-size: 16px;
          line-height: 22px;
          cursor: pointer;

          .icon {
            margin-right: 18px;
            color: #d2d2d2;
            font-size: 22px;
          }
        }

        a {
          margin-right: 16px;

          &.active {
            box-shadow: inset 0 -2px 0 @themeColor;

            .icon {
              color: @themeColor;
            }
          }
        }
      }
    }
  }

  .operation {
    display: flex;
    margin-right: 80px;

    .el-button {
      padding: 10px 15px;
      color: @themeColor;
      font-weight: 400;
      border: 1px solid @themeColor;
      border-radius: 4px;
      box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
    }

    .display-btn {
      padding: 10px 15px;
      color: @themeColor;
      font-weight: 400;
      font-size: 14px;
      background-color: #fff;
      border: 1px solid @themeColor;
      border-radius: 4px;
      box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
      cursor: pointer;
    }
  }
}

.el-dropdown-menu.el-popper.create-workflow-template {
  margin-top: 2px;

  .el-dropdown-menu__item {
    margin: 0 10px;
    padding: 0 10px;
    font-weight: 300;
    border-radius: 6px;

    .item-icon {
      font-size: 14px;
    }
  }

  .popper__arrow {
    display: none;
  }
}
</style>
