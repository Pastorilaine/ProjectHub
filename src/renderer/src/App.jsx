import { useState, useEffect, useCallback, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import IdeaLibraryPage from './pages/IdeaLibraryPage'
import SearchModal from './components/SearchModal'
import CreateProjectModal from './components/CreateProjectModal'
import UpdateBanner from './components/UpdateBanner'
import WindowControls from './components/WindowControls'
import FirstRunSetup from './components/FirstRunSetup'

export default function App() {
  const [view, setView] = useState('dashboard') // 'dashboard' | 'projects' | 'project-detail' | 'settings' | 'ideas'
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [settings, setSettings] = useState(null)
  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null)
  const [tags, setTags] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completingOnboarding, setCompletingOnboarding] = useState(false)

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null,
    [activeWorkspaceId, workspaces]
  )

  const applySettingsSnapshot = useCallback((snapshot) => {
    if (!snapshot) return
    setSettings(snapshot)
    setWorkspaces(Array.isArray(snapshot.workspaces) ? snapshot.workspaces : [])
    setActiveWorkspaceId(snapshot.activeWorkspaceId || null)
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const snapshot = await window.api.getSettings()
      applySettingsSnapshot(snapshot)
      return snapshot
    } catch (err) {
      console.error('Failed to load settings:', err)
      const fallback = { appName: 'ProjectHub', onboardingCompleted: false, workspaces: [], activeWorkspaceId: null }
      applySettingsSnapshot(fallback)
      return fallback
    }
  }, [applySettingsSnapshot])

  const loadProjects = useCallback(async () => {
    try {
      const data = await window.api.getProjects()
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }, [])

  const loadTags = useCallback(async () => {
    try {
      const data = await window.api.getTags()
      setTags(data)
    } catch (err) {
      console.error('Failed to load tags:', err)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const snapshot = await loadSettings()

      if (cancelled) return

      if (snapshot?.onboardingCompleted && snapshot?.activeWorkspaceId) {
        await Promise.all([loadProjects(), loadTags()])
      } else {
        setProjects([])
        setTags([])
      }

      if (!cancelled) setLoading(false)
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [loadSettings, loadProjects, loadTags])

  // Global keyboard shortcut: Ctrl/Cmd+K for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const openProject = (project) => {
    setSelectedProject(project)
    setView('project-detail')
  }

  const openProjectById = (projectId) => {
    const p = projects.find((pr) => pr.id === projectId)
    if (p) openProject(p)
  }

  const goHome = () => {
    setView('projects')
    setSelectedProject(null)
    loadProjects()
  }

  const goDashboard = () => {
    setView('dashboard')
    setSelectedProject(null)
    loadProjects()
  }

  const goIdeas = () => {
    setView('ideas')
    setSelectedProject(null)
  }

  const handleProjectCreated = async (project) => {
    await loadProjects()
    setShowCreateProject(false)
    openProject(project)
  }

  const handleProjectUpdated = async (updated) => {
    await loadProjects()
    if (updated && selectedProject?.id === updated.id) {
      setSelectedProject(updated)
    }
  }

  const handleProjectDeleted = async () => {
    await loadProjects()
    goHome()
  }

  const refreshWorkspaceData = useCallback(async (snapshot) => {
    applySettingsSnapshot(snapshot)
    setSelectedProject(null)
    setShowSearch(false)
    setShowCreateProject(false)
    setView((current) => (current === 'project-detail' ? 'dashboard' : current))
    await Promise.all([loadProjects(), loadTags()])
  }, [applySettingsSnapshot, loadProjects, loadTags])

  const handleSaveSettings = useCallback(async (partial) => {
    const saved = await window.api.saveSettings(partial)
    applySettingsSnapshot(saved)
    return saved
  }, [applySettingsSnapshot])

  const handleCreateWorkspace = useCallback(async (name) => {
    const snapshot = await window.api.createWorkspace({ name })
    await refreshWorkspaceData(snapshot)
    return snapshot
  }, [refreshWorkspaceData])

  const handleUpdateWorkspace = useCallback(async (id, name) => {
    const snapshot = await window.api.updateWorkspace({ id, name })
    applySettingsSnapshot(snapshot)
    return snapshot
  }, [applySettingsSnapshot])

  const handleDeleteWorkspace = useCallback(async (id) => {
    const snapshot = await window.api.deleteWorkspace(id)
    await refreshWorkspaceData(snapshot)
    return snapshot
  }, [refreshWorkspaceData])

  const handleSetActiveWorkspace = useCallback(async (id) => {
    const snapshot = await window.api.setActiveWorkspace(id)
    await refreshWorkspaceData(snapshot)
    return snapshot
  }, [refreshWorkspaceData])

  const handleCompleteOnboarding = useCallback(async ({ appName, workspaceName }) => {
    setCompletingOnboarding(true)
    try {
      const snapshot = await window.api.completeOnboarding({ appName, workspaceName })
      setView('dashboard')
      await refreshWorkspaceData(snapshot)
      return snapshot
    } finally {
      setCompletingOnboarding(false)
    }
  }, [refreshWorkspaceData])

  if (loading) {
    return (
      <div className="app-shell flex h-full items-center justify-center text-slate-400">
        <div className="surface-card flex items-center gap-3 px-5 py-4">
          <svg className="animate-spin w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Ladataan ProjectHubia...</span>
        </div>
        <WindowControls />
      </div>
    )
  }

  const needsOnboarding = !settings?.onboardingCompleted || !activeWorkspaceId || workspaces.length === 0

  return (
    <div className="app-shell flex flex-col h-full text-slate-100">
      <UpdateBanner />
      {needsOnboarding ? (
        <FirstRunSetup
          initialAppName={settings?.appName || 'ProjectHub'}
          onComplete={handleCompleteOnboarding}
          busy={completingOnboarding}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar
          appName={settings?.appName || 'ProjectHub'}
          projects={projects}
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          selectedProject={selectedProject}
          onSelectProject={openProject}
          onGoHome={goDashboard}
          onOpenSearch={() => setShowSearch(true)}
          onNewProject={() => setShowCreateProject(true)}
          onOpenSettings={() => setView('settings')}
          onOpenProjects={goHome}
          onOpenIdeas={goIdeas}
          onSwitchWorkspace={handleSetActiveWorkspace}
          activeView={view}
        />

        <main className="main-shell flex-1 overflow-hidden flex flex-col min-w-0">
          {view === 'dashboard' && (
            <DashboardPage
              key={`dashboard-${activeWorkspaceId || 'default'}`}
              onOpenProject={openProjectById}
              onNewProject={() => setShowCreateProject(true)}
            />
          )}
          {view === 'projects' && (
            <ProjectsPage
              key={`projects-${activeWorkspaceId || 'default'}`}
              projects={projects}
              onOpenProject={openProject}
              onNewProject={() => setShowCreateProject(true)}
              onRefresh={loadProjects}
            />
          )}
          {view === 'project-detail' && selectedProject && (
            <ProjectDetailPage
              project={selectedProject}
              tags={tags}
              onBack={goHome}
              onProjectUpdated={handleProjectUpdated}
              onProjectDeleted={handleProjectDeleted}
              onTagsChanged={loadTags}
            />
          )}
          {view === 'settings' && (
            <SettingsPage
              onBack={goDashboard}
              settings={settings}
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSaveSettings={handleSaveSettings}
              onCreateWorkspace={handleCreateWorkspace}
              onRenameWorkspace={handleUpdateWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
              onSetActiveWorkspace={handleSetActiveWorkspace}
            />
          )}
          {view === 'ideas' && (
            <IdeaLibraryPage key={`ideas-${activeWorkspaceId || 'default'}`} projects={projects} />
          )}
        </main>
        </div>
      )}

      {showSearch && !needsOnboarding && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onOpenProject={(project) => {
            setShowSearch(false)
            openProject(project)
          }}
          onOpenProjectById={(projectId) => {
            setShowSearch(false)
            openProjectById(projectId)
          }}
        />
      )}

      {showCreateProject && !needsOnboarding && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreated={handleProjectCreated}
        />
      )}

      <WindowControls />
    </div>
  )
}
