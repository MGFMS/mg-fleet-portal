import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function PortalLayout() {
  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
        <footer className="text-center text-xs text-gray-500 py-2 border-t bg-white">
          © GM Solutions Inc {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}
