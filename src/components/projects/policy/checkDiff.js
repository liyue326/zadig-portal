import { cloneDeep, difference } from 'lodash'

let userList = []

function transformUidToName (userIds) {
  if (!userIds.length) {
    return []
  }
  return userList
    .filter(user => userIds.includes(user.uid))
    .map(user => user.username)
}

function getArraySet (arr1, arr2, key = '') {
  const a1 = cloneDeep(arr1)
  const a2 = cloneDeep(arr2)
  const res = {
    intersection: [],
    left: [],
    right: [],
    all: [],
    length: 0
  }
  a1.forEach(data => {
    const d = data[key] || data
    const id = a2.findIndex(data => (data[key] || data) === d)
    if (id !== -1) {
      const del = a2.splice(id, 1)[0]
      if (key) {
        let updated = false
        Object.keys(del).forEach(k => {
          if (
            (Array.isArray(del[k]) &&
                            (del[k].length !== data[k].length ||
                                difference(del[k], data[k]).length)) ||
                        (!Array.isArray(del[k]) && del[k] !== data[k])
          ) {
            updated = true
          }
        })
        if (updated) {
          res.intersection.push({ ...del, type: 'updated' })
        }
      } else {
        res.intersection.push(del)
      }
    } else {
      res.left.push(key ? { ...data, type: 'deleted' } : data)
    }
  })
  res.right = key
    ? a2.map(a => {
      return { ...a, type: 'added' }
    })
    : a2
  res.length = res.intersection.length + res.left.length + res.right.length
  res.all = [].concat(res.intersection, res.left, res.right)
  return res
}

export function checkDifferent (current, initial, users) {
  userList = users
  let changedInfo = {} //  added: {}, deleted: {}, updated: {}

  const isAllMemberCurr = current ? current.members.includes('*') : false
  const isAllMemberInit = initial ? initial.members.includes('*') : false

  if (!initial) {
    changedInfo = {
      added: {
        members: isAllMemberCurr
          ? ['所有用户']
          : transformUidToName(current.members),
        workflows: cloneDeep(current.workflows),
        products: cloneDeep(current.products)
      }
    }
    return {
      changedInfo,
      mode: 'added'
    }
  } else if (!current) {
    changedInfo = {
      deleted: {
        members: isAllMemberInit
          ? ['所有用户']
          : transformUidToName(initial.members),
        workflows: cloneDeep(initial.workflows),
        products: cloneDeep(initial.products)
      }
    }
    return {
      changedInfo,
      mode: 'deleted'
    }
  } else {
    // different user
    if (isAllMemberCurr && isAllMemberInit) {
      changedInfo = {
        updated: {
          members: ['所有用户']
        }
      }
    } else if (isAllMemberCurr) {
      changedInfo = {
        added: {
          members: ['所有用户']
        },
        updated: {
          members: []
        }
      }
    } else if (isAllMemberInit) {
      changedInfo = {
        deleted: {
          members: ['所有用户']
        },
        updated: {
          members: []
        }
      }
    } else {
      const members = getArraySet(initial.members, current.members)
      if (members.left.length) {
        changedInfo.deleted = {}
        changedInfo.deleted.members = transformUidToName(members.left)
      }
      if (members.right.length) {
        changedInfo.added = {}
        changedInfo.added.members = transformUidToName(members.right)
      }
      changedInfo = {
        ...changedInfo,
        updated: {
          members: transformUidToName(members.intersection)
        }
      }
    }
    // different workflow and product
    if (changedInfo.added) {
      changedInfo.added.workflows = cloneDeep(current.workflows)
      changedInfo.added.products = cloneDeep(current.products)
    }
    if (changedInfo.deleted) {
      changedInfo.deleted.workflows = cloneDeep(initial.workflows)
      changedInfo.deleted.products = cloneDeep(initial.products)
    }
    if (changedInfo.updated) {
      const workflows = getArraySet(
        initial.workflows,
        current.workflows,
        'name'
      )
      const products = getArraySet(
        initial.products,
        current.products,
        'name'
      )
      if (workflows.length || products.length) {
        changedInfo.updated.workflows = workflows.all
        changedInfo.updated.products = products.all
      } else {
        delete changedInfo.updated
      }
    }
    if (initial.recycle_day !== current.recycle_day) {
      if (!changedInfo.updated) {
        changedInfo.updated = {}
      }
      changedInfo.updated.recycle_day = current.recycle_day
    }
    return {
      changedInfo,
      mode: 'updated'
    }
  }
}
