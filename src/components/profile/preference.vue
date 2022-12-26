<template>
  <div class="preference-container">
    <el-form ref="form" :model="config" :rules="rules" label-width="120px" label-position="left" class="primary-form">
      <!-- <el-form-item :label="$t('profile.uiTheme')">
        <el-select v-model="config.theme" placeholder>
          <el-option v-for="item in themeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item> -->
      <el-form-item :label="$t('profile.logColor')">
        <div class="xterm-out">
          <Xterm ref="xterm" />
        </div>
        <div class="xterm-ope">
          <el-form-item :label="$t('profile.backgroundColor')" prop="xtermTheme.background" :show-message="false">
            <el-color-picker v-model="config.xtermTheme.background"></el-color-picker>
            <el-input v-model="config.xtermTheme.background"></el-input>
          </el-form-item>
          <el-form-item :label="$t('profile.fontColor')" prop="xtermTheme.foreground" :show-message="false">
            <el-color-picker v-model="config.xtermTheme.foreground"></el-color-picker>
            <el-input v-model="config.xtermTheme.foreground"></el-input>
          </el-form-item>
        </div>
      </el-form-item>
    </el-form>
    <div class="bottom">
      <el-button type="primary" size="small" @click="saveTheme">{{$t('global.save')}}</el-button>
    </div>
  </div>
</template>

<script>
import bus from '@utils/eventBus'
import Xterm from './common/xterm.vue'
import { debounce, cloneDeep } from 'lodash'
export default {
  data () {
    return {
      config: {
        theme: 'light',
        xtermTheme: {
          background: '#000000',
          foreground: '#ffffff'
        }
      }
    }
  },
  computed: {
    themeOptions () {
      return [
        {
          label: this.$t('profile.defaultTheme'),
          value: 'light'
        },
        {
          label: this.$t('profile.darkTheme'),
          value: 'dark'
        }
      ]
    },
    rules () {
      const validColor = (rule, value, callback) => {
        if (!value) {
          callback(new Error(this.$t('profile.inputColorHex')))
        } else if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
          callback(new Error(this.$t('profile.checkColorHex')))
        } else {
          callback()
        }
      }
      return {
        'xtermTheme.background': [
          { required: true, validator: validColor, trigger: ['blur', 'change'] }
        ],
        'xtermTheme.foreground': [
          { required: true, validator: validColor, trigger: ['blur', 'change'] }
        ]
      }
    }
  },
  methods: {
    saveTheme () {
      this.$refs.form.validate().then(() => {
        this.$store.dispatch('savePreferenceSetting', this.config).then(() => {
          this.$message.success(this.$t('profile.preferenceChangedSuccessfully'))
        })
      })
    }
  },
  watch: {
    'config.xtermTheme': {
      handler: debounce(function (val) {
        const fLen = val.foreground.length
        const bLen = val.background.length
        if ((fLen === 4 || fLen === 7) && (bLen === 4 || bLen === 7)) {
          this.$refs.xterm.setTheme({
            foreground: val.foreground,
            background: val.background
          })
        }
      }, 200),
      deep: true
    }
  },
  components: {
    Xterm
  },
  mounted () {
    bus.$emit('set-topbar-title', {
      breadcrumb: [{ title: this.$t(`sidebarMenu.preference`), url: '' }]
    })
    this.$store.dispatch('getPreferenceSetting').then(res => {
      this.config = cloneDeep(res)
    })
  }
}
</script>

<style lang="less" scoped>
.preference-container {
  position: relative;
  flex: 1;
  padding: 30px 30px;
  overflow: auto;

  .xterm-out {
    width: 700px;
    margin: 10px 0;
  }

  .xterm-ope {
    /deep/.el-form-item__content {
      display: flex;
    }
  }

  .bottom {
    margin-top: 60px;
  }
}
</style>
