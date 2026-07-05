import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUiStore } from '@/store/uiStore';

/**
 * Layout principal de la aplicación con sidebar fijo + header + área de contenido.
 * En móvil: sidebar es un drawer que se abre con el botón de hamburguesa.
 */
export default function AppLayout() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUiStore();

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0f1a10]">
      {/* Overlay para cerrar sidebar en móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Área principal */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}
      >
        {/* Header */}
        <Header />

        {/* Contenido de la página */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
