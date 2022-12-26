<template>
  <div class="bottom-bar-container">
    <div class="breadcrumb-container"></div>
    <div class="shortcuts-container">
      <ul class="shortcuts-list">
        <li>
          <el-dropdown placement="top" @command="selectSystemToDownloadCLI">
            <span>
              <i class="iconfont"></i>下载开发者 CLI
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item disabled>请选择操作系统</el-dropdown-item>
              <el-dropdown-item command="mac">Mac</el-dropdown-item>
              <el-dropdown-item command="linux">Linux</el-dropdown-item>
              <el-dropdown-item command="windows">Windows</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </li>
        <li>
          <span>
            <i class="iconfont"></i>
            <a href="https://docs.koderover.com/" target="_blank" rel="noopener noreferrer">{{$t(`global.helpDoc`)}}</a>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
import { downloadDevelopCLIAPI } from '@api'
export default {
  name: 'bottomBar',
  data () {
    return {}
  },
  methods: {
    selectSystemToDownloadCLI (check) {
      downloadDevelopCLIAPI(check).then(res => {
        const aEle = document.createElement('a')
        if (aEle.download !== undefined) {
          aEle.setAttribute('href', res)
          aEle.setAttribute('download', true)
          document.body.appendChild(aEle)
          aEle.click()
          document.body.removeChild(aEle)
        }
      })
    }
  }
}
</script>
<style lang="less">
.bottom-bar-container {
  display: flex;
  height: 32px;
  background-color: @themeColor;

  .breadcrumb-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 100%;

    .breadcrumb-item {
      margin-left: 10px;
      color: #fff;
    }
  }

  .shortcuts-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    height: 100%;

    .shortcuts-list {
      position: relative;
      display: inline-flex;
      margin-right: 60px;
      color: @projectNameColor;
      font-weight: 300;
      font-size: 14px;
      line-height: 22px;

      li {
        margin-left: 35px;

        a,
        span {
          color: @projectNameColor;
          cursor: pointer;
        }
      }
    }
  }
}
</style>
