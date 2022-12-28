<template>
  <div @mouseenter="enterSidebar" @mouseleave="leaveSidebar" class="sidebar full-h" :class="{ 'small-sidebar': !showSidebar }">
    <a @click="changeSidebar" class="sidebar-size-toggler">
      <i :class="showSidebar?'el-icon-arrow-right':'el-icon-arrow-left'"></i>
    </a>
    <div class="sidebar-header" :style="{ width: showSidebar ? '100%' : 'auto'}">
      <router-link to="/v1/dashboard">
        <img v-if="showSidebar&&!showBackPath&&bigLogoUrl" class="logo" :src="bigLogoUrl" />
        <img v-if="showSidebar&&!showBackPath&&!bigLogoUrl" class="logo" src="@assets/icons/logo/logo.svg" />
        <img v-if="!showSidebar&&!showBackPath&&smallLogoUrl" class="logo" :src="smallLogoUrl" />
        <img v-if="!showSidebar&&!showBackPath&&!smallLogoUrl" class="logo" src="@assets/icons/logo/small-logo.png" />
      </router-link>
      <router-link class="sidebar-header-item back-to" v-show="showSidebar&&showBackPath" :to="backUrl">
        <div class="sidebar-header__icon">
          <i class="icon el-icon-back"></i>
        </div>
        <div class="sidebar-header__info">
          <div class="logo-title">{{backTitle}}</div>
        </div>
      </router-link>
      <router-link class="sidebar-header-item" v-show="!showSidebar&&showBackPath" :to="backUrl">
        <div class="sidebar-header__icon">
          <i class="icon el-icon-back"></i>
        </div>
      </router-link>
    </div>
    <div class="nav grow-all main-menu">
      <div v-for="(item,index) in navList" :key="index" class="category-wrapper">
        <h4 v-if="navList[index].items.length > 0" class="category-name" :class="{ opened: !showSidebar }">
          <span v-if="item.category_name">{{$t(`sidebarMenu.${item.category_name}`) }}</span>
          <span v-if="item.new_feature" class="new-feature">New</span>
        </h4>
        <div class="nav__new-wrapper" v-for="(nav,nav_index) in navList[index].items" :key="nav_index">
          <div class="nav grow-nothing">
            <div @click="collapseMenu(nav)" v-if="nav.hasSubItem" class="nav-item">
              <div class="nav-item-icon">
                <i :class="nav.icon"></i>
              </div>
              <a href="javascript:void(0)">
                <div class="nav-item-label">
                  {{$t(`sidebarMenu.${nav.name}`) }}
                  <i v-if="nav.isOpened" class="el-icon-arrow-up arrow"></i>
                  <i v-else-if="!nav.isOpened" class="el-icon-arrow-down arrow"></i>
                </div>
              </a>
            </div>
            <el-tooltip v-else effect="dark" :content="$t(`sidebarMenu.${nav.name}`)" placement="right" :disabled="showSidebar">
              <router-link class="nav-item" active-class="active" :to="`/v1/${nav.url}`">
                <div class="nav-item-icon">
                  <i :class="nav.icon"></i>
                </div>
                <div v-show="showSidebar" class="nav-item-label">{{$t(`sidebarMenu.${nav.name}`)}}</div>
              </router-link>
            </el-tooltip>
            <ul v-if="nav.hasSubItem && nav.isOpened" class="sub-menu" style="overflow: hidden;">
              <li class="sub-menu-item-group">
                <ul>
                  <router-link v-for="(subItem,index) in nav.subItems" :key="index" active-class="active" :to="`/v1/${subItem.url}`">
                    <li class="sub-menu-item">
                      <span class="sub-item-icon">
                        <i :class="subItem.icon"></i>
                      </span>
                      <span class="sub-item-label">{{subItem.name}}</span>
                    </li>
                  </router-link>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        <div class="nav__new-wrapper"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import bus from '@utils/eventBus'
