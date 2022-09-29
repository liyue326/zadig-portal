export function wordTranslate (word, category, subitem = '') {
  const wordComparisonTable = {
    container: {
      'NOT-RUNNING': '未正常运行',
      RUNNING: '正常运行',
      STOPPED: '容器被停止',
      EXITED: '容器已退出',
      RESTARTING: '容器一直在重启'
    },
    service: {
      Running: '正在运行',
      Pending: '正在等待',
      CrashLoopBackOff: '发生错误',
      '': '*'
    },
    product: {
      Running: '正常',
      Deleting: '删除中',
      Updating: '更新中',
      Unstable: '运行不稳定',
      Error: '内部错误'
    },
    pipeline: {
      task: {
        '': '未运行',
        created: '排队中',
        waiting: '排队中',
        running: '正在运行',
        failed: '失败',
        passed: '成功',
        timeout: '超时',
        cancelled: '取消',
        blocked: '阻塞',
        queued: '队列中',
        skipped: '跳过',
        prepare: '准备环境',
        reject: '拒绝'
      }
    },
    approval: {
      status: {
        '': '待审核',
        waiting: '排队中',
        running: '正在运行',
        failed: '失败',
        passed: '成功',
        timeout: '超时',
        cancelled: '取消',
        blocked: '阻塞',
        queued: '队列中',
        skipped: '跳过',
        prepare: '准备环境',
        reject: '拒绝',
        approve: '通过'
      }
    },
    project: {
      vars: {
        unused: '未使用',
        present: '已使用',
        new: '值为空'
      }
    },
    setting: {
      cluster: {
        pending: '等待接入',
        normal: '正常', // 正常
        abnormal: '异常', // 异常
        disconnected: '主动断开'
      }
    },
    workflowStage: {
      build: '构建部署',
      artifact: '交付物部署',
      test: '测试',
      distribute: '分发部署'
    }
  }
  if (subitem === '') {
    return wordComparisonTable[category][word]
  } else if (subitem !== '') {
    return wordComparisonTable[category][subitem][word]
  }
}

export function translateTaskStatus (status) {
  return wordTranslate(status, 'pipeline', 'task')
}

export function colorTranslate (word, category, subitem = '') {
  if (typeof word === 'undefined' || word === '') {
    return 'color-notrunning'
  } else {
    const colorComparisonTable = {
      pipeline: {
        task: {
          created: 'color-created',
          waiting: 'color-created',
          running: 'color-running',
          failed: 'color-failed',
          passed: 'color-passed',
          timeout: 'color-timeout',
          cancelled: 'color-cancelled',
          reject: 'color-failed',
          approve: 'color-passed'
        }
      },
      approval: {
        status: {
          '': 'color-created',
          reject: 'color-failed',
          approve: 'color-passed',
          waiting: 'color-created',
          running: 'color-running',
          failed: 'color-failed',
          passed: 'color-passed',
          timeout: 'color-timeout',
          cancelled: 'color-cancelled'
        }
      },
      environment: {
        status: {
          Running: 'status-running',
          Creating: 'status-primary',
          Updating: 'status-primary',
          Succeeded: 'status-success',
          Unstable: 'status-warning',
          Deleting: 'status-warning',
          Error: 'status-danger',
          Unknown: 'status-info'
        }
      }
    }
    if (word !== '' && subitem === '') {
      return colorComparisonTable[category][word]
    } else if (word !== '' && subitem !== '') {
      return colorComparisonTable[category][subitem][word]
    }
  }
}

export function calcTaskStatusColor (status) {
  return colorTranslate(status, 'pipeline', 'task')
}

export function calcEnvStatusColor (status) {
  return colorTranslate(status, 'environment', 'status')
}

export function translateEnvStatus (status, updateble) {
  if (status === 'Running' && updateble) {
    return '环境可更新'
  } else if (status === 'Creating') {
    return '正在创建'
  } else if (status === 'Running') {
    return '正在运行'
  } else if (status === 'Updating') {
    return '更新中'
  } else if (status === 'Succeeded') {
    return '正常'
  } else if (status === 'Unstable') {
    return '运行不稳定'
  } else if (status === 'Deleting') {
    return '删除中'
  } else if (status === 'Error') {
    return '内部错误'
  } else if (status === 'Unknown') {
    return '未知'
  }
}

export const serviceTypeMap = {
  k8s: '容器'
}

export function translateServiceType (type) {
  return serviceTypeMap[type]
}

export const subTaskTypeMap = {
  distribute2kodo: '存储分发',
  release_image: '镜像分发'
}

export function translateSubTaskType (type) {
  return subTaskTypeMap[type]
}

export default {
  wordTranslate,
  translateTaskStatus,

  colorTranslate,
  calcTaskStatusColor,
  calcEnvStatusColor,

  translateServiceType,
  translateSubTaskType
}
