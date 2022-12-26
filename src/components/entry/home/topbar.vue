<template>
  <div class="topbar-container">
    <div class="topbar-content">
      <div class="topbar-container-start">
        <div v-if="showProjectSwitcher" class="project-switcher-container">
          <el-popover placement="bottom" width="300" trigger="hover" popper-class="project-list-popover" @show="searchProject=''">
            <div class="project-list-container">
              <div class="search-container">
                <el-input :placeholder="$t(`topbarMenu.search`)" v-model.trim="searchProject" size="small" />
              </div>
              <div class="list-container">
                <div
                  v-for="(item,index) in filteredProjectList"
                  :key="index"
                  class="project-item"
                  :class="{'active':item.name === projectName}"
                  @click="changeProject(item.name)"
                >
                  <div class="project-icon">
                    <i class="iconfont" :class="projectIconMap[item.deployType]"></i>
                  </div>
                  <div class="name">{{item.alias}}</div>
                </div>
              </div>
            </div>

            <span slot="reference" class="icon-switcher">
              <i class="el-icon-caret-bottom"></i>
            </span>
          </el-popover>
        </div>
        <div class="breadcrumb-container">
          <div class="project-switcher"></div>
          <el-breadcrumb v-if="content.breadcrumb && content.breadcrumb.length > 0" separator=">">
            <el-breadcrumb-item v-for="(item,index) in content.breadcrumb" :to="item.url" :key="index">
              <span>{{ item.title }}</span>
              <el-popover
                placement="bottom"
                width="180"
                trigger="hover"
                v-if="item.list && item.list.length"
                popper-class="sub-project-list-popover"
              >
                <div class="option-list-container">
                  <div
                    v-for="(proItem, index) in item.list"
                    :key="index"
                    class="product-option"
                    :class="{'active': proItem.title === item.title }"
                    @click="toggleSubUrl(item, proItem)"
                  >
                    <span class="left">{{ proItem.title }}</span>
                    <i class="el-icon-close" v-if="proItem.deleteOpe" @click.stop="proItem.deleteOpe(proItem.title, proItem.name)"></i>
                  </div>
                </div>
                <i slot="reference" class="el-icon-caret-bottom list-popover-icon"></i>
              </el-popover>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
      <div class="topbar-container-end">
        <LangSwitcher class="function-icon" />
        <ShortCutLink class="function-icon" />
        <DocLink class="function-icon" />
        <Notification class="function-icon" />
        <div class="nav nav-item-bottom user-profile">
          <el-popover placement="bottom" width="240" popper-class="dropdown-menu" trigger="hover">
            <div class="flex">
              <div class="profile-menu__list">
                <ul class="profile-list profile-list__with-icon">
                  <li class="profile-list__item profile-list__item-nested">
                    <div class="title">
                      <i class="iconfont iconzhanghu"></i>
                      <span class="profile-list__text">{{$t(`topbarMenu.username`)}}</span>
                    </div>
                    <ul class="content profile-list">
                      <li class="profile-list__item active">
                        <span>{{userName}}</span>
                        <el-tag v-if="role.includes('admin')" size="mini" type="primary" effect="plain">{{$t(`topbarMenu.admin`)}}</el-tag>
                        <el-tag v-else size="mini" type="primary" effect="plain">{{$t(`topbarMenu.user`)}}</el-tag>
                      </li>
                    </ul>
                  </li>
                </ul>
                <ul v-if="role.includes('admin')" class="profile-list profile-list__with-icon user-settings">
                  <router-link to="/v1/system/users">
                    <li class="profile-list__item">
                      <i class="iconfont icongeren"></i>
                      <span class="profile-list__text">{{$t(`topbarMenu.users`)}}</span>
                    </li>
                  </router-link>
                  <router-link to="/v1/system">
                    <li class="profile-list__item">
                      <i class="iconfont iconicon_jichengguanli"></i>
                      <span class="profile-list__text">{{$t(`topbarMenu.sysSetting`)}}</span>
                    </li>
                  </router-link>
                  <router-link v-if="hasPlutus" to="/v1/enterprise/">
                    <li class="profile-list__item">
                      <i class="iconfont iconcompany-info"></i>
                      <span class="profile-list__text">{{$t(`topbarMenu.enterprise`)}}</span>
                    </li>
                  </router-link>
                </ul>
                <ul class="profile-list profile-list__with-icon">
                  <router-link to="/v1/profile/info">
                    <li class="profile-list__item">
                      <i class="iconfont iconfenzucopy"></i>
                      <span class="profile-list__text">{{$t(`topbarMenu.profile`)}}</span>
                    </li>
                  </router-link>
                  <li class="profile-list__item profile-list__with-icon">
                    <i class="iconfont icondengchu"></i>
                    <span @click="logOut" class="profile-list__text logout">{{$t(`topbarMenu.signOut`)}}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div slot="reference" class="dropdown-menu-reference">
              <img src="@assets/icons/others/topbar-profile.png" class="menu-avatar" alt />
              <span class="username">
                <span>{{userName}}</span>
                <i class="iconfont iconmorelist"></i>
              </span>
            </div>
          </el-popover>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import ShortCutLink from './common/shortCutLink.vue'
