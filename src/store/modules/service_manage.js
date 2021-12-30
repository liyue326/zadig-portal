import * as Mutation from '../mutations'
import * as Api from '@/api'
import router from '@/router'
export default {
  state: {
    serviceList: [],
    serviceModules: [],
    showNext: false,
    serviceDialogVisible: false,
    currentService: null,
    chartNames: [],
    updateEnv: false,
    services: [] // used for service order
  },
  mutations: {
    [Mutation.QUERY_SERVICE_MODULE] (state, payload) {
      state.serviceModules = payload
    },
    [Mutation.RESET_SERVICE_MODULE] (state) {
      state.serviceModules = []
    },
    [Mutation.QUERY_SERVICE_LIST] (state, payload) {
      state.serviceList = payload.service
    },
    [Mutation.OPEN_SHOW_NEXT] (state, payload) {
      state.showNext = payload
    },
    [Mutation.SERVICE_DIALOG_VISIBLE] (state, payload) {
      state.serviceDialogVisible = payload
    },
    [Mutation.CURRENT_SERVICE] (state, payload) {
      state.currentService = payload
    },
    [Mutation.CHART_NAMES] (state, services) {
      const chartNames = state.chartNames
      services.forEach(service => {
        const serviceNames = chartNames.map(chart => chart.serviceName)
        const index = serviceNames.indexOf(service.serviceName)
        const type = service.type
        if (type === 'delete') {
          if (index !== -1) {
            chartNames.splice(index, 1)
          } else {
            chartNames.push(service)
          }
        } else if (index === -1) {
          chartNames.push(service)
        }
      })
      state.chartNames = chartNames
    },
    [Mutation.RESET_CHART_NAMES] (state, services) {
      state.chartNames = []
      state.updateEnv = false
    },
    [Mutation.UPDATE_ENV_BUTTON] (state, payload) {
      state.updateEnv = payload
    },
    [Mutation.QUERY_ORDER_SERVICE] (state, payload) {
      state.services = payload
    }
  },
  actions: {
    async queryService ({ dispatch, commit }, payload) {
      const service = []
      const res = await Api.getHelmChartService(payload.projectName).catch(error => console.log(error))
      if (res) {
        commit(Mutation.QUERY_ORDER_SERVICE, res.services || [])
        res.serviceInfos = res.service_infos ? res.service_infos : []
        if (res.serviceInfos.length) {
          commit(Mutation.OPEN_SHOW_NEXT, true)
          let item = null
          res.serviceInfos.forEach((element, index) => {
            item = element
            item.id = index
            item.label = element.service_name
            item.service_type = element.type
            item.type = 'service'
            item.children = []
            item.isService = true
            service.push(item)
          })
          service[0].children = res.file_infos.map((child, index) => {
            child.id = child.name + index
            child.label = child.name
            child.service_name = service[0].service_name
            child.txt = ''
            child.type = child.is_dir ? 'folder' : 'file'
            if (child.is_dir) {
              child.children = []
            }
            return child
          })
          const showService = payload.showServiceName ? service.find(s => s.service_name === payload.showServiceName) : service[0]
          const params = {
            projectName: payload.projectName,
            serviceName: showService.service_name
          }
          router.replace({
            query: Object.assign(
              {},
              {},
              {
                service_name: showService.service_name,
                service_type: showService.service_type,
                rightbar: 'var'
              })
          })
          dispatch('queryServiceModule', params)
        } else {
          commit(Mutation.OPEN_SHOW_NEXT, false)
          dispatch('resetServiceModule')
        }
      }
      commit(Mutation.QUERY_SERVICE_LIST, { service: service, projectName: payload.projectName })
    },
    async updateHelmChart ({ dispatch }, payload) {
      const params = {
        helm_service_infos: []
      }
      payload.commitCache.forEach(item => {
        const data = {
          service_name: item.service_name,
          file_path: item.parent,
          file_name: item.label,
          file_content: item.txt
        }
        params.helm_service_infos.push(data)
      })
      const res = await Api.updateHelmChartAPI(payload.projectName, params).catch(error => console.log(error))
      if (res) {
        dispatch('queryService', { projectName: payload.projectName })
        return Promise.resolve(res)
      }
    },
    async queryFilePath ({ dispatch }, payload) {
      const res = await Api.getHelmChartServiceFilePath(payload).catch(error => console.log(error))
      if (res) {
        res.map((child, index) => {
          child.id = child.name + index
          child.label = child.name
          child.service_name = payload.serviceName
          child.txt = ''
          child.type = child.is_dir ? 'folder' : 'file'
          if (child.is_dir) {
            child.children = []
          }
          return child
        })
        return Promise.resolve(res)
      }
    },
    async queryFileContent ({ dispatch }, payload) {
      const res = await Api.getHelmChartServiceFileContent(payload).catch(error => console.log(error))
      if (res) {
        return Promise.resolve(res)
      }
    },
    queryServiceModule ({ commit }, payload) {
      return Api.getHelmChartServiceModule(payload.projectName, payload.serviceName).then(ret => {
        commit(Mutation.QUERY_SERVICE_MODULE, ret.service_modules)
      })
    },
    resetServiceModule ({ commit }, payload) {
      commit(Mutation.RESET_SERVICE_MODULE)
    }
  }
}
