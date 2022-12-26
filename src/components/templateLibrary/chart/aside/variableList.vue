<template>
  <div class="variable-list">
    <header class="var-title">{{$t(`templates.helmChart.variablesList`)}}</header>
    <section>
      <article>
        <h4>
          <span>
            <i class="iconfont iconfuwu"></i>
          </span> {{$t(`templates.helmChart.systemVariables`)}}
        </h4>
        <el-table :data="systemVariables" style="width: 100%;">
          <el-table-column prop="key" label="Key"></el-table-column>
          <el-table-column prop="description" :label="$t('global.desc')"></el-table-column>
        </el-table>
      </article>
      <article>
        <h4>
          <span>
            <i class="iconfont icontanhao"></i>
          </span> {{$t(`templates.helmChart.customVariables`)}}
          <el-tooltip effect="dark" :content="$t(`templates.helmChart.customVariablesTooltip`)" placement="top">
            <span>
              <i class="el-icon-question"></i>
            </span>
          </el-tooltip>
        </h4>
        <el-table :data="customVariables" style="width: 100%;">
          <el-table-column prop="key" label="Key"></el-table-column>
          <el-table-column prop="value" label="Value">
            <template slot-scope="{row}">
              <el-input v-model="row.value" :placeholder="row.value" size="small"></el-input>
            </template>
          </el-table-column>
        </el-table>
        <el-button v-hasPermi="{type: 'system', action: 'edit_template',isBtn:true}"  type="primary" @click="saveCustomVariables" size="small" :loading="saveLoading">{{$t(`global.save`)}}</el-button>
        <el-button v-hasPermi="{type: 'system', action: 'edit_template',isBtn:true}" type="default" size="small" @click="multiUpdate">{{$t(`templates.helmChart.applyToServices`)}}</el-button>
      </article>
    </section>
  </div>
</template>

<script>
import { saveHelmTemplateVariableAPI, updateHelmTemplateAPI } from '@api'
export default {
  data () {
    return {
      saveLoading: false
    }
  },
  props: {
    systemVariables: {
      require: true,
      type: Array
    },
    customVariables: {
      require: true,
      type: Array
    }
  },
  computed: {
    serviceName () {
      return this.$route.query.service_name || ''
    }
  },
  methods: {
    saveCustomVariables () {
      if (!this.serviceName) {
        this.$message.info(this.$t(`templates.helmChart.emptyService`))
        return
      }
      this.saveLoading = true
      saveHelmTemplateVariableAPI(this.serviceName, this.customVariables)
        .then(res => {
          this.$message.success(this.$t(`templates.helmChart.saveCustomVariablesSuccess`))
        })
        .catch(err => {
          this.$message.error(this.$t(`templates.helmChart.saveCustomVariablesSuccess`, { message: err }))
        })
        .then(() => {
          this.saveLoading = false
        })
    },
    multiUpdate () {
      this.$confirm(this.$t(`templates.helmChart.applyToServicesTooltip`), this.$t(`templates.helmChart.confirmToApply`), {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      })
        .then(() => {
          updateHelmTemplateAPI(this.serviceName).then(res => {
            this.$message({
              type: 'success',
              message: this.$t(`templates.helmChart.applyToServicesSuccessfully`)
            })
          })
        })
    }
  }
}
</script>

<style lang="less" scoped>
.variable-list {
  box-sizing: border-box;
  height: 100%;
  max-height: 100%;
  padding: 10px 20px 20px;
  overflow: auto;
  background-color: #fff;

  .var-title {
    height: 35px;
    padding-bottom: 10px;
    font-weight: 700;
    font-size: 16px;
    line-height: 35px;
  }

  /deep/.el-table__cell {
    padding: 6px 0;
  }

  /deep/.el-button {
    margin-top: 20px;
  }

  article {
    padding: 12px 0;

    h4 {
      margin: 0;
      padding: 0;
      color: #909399;
      font-weight: 300;
    }
  }
}
</style>
