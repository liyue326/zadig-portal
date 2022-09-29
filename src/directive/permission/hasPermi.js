import { permissionCheckingLogic } from '@utils/checkPermission'

async function checkPermission (el, binding) {
  const { type, projectName, action, actions, operator, resource, isBtn, disabled = false } = binding.value
  const hasPermission = await permissionCheckingLogic({
    type,
    projectName,
    action,
    actions,
    resource,
    operator
  })
  // const disableClickFn = (event) => {
  //   event && event.stopImmediatePropagation()
  // }
  if (!hasPermission) {
    if (isBtn) {
      if (!el.classList.contains('permission-disabled')) {
        el.classList.add('permission-disabled')
        el.classList.add('is-disabled')
        el.setAttribute('disabled', 'disabled')
        el.setAttribute('tips', '无权限操作')
        // el.addEventListener('click', disableClickFn, true)
      }
    } else {
      el.parentNode && el.parentNode.removeChild(el)
    }
  } else if (isBtn) {
    el.classList.remove('permission-disabled')
    if (!disabled) {
      el.classList.remove('is-disabled')
      el.removeAttribute('disabled')
    }
  }
}

export default {
  async inserted (el, binding) {
    await checkPermission(el, binding)
  },
  async update (el, binding) {
    await checkPermission(el, binding)
  }
}
