<template>
  <div class="integration-registry">
    <el-alert type="warning">
      <div>
        镜像仓库集成可以参考该
        <el-link type="warning"
                 class="integration-reference"
                 :href="`https://docs.koderover.com/zadig/settings/image-registry/`"
                 :underline="false"
                 target="_blank">文档</el-link>
      </div>
    </el-alert>
    <div class="content">
      <el-form ref="registry"
               :rules="rules"
               label-width="110px"
               label-position="top"
               :model="registry">
        <el-form-item label="默认使用"
                      prop="is_default">
          <el-checkbox v-model="registry.is_default"></el-checkbox>
        </el-form-item>
        <el-form-item label="提供商"
                      prop="reg_provider">
          <el-select v-model="registry.reg_provider"
                     @change="changeProvider"
                     style="width: 100%;"
                     placeholder="请选择镜像仓库提供商">
            <el-option v-for="(provider,index) in providers" :key="index" :value="provider.value"
                       :label="provider.label">
              <i class="iconfont" :class="provider.icon"></i> <span>{{provider.label}}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="registry.reg_provider === 'swr' || registry.reg_provider === 'ecr'"
                      :label="providerMap[registry.reg_provider].region"
                      prop="region">
          <el-input clearable
                    v-model="registry.region"></el-input>
        </el-form-item>
        <el-form-item v-if="registry.reg_provider"
                      :label="providerMap[registry.reg_provider].reg_addr"
                      prop="reg_addr">
          <el-input clearable
                    v-model="registry.reg_addr"></el-input>
        </el-form-item>
        <el-form-item  v-if="registry.reg_provider && registry.reg_provider !=='ecr'" prop="namespace">
          <template slot="label">
            {{ registry.reg_provider ? providerMap[registry.reg_provider].namespace : 'Namespace' }}
          </template>
          <el-input clearable
                    v-model="registry.namespace"></el-input>
        </el-form-item>
        <el-form-item v-if="registry.reg_provider" :label="providerMap[registry.reg_provider].access_key"
                      :rules="{ required: true, message: `请输入 ${providerMap[registry.reg_provider].access_key}`, trigger: ['blur'] }"
                      prop="access_key">
          <el-input clearable
                    v-model="registry.access_key"></el-input>
        </el-form-item>
        <el-form-item v-if="registry.reg_provider" :label="providerMap[registry.reg_provider].secret_key"
                      :rules="{ required: true, message: `请输入 ${providerMap[registry.reg_provider].secret_key}`, trigger: ['blur'] }"
                      prop="secret_key">
          <el-input clearable
                    type="passsword"
                    v-model="registry.secret_key"></el-input>
        </el-form-item>
      </el-form>
      <div class="footer">
        <el-button :plain="true"
                   type="success"
                   size="small"
                   @click="registryOperation">保存</el-button>
        <el-button @click="$emit('cancel')"
                   size="small">取 消</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { createRegistryAPI } from '@api'
import { keyBy } from 'lodash'
export default {
  name: 'IntegrationRegistry',
  data () {
    return {
      registry: {
        namespace: '',
        reg_addr: '',
        access_key: '',
        secret_key: '',
        reg_provider: '',
        region: '',
        is_default: true
      },
      providers: [
        {
          value: 'acr',
          label: '阿里云 ACR',
          reg_addr: '地址',
          namespace: '命名空间',
          access_key: 'Docker 用户名',
          secret_key: 'Docker 密码',
          icon: 'iconfont logo iconaliyun'
        },
        {
          value: 'swr',
          label: '华为云 SWR',
          reg_addr: '地址',
          namespace: '组织名称',
          region: '区域',
          access_key: 'Access Key',
          secret_key: 'Secret Key',
          icon: 'iconfont logo iconhuawei'
        },

        {
          value: 'tcr',
          label: '腾讯云 TCR',
          reg_addr: '地址',
          namespace: '命名空间',
          access_key: 'Docker 用户名',
          secret_key: 'Docker 密码',
          icon: 'iconfont logo icontengxunyun'
        },
        {
          value: 'harbor',
          label: 'Harbor',
          reg_addr: '地址',
          namespace: '项目',
          access_key: 'Docker 用户名',
          secret_key: 'Docker 密码',
          icon: 'iconfont logo iconHarbor'
        },
        {
          value: 'dockerhub',
          label: 'DockerHub',
          reg_addr: '地址',
          namespace: 'Namespace',
          access_key: 'Docker 用户名',
          secret_key: 'Docker 密码',
          icon: 'iconfont logo icondocker'
        },
        {
          value: 'ecr',
          label: 'Amazon ECR',
          reg_addr: 'URI',
          namespace: '',
          region: 'Region',
          access_key: 'Access Key ID',
          secret_key: 'Secret Access Key',
          icon: 'iconfont logo icondocker'
        },
        {
          value: 'native',
          label: '其他',
          reg_addr: '地址',
          namespace: 'Namespace',
          access_key: 'Docker 用户名',
          secret_key: 'Docker 密码',
          icon: 'iconfont logo iconqita'
        }
      ],
      rules: {
        reg_provider: [{ required: true, message: '请选择镜像仓库提供商', trigger: ['blur'] }],
        reg_addr: [{
          required: true,
          message: '请输入 URL，包含协议',
          trigger: ['blur']
        }],
        region: [{ required: true, message: '请输入区域', trigger: ['blur'] }],
        namespace: [{ required: true, message: '请输入 Namespace', trigger: ['blur'] }]
      }
    }
  },
  computed: {
    providerMap () {
      return keyBy(this.providers, 'value')
    }
  },
  methods: {
    changeProvider (val) {
      this.$nextTick(() => {
        this.registry = {
          namespace: '',
          reg_addr: val === 'dockerhub' ? 'https://registry.hub.docker.com' : '',
          access_key: '',
          secret_key: '',
          reg_provider: val,
          region: '',
          is_default: this.registry.is_default
        }
        this.$refs.registry.clearValidate()
      })
    },
    getProviderMap (name, type) {
      const providerMap = this.providerMap
      if (providerMap[name] && type) {
        return providerMap[name][type]
      } else {
        return providerMap.native.icon
      }
    },
    registryOperation () {
      this.$refs.registry.validate(valid => {
        if (valid) {
          const payload = this.registry
          createRegistryAPI(payload).then((res) => {
            this.$message({
              type: 'success',
              message: '新增成功'
            })
            this.$emit('cancel')
            this.$emit('createSuccess')
          })
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.integration-registry {
  padding: 10px 15px;
  font-size: 13px;

  .integration-reference {
    color: @themeColor;
    font-weight: 500;
    vertical-align: baseline;
  }

  .content {
    padding: 30px 20px;

    /deep/ .el-form-item {
      margin-bottom: 10px;

      &:first-child .el-form-item__content {
        top: -4px;
        display: inline-block;
        padding-left: 30px;
      }
    }
  }

  .footer {
    padding-top: 20px;
  }
}
</style>
