import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ClientDashboard } from "./pages/ClientDashboard";
import { ProjectsPage } from "./pages/admin/ProjectsPage";
import ProjectManagementPage from "./pages/admin/ProjectManagementPage";
import { ReportsPage } from "./pages/admin/ReportsPage";
import { ClientsPage } from "./pages/admin/ClientsPage";
import { EvidencesPage } from "./pages/admin/EvidencesPage";
import { RoadmapsPage } from "./pages/admin/RoadmapsPage";
import { SprintsPage } from "./pages/admin/SprintsPage";
import NotFound from "./pages/NotFound";
import ProjectEditPage from "./pages/admin/ProjectEditPage";
import RoadmapEditPage from "./pages/admin/RoadmapEditPage";
import SprintEditPage from "./pages/admin/SprintEditPage";
import ReportEditPage from "./pages/admin/ReportEditPage";
import EvidenceEditPage from "./pages/admin/EvidenceEditPage";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ProjectProvider>
                    <AdminDashboard />
                  </ProjectProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/projects" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ProjectsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/projects/manage" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ProjectProvider>
                    <ProjectManagementPage />
                  </ProjectProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ReportsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/clients" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ClientsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/evidences" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <EvidencesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/roadmaps" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <RoadmapsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/sprints" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SprintsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/projects/:id/edit" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ProjectEditPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/roadmaps/:id/edit" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <RoadmapEditPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/roadmaps/new" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <RoadmapEditPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/sprints/:id/edit" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SprintEditPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/sprints/new" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SprintEditPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/reports/:id/edit" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ReportEditPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/evidences/:id/edit" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <EvidenceEditPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/client" 
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ProjectProvider>
                    <ClientDashboard />
                  </ProjectProvider>
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
