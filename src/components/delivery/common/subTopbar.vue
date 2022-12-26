<template>
  <div class="delivery-subtopbar-container">
    <div class="nav-container">
      <div class="nav-content">
        <ul class="nav-item-list">
          <router-link v-hasPermi="{type: 'system', action: 'release_get'}" active-class="active" to="/v1/delivery/version">
            <li class="nav-item">
              <i class="icon iconfont iconvery-versionmana"></i>
              <span class="name">{{$t('deliveryCenter.versionManagement')}}</span>
            </li>
          </router-link>
          <router-link v-hasPermi="{type: 'system', action: 'delivery_get'}" active-class="active" to="/v1/delivery/artifacts">
            <li class="nav-item">
              <i class="icon iconfont iconvery-delitracking"></i>
              <span class="name">{{$t('deliveryCenter.artifactsTracking')}}</span>
            </li>
          </router-link>
        </ul>
      </div>
    </div>
    <div class="operation"></div>
  </div>
</template>
<style lang="less">
.delivery-subtopbar-container {
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

    .el-select {
      width: 240px;
      margin-right: 24px;
    }

    .el-range-editor {
      &.el-input__inner {
        align-items: baseline;
        width: 240px;
        padding: 0 10px;
      }
    }
  }
}
</style>
