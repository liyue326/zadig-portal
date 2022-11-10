import * as types from '../mutations'
import { getGlobalPermissionAPI } from '@api'
import { isEmpty } from 'lodash'
const state = {
  globalPermission: {}
}

const getters = {
  globalPermission: (state) => {
    return state.globalPermission
  }
}
const mutations = {
  [types.SET_GLOBAL_PERMISSION] (state, payload) {
    state.globalPermission = payload
  }
}

const actions = {
  async getGlobalPermission ({ commit, getters, state, rootGetters }) {
    return await getGlobalPermissionAPI().then(
      (res) => {
        commit(types.SET_GLOBAL_PERMISSION, res)
      },
      (err) => {
        window.console.log(err)
      }
    )
  },
  checkingPermission ({ state, commit, getters, dispatch, rootGetters }, payload) {
    const projectName = payload
    if (projectName && isEmpty(state[projectName])) {
      return dispatch('getGlobalPermission', projectName)
    }
  },
  refreshProjectPermission ({ commit, dispatch }) {
    return dispatch('getGlobalPermission')
  },
  clearProjectPermission ({ commit }) {
    commit(types.SET_GLOBAL_PERMISSION, {})
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