import { debounce, cloneDeep, remove } from 'lodash'
import { getEnterpriseInfoAPI } from '@api'
export default {
  data () {
    return {
      showSidebar: true,
      backTitle: '',
      backUrl: '/v1/dashboard',
      enterpriseInfo: null,
      accountSetting: [
        {
          items: [
            {
              name: 'profile',
              icon: 'iconfont iconfenzucopy',
              url: 'profile/info'
            },
            {
              name: 'preference',
              icon: 'iconfont iconxitong-system',
              url: 'profile/preference'
            }
          ]
        }
      ],
      enterpriseMenu: [
        {
          items: [
            {
              name: 'enterpriseInfo',
              icon: 'iconfont iconcompany-info',
              url: 'enterprise/info'
            },
            {
              name: 'license',
              icon: 'iconfont iconxukezheng',
              url: 'enterprise/license'
            }
          ]
        }
      ],
      systemMenu: [
        {
          category_name: 'integration',
          items: [
            {
              name: 'systemIntegration',
              icon: 'iconfont iconicon_jichengguanli',
              url: 'system/integration'
            },
            {
              name: 'packages',
              icon: 'iconfont iconyingyongshezhi',
              url: 'system/apps'
            },
            {
              name: 'images',
              icon: 'iconfont iconjingxiang',
              url: 'system/imgs'
            },
            {
              name: 'plugins',
              icon: 'iconfont el-icon-sell',
              url: 'system/plugins'
            }
          ]
        },
        {
          category_name: 'infraIntegration',
          items: [
            {
              name: 'dockerRegistry',
              icon: 'iconfont icondocker',
              url: 'system/registry'
            },
            {
              name: 'objectStorage',
              icon: 'iconfont iconduixiangcunchu',
              url: 'system/storage'
            },
            {
              name: 'helmRepo',
              icon: 'iconfont iconhelmrepo',
              url: 'system/helm',
              features: 'helm'
            },
            {
              name: 'clusters',
              icon: 'iconfont iconjiqun',
              url: 'system/cluster'
            },
            {
              name: 'hosts',
              icon: 'iconfont iconzhuji',
              url: 'system/host'
            }
          ]
        },
        {
          category_name: 'system',
          items: [
            {
              name: 'settings',
              icon: 'iconfont iconfuwupeizhi',
              url: 'system/config'
            },
            {
              name: 'users',
              icon: 'iconfont icongeren',
              url: 'system/users'
            },
            {
              name: 'announcement',
              icon: 'iconfont icongonggao',
              url: 'system/announcement'
            },
            {
              name: 'auditLog',
              icon: 'iconfont iconiconlog',
              url: 'system/auditlog'
            }
          ]
        }
      ],
      defaultMenu: [
        {
          category_name: 'productDelivery',
          items: [
            {
              name: 'dashboard',
              icon: 'iconfont iconyunhangzhuangtai',
              url: 'dashboard'
            },
            {
              name: 'projects',
              icon: 'iconfont iconxiangmuloading',
              url: 'projects'
            },
            {
              name: 'testCenter',
              url: 'tests',
              icon: 'iconfont iconvery-testing'
            },
            {
              name: 'deliveryCenter',
              url: 'delivery',
              icon: 'iconfont iconvery-deli'
            }
          ]
        },
        {
          category_name: 'dataViews',
          items: [
            {
              name: 'dataOverview',
              icon: 'iconfont iconvery-dataov',
              url: 'statistics'
            },
            {
              name: 'dataInsight',
              icon: 'iconfont iconvery-datain',
              url: 'insight'
            }
          ]
        }
      ],
      adminMenu: [
        {
          category_name: 'setting',
          items: [
            {
              name: 'sysSetting',
              icon: 'iconfont iconvery-setting',
              url: 'system'
            }
          ]
        }
      ],
      plutusMenu: {
        delivery: {
          category_name: 'customerDelivery',
          items: [
            {
              name: 'deliveryBoard',
              icon: 'iconfont iconBoardList',
              url: 'plutus/deliveryBoard'
            },
            {
              name: 'deliveryVersion',
              icon: 'iconfont iconbanben1',
              url: 'plutus/version'
            },
            {
              name: 'deliveryCustomers',
              icon: 'iconfont iconCustomermanagement',
              url: 'plutus/customer'
            }
          ]
        },
        manage: {
          name: 'enterprise',
          icon: 'iconfont iconcompany-info',
          url: 'enterprise/'
        }
      }
    }
  },
  methods: {
    enterSidebar: debounce(function () {
      // this.showSidebar = true
    }, 300),
    leaveSidebar: debounce(function () {
      // this.showSidebar = false
    }, 100),
    changeSidebar () {
      this.showSidebar = !this.showSidebar
      this.$emit('sidebar-width', this.showSidebar)
    },
    collapseMenu (nav) {
      nav.isOpened = !nav.isOpened
    },
    getEnterpriseInfo () {
      getEnterpriseInfoAPI().then(res => {
        this.enterpriseInfo = res
      })
    }
  },
  computed: {
    showBackPath () {
      const path = this.$route.path
      if (path.includes('/v1/users')) {
        this.backTitle = this.$t(`sidebarMenu.users`)
        return true
      } else if (path.includes('/v1/system')) {
        this.backTitle = this.$t(`sidebarMenu.sysSetting`)
        return true
      } else if (path.includes('/v1/enterprise')) {
        this.backTitle = this.$t(`sidebarMenu.enterprise`)
        return true
      } else if (path.includes('/v1/profile')) {
        this.backTitle = this.$t(`sidebarMenu.profile`)
        return true
      } else {
        return false
      }
    },
    isAdmin () {
      if (this.$store.state.login.role.includes('admin')) {
        return true
      } else {
        return false
      }
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus,
      signatureFeatures: state => state.checkPlutus.features
    }),
    showEfficiencyInsight () {
      const showEfficiencyInsight = this.checkPermissionSyncMixin({
        type: 'system',
        action: 'efficiency_over'
      })
      return showEfficiencyInsight
    },
    showDataOverview () {
      const showDataOverview = this.checkPermissionSyncMixin({
        type: 'system',
        action: 'data_over'
      })
      return showDataOverview
    },
    showTestCenter () {
      const showTestCenter = this.checkPermissionSyncMixin({
        type: 'system',
        action: 'get_test'
      })
      return showTestCenter
    },
    showDeliveryCenter () {
      const showDeliveryCenter = this.checkPermissionSyncMixin({
        type: 'system',
        operator: 'or',
        actions: ['release_get', 'delivery_get']
      })
      return showDeliveryCenter
    },
    navList () {
      const path = this.$route.path
      const defaultMenu = cloneDeep(this.defaultMenu)
      const adminMenu = cloneDeep(this.adminMenu)
      if (path.includes('/v1/enterprise')) {
        return this.enterpriseMenu
      } else if (path.includes('/v1/system')) {
        return this.systemMenu
      } else if (path.includes('/v1/profile')) {
        return this.accountSetting
      }
      /** plutus menu */
      if (this.isAdmin && this.hasPlutus) {
        if (
          this.signatureFeatures.delivery &&
          !defaultMenu.find(menu => menu.category_name === 'deliveryCustomers')
        ) {
          defaultMenu.splice(1, 0, this.plutusMenu.delivery)
        }
        if (!adminMenu[0].items.find(menu => menu.name === 'enterprise')) {
          adminMenu[0].items.splice(1, 0, this.plutusMenu.manage)
        }
      }
      /** End */
      if (this.isAdmin) {
        return defaultMenu.concat(adminMenu)
      } else {
        if (!this.showTestCenter) {
          remove(defaultMenu[0].items, item => {
            return item.name === 'testCenter'
          })
        }
        if (!this.showDeliveryCenter) {
          remove(defaultMenu[0].items, item => {
            return item.name === 'deliveryCenter'
          })
        }
        const dataReview = defaultMenu.find(
          menu => menu.category_name === 'dataViews'
        )
        if (!this.showDataOverview) {
          remove(dataReview.items, item => {
            return item.name === 'dataOverview'
          })
        }
        if (!this.showEfficiencyInsight) {
          remove(dataReview.items, item => {
            return item.name === 'dataInsight'
          })
        }
        return defaultMenu
      }
    },
    smallLogoUrl () {
      if (this.enterpriseInfo) {
        return this.enterpriseInfo.small_logo
      } else {
        return ''
      }
    },
    bigLogoUrl () {
      if (this.enterpriseInfo) {
        return this.enterpriseInfo.big_logo
      } else {
        return ''
      }
    }
  },
  watch: {
    showSidebar: function (new_val, old_val) {
      this.$store.commit('SET_SIDEBAR_STATUS', new_val)
    }
  },
  created () {
    this.getEnterpriseInfo()
    bus.$on('show-sidebar', params => {
      this.showSidebar = params
    })
  }
}
</script>

