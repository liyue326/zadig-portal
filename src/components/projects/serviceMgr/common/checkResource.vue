
<template>
  <el-table :data="currentResource" style="width: 100%;" row-key="service_name" :expand-row-keys="expandKeys">
    <el-table-column prop="service_name" :label="$t(`global.serviceName`)"></el-table-column>
    <el-table-column>
      <span slot="header">
        {{$t('environments.k8s.serviceListComp.resourceDetection')}}
        <el-tooltip effect="dark" :content="$t('environments.k8s.serviceListComp.resourceDetectionTip')" placement="top">
          <i class="el-icon-info gray"></i>
        </el-tooltip>
      </span>
      <template slot-scope="{ row }">
        <div class="resource-item" v-for="(resource, index) in row.resources" :key="index">
          <i class="middle" :class="[resource.status === 'deployed' ? 'el-icon-success success' : 'el-icon-error fail']"></i>
          <span>{{ `${resource.type}/${resource.name}` }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column :label="$t(`global.operation`)" width="200px">
      <template slot-scope="{ row }">
        <el-radio-group v-model="row.deploy_strategy">
          <el-radio label="import" :disabled="!row.deployed">{{$t('environments.k8s.serviceListComp.onlyImport')}}</el-radio>
          <el-radio label="deploy">{{$t('environments.k8s.serviceListComp.executeDeploy')}}</el-radio>
        </el-radio-group>
      </template>
    </el-table-column>
    <el-table-column type="expand" width="100px" label="变量配置" v-if="showExpand">
      <template slot-scope="{ row }">
        <div v-if="row.canEditYaml">
          <div class="primary-title">变量配置</div>
          <Resize @sizeChange="$refs[`codemirror-${row.service_name}`].refresh()" :height="'200px'">
            <CodeMirror :ref="`codemirror-${row.service_name}`" v-model="row.variable_yaml" />
          </Resize>
        </div>
        <div v-else style="font-size: 12px; text-align: center;">无变量配置</div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import Resize from '@/components/common/resize'
import CodeMirror from '@/components/projects/common/codemirror.vue'
import { checkK8sSvcResourceAPI } from '@api'
import { mapState } from 'vuex'
import { debounce } from 'lodash'
export default {
  props: {
    checkResource: Object,
    currentResourceCheck: Array,
    serviceNames: Array,
    showExpand: {
      default: false,
      type: Boolean
    },
    expandKeys: {
      default: () => [],
      type: Array
    }
  },
  data () {
    return {
      svcResources: {}
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    }),
    currentResource () {
      if (this.currentResourceCheck) {
        return this.currentResourceCheck
      } else {
        for (const i in this.serviceNames) {
          const svc = this.serviceNames[i]
          this.$set(this.serviceNames, i, {
            ...svc,
            ...this.svcResources[svc.service_name]
          })
        }
        return this.serviceNames
      }
    }
  },
  watch: {
    checkResource: {
      handler (val) {
        if (
          this.hasPlutus &&
          val &&
          val.env_name &&
          val.namespace &&
          val.cluster_id
        ) {
          //  env_name,
          //  namespace,
          //  cluster_id,
          //  services: [{service_name, variable_yaml}]
          this.checkSvcResource(val)
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    checkSvcResource: debounce(async function (payload) {
      const svcYaml = {}
      payload.services.forEach(svc => {
        svcYaml[svc.service_name] = {
          variable_yaml: svc.variable_yaml,
          canEditYaml: svc.canEditYaml || false
        }
      })
      this.svcResources = {}
      const res = await checkK8sSvcResourceAPI(
        this.projectName,
        payload
      ).catch(err => console.log(err))
      if (res) {
        const svcResources = {}
        res.forEach(resource => {
          const deployed = !resource.resources.find(
            re => re.status === 'undeployed'
          )
          svcResources[resource.service_name] = {
            ...resource,
            deployed,
            deploy_strategy: deployed ? 'import' : 'deploy',
            variable_yaml: svcYaml[resource.service_name].variable_yaml,
            canEditYaml: svcYaml[resource.service_name].canEditYaml
          }
        })
        this.svcResources = svcResources
        this.$emit('checkRes', svcResources)
      }
    }, 300)
  },
  components: {
    Resize,
    CodeMirror
  }
}
</script>

<style lang="less" scoped>
.gray {
  color: @info;
}

.success {
  color: @success;
}

.fail {
  color: @danger;
}

.primary-title {
  margin-bottom: 14px;
}
</style>
