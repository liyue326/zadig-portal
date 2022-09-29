<template>
  <div class="mobile-profile">
    <van-nav-bar>
      <template #title>账号设置</template>
    </van-nav-bar>
    <div v-if="loading" class="load-cover">
      <van-loading type="spinner" color="#0066ff" />
    </div>

    <template v-else>
      <van-cell :label="currentUserInfo.name">
        <template #title>
          <span>用户名</span>
        </template>
        <template #default>
          <van-tag v-if="role.includes('admin')" type="primary">管理员</van-tag>
          <van-tag v-else type="primary">普通用户</van-tag>
        </template>
      </van-cell>
      <van-cell :label="$utils.convertTimestamp(currentUserInfo.last_login_time)">
        <template #title>
          <span>最近登录</span>
        </template>
      </van-cell>
      <van-cell :label="identityTypeMap[currentUserInfo.identity_type]">
        <template #title>
          <span>用户来源</span>
        </template>
      </van-cell>
      <van-cell :label="currentUserInfo.token">
        <template #title>
          <span>API Token</span>
        </template>
      </van-cell>
      <van-cell v-if="buildInfo">
        <template #title>
          <span>Build Info</span>
        </template>
        <template #label>
          <span>{{buildInfo.commits.join(' ')}}</span>
          <br>
          <span>{{buildInfo.time}}</span>
        </template>
        <template #default>
          <span>{{buildInfo.version}}</span>
        </template>
      </van-cell>
      <div class="logout">
        <van-button type="danger" @click="logOut" size="normal" round block>退出登录</van-button>
      </div>
    </template>
  </div>
</template>
<script>
import { NavBar, Tag, Cell, CellGroup, Loading, Button, Notify } from 'vant'
import { getCurrentUserInfoAPI } from '@api'
import storejs from 'storejs'
import { mapState } from 'vuex'
import moment from 'moment'
export default {
  components: {
    [NavBar.name]: NavBar,
    [Tag.name]: Tag,
    [Loading.name]: Loading,
    [Button.name]: Button,
    [Cell.name]: Cell,
    [CellGroup.name]: CellGroup,
    [Notify.name]: Notify
  },
  data () {
    return {
      loading: false,
      currentUserInfo: {},
      identityTypeMap: {
        github: 'GitHub',
        system: '系统创建',
        ldap: 'OpenLDAP',
        oauth: 'OAuth'
      }
    }
  },
  methods: {
    async getCurrentUserInfo () {
      this.loading = true
      const uid = storejs.get('userInfo').uid
      const res = await getCurrentUserInfoAPI(uid).catch(error =>
        console.log(error)
      )
      if (res) {
        this.loading = false
        this.currentUserInfo = res
      }
    },
    async logOut () {
      await this.$store.dispatch('LOGINOUT')
      this.$router.push('/signin')
    }
  },
  computed: {
    ...mapState({
      role: state => state.login.role
    }),
    buildInfo () {
      const processEnv = process.env
      if (processEnv && processEnv.NODE_ENV === 'production') {
        const buildInfo = {
          version: `${processEnv.VERSION}`,
          time: `${moment.unix(processEnv.BUILD_TIME).format('YYYYMMDDHHmm')}`,
          commits: []
        }
        if (processEnv.TAG) {
          buildInfo.commits.push(`Tag-${processEnv.TAG}`)
        }
        if (processEnv.BRANCH) {
          buildInfo.commits.push(`Branch-${processEnv.BRANCH}`)
        }
        if (processEnv.PR) {
          buildInfo.commits.push(`PR-${processEnv.PR}`)
        }
        if (processEnv.COMMIT_ID) {
          buildInfo.commits.push(`${processEnv.COMMIT_ID.substring(0, 7)}`)
        }
        return buildInfo
      } else {
        return null
      }
    }
  },
  mounted () {
    this.getCurrentUserInfo()
  }
}
</script>
<style lang="less">
.mobile-profile {
  .load-cover {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 999;
    width: 100%;
    height: calc(~'100% - 46px');
    background: rgba(255, 255, 255, 0.5);

    .van-loading {
      top: 40%;
      left: 50%;
      width: 40px;
      height: 40px;
      transform: translateX(-50%);
    }
  }

  .logout {
    margin-top: 35px;
    padding: 0 12px;
  }
}
</style>
