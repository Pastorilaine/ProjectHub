import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import SettingsPage from './pages/SettingsPage'
import SearchModal from './components/SearchModal'
import CreateProjectModal from './components/CreateProjectModal'
import UpdateBanner from './components/UpdateBanner'

export default function App() {
  const [view, setView] = useState('projects') // 'projects' | 'project-detail' | 'settings'
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

  const goHome = () => {
    setView('projects')
    setSelectedProject(null)
    loadProjects()
  }

  const handleProjectCreated = async (project) => {
    await loadProjects()
    setShowCreateProject(false)
    openProject(project)
  }

  const handleProjectUpdated = async () => {
    await loadProjects()
    if (selectedProject) {
      const updated = projects.find((p) => p.id === selectedProject.id)
      if (updated) setSelectedProject(updated)
    }
  }

  const handleProjectDeleted = async () => {
    await loadProjects()
    goHome()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900 text-slate-400">
        <div className="text-sm">Ladataan...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <UpdateBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={openProject}
          onGoHome={goHome}
          onOpenSearch={() => setShowSearch(true)}
          onNewProject={() => setShowCreateProject(true)}
          onOpenSettings={() => setView('settings')}
          activeView={view}
        />

        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
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
            <SettingsPage onBack={goHome} />
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
            const p = projects.find((pr) => pr.id === projectId)
            if (p) openProject(p)
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
