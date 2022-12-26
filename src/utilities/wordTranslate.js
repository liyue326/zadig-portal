import i18n from '@/lang'
export function wordTranslate (word, category, subitem = '') {
  const wordComparisonTable = {
    approval: {
      status: {
        '': '待审批',
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
    return i18n.t('environmentStatus.updateable')
  } else if (status === 'Creating') {
    return i18n.t('environmentStatus.creating')
  } else if (status === 'Running') {
    return i18n.t('environmentStatus.running')
  } else if (status === 'Updating') {
    return i18n.t('environmentStatus.updating')
  } else if (status === 'Succeeded') {
    return i18n.t('environmentStatus.succeeded')
  } else if (status === 'Unstable') {
    return i18n.t('environmentStatus.unstable')
  } else if (status === 'Deleting') {
    return i18n.t('environmentStatus.deleting')
  } else if (status === 'Error') {
    return i18n.t('environmentStatus.error')
  } else if (status === 'Unknown') {
    return i18n.t('environmentStatus.unknown')
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
  colorTranslate,
  calcTaskStatusColor,
  calcEnvStatusColor,
  translateServiceType,
  translateSubTaskType
}
