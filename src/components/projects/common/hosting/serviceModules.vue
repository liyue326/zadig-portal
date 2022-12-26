<template>
  <div class="service-content">
    <div class="title">
      <span>
        <i class="iconfont iconfuwu"></i>
      </span> {{$t('services.common.detectedServiceModules')}}
      <el-tooltip effect="dark" placement="top">
        <div slot="content">{{$t('services.common.detectedServiceModulesTooltip')}}</div>
        <span>
          <i class="el-icon-question"></i>
        </span>
      </el-tooltip>
    </div>
    <el-table :data="serviceModules" stripe style="width: 100%;">
      <el-table-column prop="name" :label="$t('services.common.serviceModule')"></el-table-column>
      <el-table-column prop="image_name" :label="$t('services.common.serviceImageName')"></el-table-column>
      <el-table-column prop="image" :label="$t('services.common.serviceImageLabel')"></el-table-column>
      <el-table-column :label="$t('services.common.buildInfoAndOperation')">
        <template slot-scope="scope">
          <div v-for="(buildName, index) in scope.row.build_names" :key="index">
            <span class="build-name" @click="openBuild(scope.row, buildName)">{{ buildName }}</span>
          </div>
          <el-button v-hasPermi="{projectName: projectName, action: 'create_build',isBtn:true}" size="small" type="text" @click="openBuild(scope.row)">{{$t('services.common.addServiceBuild')}}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
export default {
  name: 'serviceModule',
  props: {
    serviceModules: Array,
    openBuild: Function,
    projectName: String
  }
}
</script>
<style lang="less" scoped>
.service-content {
  box-sizing: border-box;
  width: 100%;
  padding: 10px;

  .title {
    color: #909399;
    font-weight: 300;
  }

  .build-name {
    display: inline-block;
    margin-top: 5px;
    color: @themeColor;
    font-size: 12px;
    line-height: 16px;
    cursor: pointer;

    &:hover {
      color: @themeBorderColor;
    }
  }
}
</style>
