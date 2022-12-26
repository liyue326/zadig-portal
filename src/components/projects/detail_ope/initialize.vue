<template>
  <div class="init-resource">
    <header><i class="theme-color iconfont iconvery-handshake"></i>管理员为您配置了以下工作流和环境</header>
    <section>
      <article v-if="collaborationData.workflow.length">
        <div class="title">
          <i class="iconfont icongongzuoliucheng"></i>工作流
        </div>
        <div v-for="(workflow, index) in collaborationData.workflow" :key="index" class="detail-item">
          <div class="item-name">{{ workflow.display_name }}</div>
        </div>
      </article>
      <article v-if="collaborationData.product.length" style="margin-top: 30px;">
        <div class="title">
          <i class="iconfont iconvery-environ"></i>环境
        </div>
        <div v-for="(env, index) in collaborationData.product" :key="index" class="detail-item display-flex">
          <div>
            <div class="item-name">{{ env.name }}</div>
          </div>
          <el-button v-if="env.collaboration_type === 'new'" type="primary" plain size="small" @click="editEnvInfo(env)">环境变量</el-button>
        </div>
      </article>
      <footer>
        <el-button type="primary" size="small" icon="confirm-icon iconfont iconvery-confirm" @click="createEnvAndWorkflow" round>{{$t('global.confirm')}}</el-button>
      </footer>
    </section>
    <InitEnvDialog
      ref="envDialogRef"
      :visible="dialogVisible"
      @resetVisible="initEnvInfo"
      :currentEnv="currentEnv"
      :currentInfo="currentInfo"
      :baseEnvObj="baseEnvObj"
    />
  </div>
</template>

<script>
import InitEnvDialog from './components/initEnvDialog.vue'
import bus from '@utils/eventBus'
import { getNewCollaborationAPI, initializeCollaborationAPI } from '@api'
import { uniqBy } from 'lodash'
export default {
  data () {
    return {
      collaborationData: {
        workflow: [],
        product: []
      },
      dialogVisible: false,
      currentEnv: '',
      currentInfo: null,
      baseEnvObj: {}
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    createEnvAndWorkflow () {
      const payload = {
        products: this.collaborationData.product.filter(
          product => product.collaboration_type === 'new'
        )
      }
      initializeCollaborationAPI(this.projectName, payload).then(res => {
        this.$message.success(
          `项目更新成功，环境更新可能需要一些时间，请稍后使用！`
        )
        this.$router.go(-1)
      })
    },
    getNewCollaboration () {
      getNewCollaborationAPI(this.projectName).then(res => {
        res.product.forEach(async product => {
          if (
            product.collaboration_type === 'new' &&
            product.deploy_type === 'helm'
          ) {
            // for services info: repo
            product.chartValues.forEach(chart => {
              chart.envName = product.name

              if (chart.yaml_data) {
                const gitRepo = chart.yaml_data.source_detail && chart.yaml_data.source_detail.git_repo_config
                const gitRepoConfig = gitRepo && gitRepo.codehost_id
                  ? {
                    branch: gitRepo.branch,
                    codehostID: gitRepo.codehost_id,
                    owner: gitRepo.owner,
                    repo: gitRepo.repo,
                    valuesPaths: [chart.yaml_data.source_detail.load_path],
                    autoSync: chart.yaml_data.auto_sync,
                    namespace: gitRepo.namespace
                  }
                  : null
                chart.valuesData = {
                  autoSync: chart.yaml_data.auto_sync,
                  yamlSource: 'repo',
                  gitRepoConfig: gitRepoConfig
                }
                delete chart.yaml_data
              }
            })

            // for environment info: repo and variableSet
            if (product.yaml_data) {
              // for repo
              if (product.yaml_data.source === 'repo') {
                const gitRepo = product.yaml_data.source_detail && product.yaml_data.source_detail.git_repo_config
                const gitRepoConfig = gitRepo && gitRepo.codehost_id
                  ? {
                    branch: gitRepo.branch,
                    codehostID: gitRepo.codehost_id,
                    owner: gitRepo.owner,
                    repo: gitRepo.repo,
                    valuesPaths: [product.yaml_data.source_detail.load_path],
                    autoSync: product.yaml_data.auto_sync,
                    namespace: gitRepo.namespace
                  }
                  : null
                if (gitRepoConfig) {
                  product.valuesData = {
                    autoSync: product.yaml_data.auto_sync,
                    yamlSource: 'repo',
                    gitRepoConfig
                  }
                }
              } else if (product.yaml_data.source === 'variableSet') { // for variableSet
                product.valuesData = {
                  autoSync: product.yaml_data.auto_sync,
                  yamlSource: 'variableSet',
                  source_id: product.yaml_data.source_id
                }
              }
              delete product.yaml_data
            }
          }
          if (product.deploy_type !== 'helm') {
            product.deploy_type = 'k8s'
            product.services.forEach(svc => {
              svc.canEditYaml = !!svc.variable_yaml
            })
          }
        })
        const fn = obj => {
          return `${obj.name}/${obj.collaboration_type}`
        }
        res.product = uniqBy(res.product, fn)
        res.workflow = uniqBy(res.workflow, fn)
        this.collaborationData = res
        const baseEnvObj = {}
        res.product
          .filter(product => product.collaboration_type === 'new')
          .forEach(product => {
            baseEnvObj[product.name] = product.base_name
          })
        this.baseEnvObj = baseEnvObj
      })
    },
    editEnvInfo (env) {
      this.dialogVisible = true
      this.currentEnv = env.name
      this.currentInfo = env
    },
    initEnvInfo () {
      this.dialogVisible = false
      this.currentEnv = ''
      this.currentInfo = null
    }
  },
  created () {
    bus.$emit('show-sidebar', true)
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        { title: this.projectName, isProjectName: true, url: '' },
        { title: '项目资源', url: '' }
      ]
    })
    bus.$emit('show-sidebar', false)
    this.getNewCollaboration()
  },
  components: {
    InitEnvDialog
  }
}
</script>

<style lang="less" scoped>
@width: 800px;

.init-resource {
  flex: 1;
  box-sizing: border-box;
  min-width: 900px;
  height: 100%;
  padding: 30px;
  padding-right: 70px;
  overflow: auto;
  color: #4c4c4c;
  font-weight: 300;
  line-height: 2;
  background: url('~@assets/icons/illustration/collaborationProject.svg') #f5f7f7 no-repeat;
  background-color: #f5f7f7;
  background-position: right 20px bottom 40px;
  background-size: 300px 250px;

  .iconfont {
    margin-right: 10px;
    font-size: 18px;

    &.theme-color {
      color: #ff2868;
      font-size: 16px;
    }
  }

  header {
    width: @width;
    margin: 20px auto;
    color: #8a8a8a;
    font-size: 16px;
    line-height: 22px;
  }

  section {
    box-sizing: border-box;
    width: @width;
    margin: auto;
    padding: 20px 30px;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 6px;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.05);

    article {
      .title {
        margin: 12px 0 8px;
        font-size: 18px;
      }

      .detail-item {
        margin-bottom: 2px;
        padding: 8px 20px;
        background-color: #fff;

        .item-name {
          color: #5e6d82;
          line-height: 3;

          /deep/.el-tag {
            margin-left: 5px;
          }
        }

        .item-desc {
          color: #c0c4cc;
        }
      }

      .display-flex {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    }

    footer {
      padding: 60px 60px 10px;
      text-align: center;

      /deep/.confirm-icon {
        margin-right: 12px;
        font-size: 12px;
      }
    }
  }
}
</style>
