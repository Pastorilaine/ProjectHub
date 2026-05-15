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
  APP_GET_VERSION: 'app:getVersion',

  // Dashboard
  DASHBOARD_STATS: 'db:dashboard:stats',

  // Ideas
  IDEAS_GET_ALL: 'db:ideas:getAll',
  IDEAS_CREATE: 'db:ideas:create',
  IDEAS_UPDATE: 'db:ideas:update',
  IDEAS_DELETE: 'db:ideas:delete',
  IDEAS_UPDATE_STATUS: 'db:ideas:updateStatus',

  // Workspaces
  WORKSPACES_CREATE: 'app:workspaces:create',
  WORKSPACES_UPDATE: 'app:workspaces:update',
  WORKSPACES_DELETE: 'app:workspaces:delete',
  WORKSPACES_SET_ACTIVE: 'app:workspaces:setActive',

  // User settings
  SETTINGS_GET: 'app:settings:get',
  SETTINGS_SAVE: 'app:settings:save',

  // Window controls
  WINDOW_GET_STATE: 'window:getState',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_TOGGLE_MAXIMIZE: 'window:toggleMaximize',
  WINDOW_CLOSE: 'window:close'
}

export default IPC
