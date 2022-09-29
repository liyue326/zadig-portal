const path = require('path');
const webpack = require('webpack');
const config = require('../config');
module.exports = {
  entry: {
    vendor: ['vue-router', 'vuex', 'vue/dist/vue.common.js', 'vue/dist/vue.js', 'vue', 'echarts', 'lodash', 'node-forge', 'vue2-ace-bind', 'countup.js', 'diff', 'js-base64', 'js-yaml', 'jsencrypt', 'moment', 'qs', 'xterm','xterm-addon-attach','xterm-addon-fit','xterm-addon-search','xlsx']
  },
  output: {
    path: path.join(__dirname, '../static/js'),
    filename: '[name].dll.js',
    library: '[name]_library'
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, '../static', '[name]-manifest.json'),
      context: __dirname,
      name: '[name]_library'
    })
  ]
};