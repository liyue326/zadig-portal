import * as types from '../mutations'

const state = {
  showMask: false
}

const getters = {
  showMask: state => {
    return state.showMask
  }
}

const mutations = {
  [types.SET_MASK_STATUS] (state, payload) {
    state.showMask = payload
  }
}

export default {
  state,
  getters,
  mutations
}