<style lang="less">
@twoSidesWidth: 12px;

.sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: left;
  justify-content: space-between;
  width: 176px;
  height: 100%;
  margin-right: 0;
  background-color: @sidebarBg;
  transition: width 200ms, margin-width 180ms;

  .sidebar-size-toggler {
    position: absolute;
    right: 0;
    bottom: 120px;
    z-index: 1;
    display: block;
    width: 16px;
    height: 48px;
    color: #fff;
    line-height: 48px;
    text-align: center;
    text-decoration: none;
    background-color: #c0c4cc;
    border-radius: 4px 0 0 4px;
    cursor: pointer;

    i {
      display: inline-block;
      transform: rotateZ(180deg);
    }
  }

  h4 {
    &.category-name {
      display: inline-block;
      width: 100%;
      margin-top: 0;
      margin-bottom: 8px;
      padding-left: 16px;
      overflow: hidden;
      color: #888;
      font-weight: 300;
      font-size: 16px;
      white-space: nowrap;
      text-align: left;

      i {
        position: relative;
        top: -1px;
        display: inline-block;
        font-size: 9px;
      }

      .new-feature {
        padding: 1px 3px;
        color: #e02711;
        font-weight: 300;
        font-size: 11px;
        border: 1px solid #e02711;
        border-radius: 4px;
      }

      &.opened {
        visibility: hidden;
      }
    }
  }

  .nav {
    flex-basis: 0;
    width: 100%;
    margin-bottom: 0;
    padding-left: 0;
    overflow: auto;
    overflow-x: hidden;
    list-style: none;

    &.grow-all {
      flex-grow: 1;

      &::-webkit-scrollbar-track {
        width: 4px;
        height: 4px;
        background-color: transparent;
        border-radius: 6px;
      }

      &::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        background-color: transparent;
      }

      &::-webkit-scrollbar-thumb {
        width: 4px;
        height: 4px;
        background-color: transparent;
        border-radius: 6px;
      }

      &:hover {
        &::-webkit-scrollbar-thumb {
          background-color: #dcdfe6;

          &:hover {
            background-color: #bdb6b6;
          }
        }
      }
    }

    &.grow-nothing {
      flex-grow: 0;
      padding: 2px 0;
    }

    &.main-menu {
      margin-top: 14px;
    }
  }

  .category-wrapper {
    position: relative;
    flex: none !important;
    margin-right: @twoSidesWidth;
    margin-bottom: 28px;
    margin-left: @twoSidesWidth;

    &:last-child {
      margin-bottom: 0;
    }

    &.divider {
      &::before {
        position: absolute;
        top: 0;
        right: 0;
        left: 4px;
        width: 30px;
        height: 1px;
        margin: auto;
        background-color: #c0c4cc;
        content: '';
      }
    }
  }

  .sub-menu {
    position: relative;
    margin: 0;
    padding-left: 0;
    list-style: none;
    background-color: #fff;
    border-right: solid 1px #e6e6e6;

    .sub-menu-item {
      position: relative;
      box-sizing: border-box;
      min-width: 200px;
      height: 38px;
      padding: 0 35px;
      color: #303133;
      font-size: 14px;
      line-height: 38px;
      white-space: nowrap;
      list-style: none;
      cursor: pointer;
      transition: border-color 0.3s, background-color 0.3s, color 0.3s;

      &:hover {
        background-color: #e1edfa;
      }

      .sub-item-icon {
        display: inline-block;
        width: 35px;
        text-align: center;

        i {
          color: @themeColor;
          font-size: 19px;
        }
      }

      .sub-item-label {
        padding-left: 0;
        color: #434548;
        font-size: 13px;
        line-height: 2.2;
        text-align: left;
      }
    }

    .sub-menu-item-group > ul {
      padding: 0;
    }
  }

  &.small-sidebar {
    box-sizing: border-box;
    width: 80px;

    .sub-menu {
      .sub-menu-item {
        padding: 0;

        .sub-item-icon {
          width: 65px;
        }
      }
    }
  }

  .sub-menu-item-group {
    .active {
      .sub-menu-item {
        background-color: #e1edfa;
      }
    }
  }

  .sidebar-header__icon {
    display: flex;
    align-items: center;
    color: @themeColor;
    font-weight: normal;
    font-size: 16px;
  }

  .sidebar-header__info {
    padding: 20px 0;

    .logo-title {
      color: #434548;
      font-weight: 400;
      font-size: 14px;
      line-height: 22px;
      text-transform: uppercase;
    }

    .logo-title_subtitle {
      max-width: 160px;
      margin-top: 5px;
      overflow: hidden;
      color: @themeColor;
      font-size: 12px;
      line-height: 16px;
      white-space: nowrap;
      text-align: left;
      text-overflow: ellipsis;
    }
  }

  .sidebar-header {
    display: flex;
    justify-content: center;
    width: 100%;

    .sidebar-header-item {
      display: flex;
      justify-content: center;
      width: 100%;
      padding: 10px 30px;
    }

    .back-to {
      justify-content: flex-start;

      .sidebar-header__info {
        margin-left: 5px;
        padding: 0;
      }

      .sidebar-header__icon {
        width: 22px;
      }
    }

    .logo {
      height: 24px;
      padding: 14px;
      background-size: cover;

      &.small {
        width: 50px;
        height: 50px;
        margin: 0 auto;
        padding: 0;
      }
    }
  }

  .nav-item-icon {
    display: flex;
    flex-grow: 0;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    color: @themeColor;
    font-size: 22px;
    text-align: center;

    .iconfont {
      font-size: 22px;
    }
  }

  .nav-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 10px 17px 10px 17px;
    overflow: hidden;
    outline: none;

    .nav-item-label {
      display: flex;
      align-items: center;
      min-width: 130px;
      margin-left: 10px;
      padding-left: 0;
      color: #4a4a4a;
      font-weight: 400;
      font-size: 14px;
      line-height: 22px;
      white-space: nowrap;
      text-align: left;

      .arrow {
        position: static;
        margin-top: -3px;
        margin-left: 8px;
        vertical-align: middle;
      }
    }
  }

  .nav-item.active,
  .nav-item:hover {
    background-color: @sidebarActiveColor;
    border-radius: 6px;

    .nav-item-label {
      color: @themeColor;
    }
  }

  .category-wrapper:first-child {
    margin-top: 0;
  }

  .nav__new-wrapper {
    position: relative;
  }

  .nav-item-bottom {
    margin-top: auto;
  }
}
</style>
