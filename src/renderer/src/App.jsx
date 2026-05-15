import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import SearchModal from './components/SearchModal'
import CreateProjectModal from './components/CreateProjectModal'
import UpdateBanner from './components/UpdateBanner'

export default function App() {
  const [view, setView] = useState('dashboard') // 'dashboard' | 'projects' | 'project-detail' | 'settings'
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [tags, setTags] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [loading, setLoading] = useState(true)

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
    Promise.all([loadProjects(), loadTags()]).finally(() => setLoading(false))
  }, [loadProjects, loadTags])

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500" style={{ background: '#060A12' }}>
        <svg className="animate-spin w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm">Ladataan...</span>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full text-slate-100"
      style={{
        background: '#060A12',
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.10)'
      }}
    >
      <UpdateBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={openProject}
          onGoHome={goDashboard}
          onOpenSearch={() => setShowSearch(true)}
          onNewProject={() => setShowCreateProject(true)}
          onOpenSettings={() => setView('settings')}
          onOpenProjects={goHome}
          activeView={view}
        />

        <main className="flex-1 overflow-hidden flex flex-col min-w-0" style={{ background: '#0A0F1C' }}>
          {view === 'dashboard' && (
            <DashboardPage
              onOpenProject={openProjectById}
              onNewProject={() => setShowCreateProject(true)}
            />
          )}
          {view === 'projects' && (
            <ProjectsPage
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
            <SettingsPage onBack={goDashboard} />
          )}
        </main>
      </div>

      {showSearch && (
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

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  )
}
