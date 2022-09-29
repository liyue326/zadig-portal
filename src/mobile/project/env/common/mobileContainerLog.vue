<template>
  <div class="mobile-container-log">
    <div :id="id"></div>
  </div>
</template>

<script>
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { SearchAddon } from 'xterm-addon-search'
import 'xterm/css/xterm.css'
export default {
  data () {
    return {
      logs: [],
      index: 0,
      term: null,
      window: window
    }
  },
  methods: {
    clearCurrentTerm () {
      this.term.clear()
    },
    scrollToTop () {
      this.term.scrollToTop()
    },
    scrollToBottom () {
      this.term.scrollToBottom()
    },
    showRealTimeLog () {
      const id = this.id
      const projectName = this.projectName
      const envName = this.envName
      const podName = this.podName
      const containerName = this.containerName
      const query = `tails=300&projectName=${projectName}&envName=${envName}`
      this.$sse(
        `/api/aslan/logs/sse/pods/${podName}/containers/${containerName}?${query}`
      )
        .then(sse => {
          // Store SSE object at a higher scope
          window.msgServer = {}
          window.msgServer[id] = sse
          sse.subscribe('', data => {
            this.logs.push(Object.freeze(data) + '\r\n')
          })
        })
        .catch(err => {
          console.error('Failed to connect to server', err)
          delete window.msgServer[id]
        })
    },
    closeRealTimeLog (id) {
      this.term.clear()
      if (window.msgServer && window.msgServer[id]) {
        window.msgServer[id].close()
        delete window.msgServer[id]
      }
    }
  },
  props: {
    id: {
      required: true,
      type: String
    },
    projectName: {
      required: true,
      type: String
    },
    envName: {
      required: true,
      type: String
    },
    podName: {
      required: true,
      type: String
    },
    containerName: {
      required: true,
      type: String
    },
    closed: {
      required: true,
      type: Boolean
    },
    visible: {
      required: true,
      type: Boolean
    }
  },
  watch: {
    visible: function (new_val, old_val) {
      if (new_val) {
        this.showRealTimeLog()
      }
    },
    closed: function (new_val, old_val) {
      if (new_val) {
        this.closeRealTimeLog(this.id)
      }
    },
    logs: function (new_val, old_val) {
      for (let i = this.index; i < new_val.length; i++) {
        this.term.write(new_val[i] + '\r')
      }
      this.index = new_val.length
    }
  },
  destroyed () {
    this.closeRealTimeLog(this.id)
  },
  mounted () {
    const term = new Terminal({
      fontSize: 10,
      rows: '30',
      padding: '15',
      fontFamily: 'Monaco,Consolas,monospace,Microsoft YaHei,Arial',
      disableStdin: true,
      scrollback: 9999999,
      cursorStyle: null
    })
    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()
    term.loadAddon(searchAddon)
    term.loadAddon(fitAddon)
    term.open(document.getElementById(this.id))
    fitAddon.fit()
    this.term = term
    this.showRealTimeLog('open')
  }
}
</script>
<style lang="less">
.mobile-container-log {
  width: 100%;
  margin: 15px 0;

  .xterm {
    padding: 15px 10px;
  }
}
</style>
