 <template>
  <el-dropdown trigger="hover" @command="changeLanguage">
    <div class="language-switcher">
      <span class="iconfont iconlanguage"></span>
    </div>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item command="zh-cn" :disabled="'zh-cn'=== $i18n.locale ">中文</el-dropdown-item>
      <el-dropdown-item command="en" :disabled="'en'=== $i18n.locale ">English</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import storejs from 'storejs'
export default {
  methods: {
    changeLanguage (lang) {
      this.$i18n.locale = lang
      if (lang === 'zh-cn') {
        this.$message.success('切换语言为中文')
      } else if (lang === 'en') {
        this.$message.success('Language has been switched to English')
      }
      storejs.set('language', lang)
    }
  }
}
</script>