import DocLink from './common/docLink.vue'
import Notification from './common/notification.vue'
import mixin from '@/mixin/topbarMixin'
import bus from '@utils/eventBus'
import { mapState, mapGetters } from 'vuex'
export default {
  data () {
    return {
      content: {
        title: '',
        breadcrumb: []
      },
      searchProject: '',
      projectIconMap: {
        k8s: 'iconk8s',
        helm: 'iconhelmrepo',
        external: 'iconvery-trustee',
        cloud_host: 'iconwuliji'
      }
    }
  },
  computed: {
    ...mapGetters(['projectList', 'showSidebar', 'projectAliasByName']),
    ...mapState({
      role: state => state.login.role,
      userInfo: state => state.login.userinfo,
      hasPlutus: state => state.checkPlutus.hasPlutus
    }),
    filteredProjectList () {
      return this.projectList.filter(item => {
        return item.name.indexOf(this.searchProject) > -1
      })
    },
    showProjectSwitcher () {
      return this.$route.path.includes('/v1/projects/detail/')
    },
    userName () {
      // 系统用户
      if (this.userInfo.identityType === 'system') {
        if (this.userInfo.name) {
          return `${this.userInfo.name}(${this.userInfo.account})`
        } else {
          return this.userInfo.account
        } // 第三方登录
      } else if (this.userInfo.preferred_username) {
        return `${this.userInfo.name}(${this.userInfo.preferred_username})`
      } else {
        return this.userInfo.name
      }
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    async logOut () {
      await this.$store.dispatch('LOGINOUT')
      this.$router.push('/signin')
    },
    changeProject (projectName) {
      this.$router.push(`/v1/projects/detail/${projectName}/detail`)
    },
    handleCommand (command) {
      if (command === 'logOut') {
        this.logOut()
      }
    },
    changeTitle (params) {
      this.content = params
    },
    toggleSubUrl (item, proItem) {
      item.title = proItem.title
      item.name = proItem.name || ''
      item.url = proItem.url ? '/v1' + proItem.url : ''
      this.$router.push(`/v1${proItem.url}`)
    }
  },
  created () {
    bus.$on('set-topbar-title', params => {
      params.breadcrumb.forEach(bc => {
        if (bc && bc.isProjectName) {
          bc.name = bc.title
          bc.title = this.projectAliasByName(bc.name)
        }
      })
      this.changeTitle(params)
    })
  },
  components: {
    ShortCutLink,
    DocLink,
    Notification
  },
  mixins: [mixin]
}
</script>
<style lang="less" scoped>
.dropdown-menu-reference {
  display: flex;
  align-items: center;
  color: #44504f;
  line-height: 60px;
  cursor: pointer;

  .username {
    display: inline-block;
    margin-left: 18px;
    font-weight: 300;
    font-size: 18px;
    line-height: 22px;
  }

  .iconmorelist {
    margin-left: 54px;
    color: #c4c4c4;
  }
}

.function-icon {
  margin: 0 20px;
  color: #a0a0a0;
  font-size: 20px;
  cursor: pointer;

  /deep/ .language-switcher {
    .iconfont {
      font-size: 20px;
    }
  }

  &:hover {
    color: @themeColor;
  }
}

.flex {
  display: flex;

  .profile-menu__list {
    width: 100%;
    padding: 8px 21px 2px 14px;

    .profile-list {
      margin: 0;
      padding: 10px 0;
      list-style-type: none;
      border-bottom: 1px solid #dbdbdb;

      .profile-list__item-nested {
        padding: 0;

        .title {
          margin-bottom: 5px;
        }
      }

      .profile-list__item {
        padding: 5px 0;
        font-size: 13px;

        .profile-list__text {
          color: #434548;
        }

        &:hover {
          .profile-list__text {
            color: @themeColor;
          }
        }

        i {
          display: inline-block;
          width: 20px;
          margin-right: 10px;
          color: @themeColor;
          font-size: 16px;
          text-align: center;
        }

        .logout {
          cursor: pointer;
        }
      }

      &.content {
        padding: 0;
        border-bottom: none;

        .profile-list__item {
          font-weight: normal;
        }
      }

      &:last-child {
        border-bottom: none;
      }
    }
  }
}

.topbar-container {
  top: 0;
  right: 0;
  left: 66px;
  z-index: 2;
  height: 40px;
  padding: 0 30px;
  font-size: 14px;
  background-color: #fff;
  border-bottom: 1px solid #ebedef;

  .topbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;

    .topbar-container-start {
      display: flex;
      flex: 0 1 auto;
      flex-basis: auto;
      flex-grow: 1;
      flex-shrink: 1;
      align-items: center;
      justify-content: flex-start;
      min-width: 0;
      margin-right: 10px;

      .list-popover-icon {
        color: @themeColor;
        cursor: pointer;
      }

      .logo-container {
        display: flex;
        align-items: center;
        width: 60px;

        .logo {
          margin-right: 10px;
        }

        .small {
          width: 18.5px;
          height: 21px;
        }

        &.opened {
          width: 170px;
        }
      }

      .project-switcher-container {
        margin-right: 20px;

        .icon-switcher {
          i {
            color: @themeColor;
            cursor: pointer;
          }
        }
      }

      span {
        &.kr-topbar-title {
          display: block;
          flex-grow: 0;
          overflow: hidden;
          font-weight: 300;
          font-size: 21px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }

      /deep/ .el-breadcrumb {
        color: #000;
        font-weight: 300;
        font-size: 14px;
      }

      /deep/ .el-breadcrumb__separator {
        margin: 0 9px;
        color: @fontLightGray;
        font-weight: 300;
      }

      /deep/ .el-breadcrumb__inner.is-link {
        color: #000;
        font-weight: 300;
      }

      /deep/ .el-breadcrumb__inner {
        color: #888;
      }
    }

    .topbar-container-end {
      display: flex;
      flex-grow: 0;
      flex-shrink: 0;
      align-items: center;
      justify-content: space-between;

      * {
        max-height: 100%;
      }

      .icon {
        color: @fontLightGray;
        font-size: 18px;
        cursor: pointer;

        &:hover {
          color: @themeColor;
        }
      }

      .notify {
        font-size: 20px;
      }

      .user-profile {
        margin-left: 38px;

        .menu-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }
      }
    }
  }
}

.project-list-popover {
  ::-webkit-scrollbar-track {
    width: 5px;
    height: 5px;
    background-color: #fff;
    border-radius: 6px;
  }

  .project-list-container {
    .search-container {
      margin-bottom: 10px;
    }

    .list-container {
      display: flex;
      flex-direction: column;
      height: 300px;
      overflow: auto;

      .project-item {
        display: flex;
        padding: 10px 8px;
        border-radius: 4px;
        cursor: pointer;

        .project-icon {
          i {
            color: @themeColor;
            font-size: 24px;
          }
        }

        .name {
          display: flex;
          align-items: center;
          margin-left: 10px;
          font-size: 16px;
        }

        &:hover,
        &.active {
          background: rgba(0, 102, 255, 0.07);

          .name {
            color: @themeColor;
          }
        }
      }
    }
  }
}

.sub-project-list-popover {
  .option-list-container {
    max-height: 300px;
    margin: -5px -12px -5px -5px;
    padding-right: 5px;
    overflow: auto;

    .product-option {
      display: flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;

      .left {
        flex: 1 1 auto;
      }

      &:hover,
      &.active {
        background: rgba(0, 102, 255, 0.07);
      }
    }
  }
}
</style>
