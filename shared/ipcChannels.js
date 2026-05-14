/**
 * IPC channel names shared between main and preload processes.
 * Both sides import this to avoid hardcoded strings.
 */
const IPC = {
  // Projects
  PROJECTS_GET_ALL: 'db:projects:getAll',
  PROJECTS_CREATE: 'db:projects:create',
  PROJECTS_UPDATE: 'db:projects:update',
  PROJECTS_DELETE: 'db:projects:delete',

  // Tasks
  TASKS_GET_BY_PROJECT: 'db:tasks:getByProject',
  TASKS_CREATE: 'db:tasks:create',
  TASKS_UPDATE: 'db:tasks:update',
  TASKS_DELETE: 'db:tasks:delete',
  TASKS_UPDATE_STATUS: 'db:tasks:updateStatus',

  // Tags
  TAGS_GET_ALL: 'db:tags:getAll',
  TAGS_CREATE: 'db:tags:create',
  TAGS_DELETE: 'db:tags:delete',

  // Search
  SEARCH: 'db:search',

  // Auto-updater (renderer → main)
  UPDATE_INSTALL: 'update:install',
  UPDATE_CHECK: 'update:check',

  // App info
  APP_GET_VERSION: 'app:getVersion'
}

export default IPC
