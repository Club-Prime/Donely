import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Users, Edit, Trash2, UserCheck, UserX, UserPlus, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface ProjectAccess {
  id: string;
  user_id: string;
  project_id: string;
  is_active: boolean;
  last_login_at: string;
  projects: {
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
}

export const ClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAccess, setProjectAccess] = useState<ProjectAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  
  // New client form states
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showEditClientForm, setShowEditClientForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Profile | null>(null);
  const [passwordClient, setPasswordClient] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    projectId: '',
    grantAccess: false
  });

  useEffect(() => {
    Promise.all([fetchClients(), fetchProjects(), fetchProjectAccess()]);
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'CLIENT')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    }
  };

  const fetchProjectAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('client_project_access')
        .select(`
          *,
          projects(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjectAccess(data || []);
    } catch (error) {
      console.error('Erro ao buscar acessos:', error);
    }
  };

  const toggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', clientId);

      if (error) throw error;
      toast({
        title: `Cliente ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`
      });
      fetchClients();
    } catch (error) {
      console.error('Erro ao alterar status do cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do cliente",
        variant: "destructive"
      });
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !selectedProject) {
      toast({
        title: "Erro",
        description: "Selecione um cliente e um projeto",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if access already exists
      const { data: existingAccess, error: checkError } = await supabase
        .from('client_project_access')
        .select('id, is_active')
        .eq('user_id', selectedClient)
        .eq('project_id', selectedProject)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar acesso existente:', checkError);
        throw checkError;
      }

      if (existingAccess) {
        // If access exists but is inactive, reactivate it
        if (!existingAccess.is_active) {
          const { error: updateError } = await supabase
            .from('client_project_access')
            .update({ is_active: true })
            .eq('id', existingAccess.id);

          if (updateError) throw updateError;
          
          toast({ title: "Acesso reativado com sucesso!" });
        } else {
          toast({
            title: "Informação",
            description: "Este cliente já possui acesso ativo ao projeto selecionado",
            variant: "default"
          });
        }
      } else {
        // Create new access
        const { error } = await supabase
          .from('client_project_access')
          .insert([{
            user_id: selectedClient,
            project_id: selectedProject,
            is_active: true
          }]);

        if (error) throw error;
        toast({ title: "Acesso concedido com sucesso!" });
      }

      setShowAccessForm(false);
      setSelectedClient('');
      setSelectedProject('');
      fetchProjectAccess();
    } catch (error) {
      console.error('Erro ao conceder acesso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível conceder o acesso",
        variant: "destructive"
      });
    }
  };

  const toggleProjectAccess = async (accessId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('client_project_access')
        .update({ is_active: !currentStatus })
        .eq('id', accessId);

      if (error) throw error;
      toast({
        title: `Acesso ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`
      });
      fetchProjectAccess();
    } catch (error) {
      console.error('Erro ao alterar acesso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o acesso",
        variant: "destructive"
      });
    }
  };

  const getClientAccess = (clientId: string) => {
    return projectAccess.filter(access => access.user_id === clientId);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClientData.name || !newClientData.email || !newClientData.username || !newClientData.password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (newClientData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (newClientData.grantAccess && !newClientData.projectId) {
      toast({
        title: "Erro", 
        description: "Selecione um projeto para conceder acesso",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Iniciando criação de cliente...');
      
      // Store current session to restore later
      const { data: currentSession } = await supabase.auth.getSession();
      console.log('Sessão atual salva:', !!currentSession.session);
      
      // Create user through Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newClientData.email,
        password: newClientData.password,
        options: {
          data: {
            name: newClientData.name,
            username: newClientData.username,
            role: 'CLIENT'
          },
          emailRedirectTo: undefined // Disable email confirmation
        }
      });

      console.log('Resultado do signUp:', { 
        authData: authData ? {
          user: authData.user ? {
            id: authData.user.id,
            email: authData.user.email,
            confirmed_at: authData.user.email_confirmed_at,
            created_at: authData.user.created_at
          } : null,
          session: !!authData.session
        } : null, 
        signUpError 
      });

      if (signUpError) {
        console.error('Erro no signUp:', signUpError);
        throw signUpError;
      }
      
      if (!authData.user) {
        throw new Error('Usuário não foi criado');
      }

      console.log('Usuário criado com ID:', authData.user.id);
      
      // Debug: Try to check if user exists in auth.users (if we have access)
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        console.log('Usuários no auth.users:', authUsers?.users?.length || 0);
        console.log('Novo usuário ID:', authData.user.id);
      } catch (authListError) {
        console.log('Não foi possível listar usuários do auth (normal em produção)');
      }

      // Check if user needs email confirmation
      if (authData.user && !authData.user.email_confirmed_at) {
        console.log('Usuário precisa de confirmação de email. Tentando confirmar automaticamente...');
        
        // Try to auto-confirm the user (this might not work depending on Supabase settings)
        try {
          const { error: confirmError } = await supabase.auth.admin.updateUserById(
            authData.user.id,
            { email_confirm: true }
          );
          
          if (confirmError) {
            console.log('Não foi possível confirmar automaticamente:', confirmError);
            toast({
              title: "Usuário criado com aviso",
              description: "Cliente criado, mas pode precisar confirmar email para fazer login.",
              variant: "default"
            });
          } else {
            console.log('Email confirmado automaticamente');
          }
        } catch (confirmError) {
          console.log('Método de confirmação automática não disponível');
        }
      }

      // Wait a bit for the trigger to create the profile
      console.log('Aguardando trigger criar o perfil...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if profile was created by trigger
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('user_id', authData.user.id)
        .single();

      console.log('Verificação do perfil após trigger:', { profileCheck, profileError });

      // If profile wasn't created by trigger, create it manually
      if (profileError || !profileCheck) {
        console.log('Trigger não funcionou. Criando perfil manualmente...');
        const { data: manualProfile, error: manualProfileError } = await supabase
          .from('profiles')
          .insert([{
            user_id: authData.user.id,
            name: newClientData.name,
            email: newClientData.email,
            username: newClientData.username,
            role: 'CLIENT',
            is_active: true
          }])
          .select()
          .single();

        if (manualProfileError) {
          console.error('Erro ao criar perfil manualmente:', manualProfileError);
          throw new Error(`Erro ao criar perfil: ${manualProfileError.message}`);
        }
        console.log('Perfil criado manualmente com sucesso:', manualProfile);
      } else {
        console.log('Perfil criado pelo trigger com sucesso:', profileCheck);
      }

      // Immediately sign out the newly created user to prevent auto-login
      console.log('Fazendo logout do usuário recém-criado...');
      await supabase.auth.signOut();

      // Restore the admin session if it existed
      if (currentSession.session) {
        console.log('Restaurando sessão do admin...');
        const { error: sessionError } = await supabase.auth.setSession(currentSession.session);
        if (sessionError) {
          console.error('Erro ao restaurar sessão:', sessionError);
        }
      }

      // Grant project access if requested
      if (newClientData.grantAccess && newClientData.projectId) {
        console.log('Concedendo acesso ao projeto...');
        
        // Wait a bit more to ensure everything is set up
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if access already exists
        const { data: existingAccess, error: checkError } = await supabase
          .from('client_project_access')
          .select('id')
          .eq('user_id', authData.user.id)
          .eq('project_id', newClientData.projectId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Erro ao verificar acesso existente:', checkError);
        }

        if (!existingAccess) {
          const { error: accessError } = await supabase
            .from('client_project_access')
            .insert([{
              user_id: authData.user.id,
              project_id: newClientData.projectId,
              is_active: true
            }]);

          if (accessError) {
            console.error('Erro ao conceder acesso:', accessError);
            toast({
              title: "Cliente criado com aviso",
              description: `Cliente criado com sucesso, mas houve um problema ao conceder acesso ao projeto. Você pode conceder o acesso manualmente.`,
              variant: "default"
            });
          } else {
            console.log('Acesso concedido com sucesso');
          }
        } else {
          console.log('Acesso já existe para este usuário e projeto');
        }
      }

      toast({ 
        title: "Cliente criado com sucesso!",
        description: "O cliente foi cadastrado e pode fazer login com email/senha"
      });
      
      resetNewClientForm();
      setShowNewClientForm(false);
      
      // Refresh data
      await Promise.all([fetchClients(), fetchProjectAccess()]);
      
    } catch (error) {
      console.error('Erro geral ao criar cliente:', error);
      toast({
        title: "Erro",
        description: `Não foi possível criar o cliente: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleEditClient = (client: Profile) => {
    setEditingClient(client);
    setNewClientData({
      name: client.name,
      email: client.email,
      username: client.username,
      password: '',
      projectId: '',
      grantAccess: false
    });
    setShowEditClientForm(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingClient || !newClientData.name || !newClientData.email || !newClientData.username) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update profile data
      const { error } = await supabase
        .from('profiles')
        .update({
          name: newClientData.name,
          email: newClientData.email,
          username: newClientData.username
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      // Note: Password update requires admin privileges or user session
      // For now, we'll skip password update in the admin panel
      // To change password, the user would need to use "forgot password" flow
      if (newClientData.password) {
        toast({
          title: "Informação",
          description: "Dados do cliente atualizados. Para alterar a senha, o cliente deve usar 'Esqueci minha senha' na tela de login.",
          variant: "default"
        });
      } else {
        toast({ 
          title: "Cliente atualizado com sucesso!"
        });
      }
      
      resetNewClientForm();
      setShowEditClientForm(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente",
        variant: "destructive"
      });
    }
  };

  const resetNewClientForm = () => {
    setNewClientData({
      name: '',
      email: '',
      username: '',
      password: '',
      projectId: '',
      grantAccess: false
    });
  };

  const handleDeleteClient = async (client: Profile) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${client.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // First, remove all project access for this client
      const { error: accessError } = await supabase
        .from('client_project_access')
        .delete()
        .eq('user_id', client.user_id);

      if (accessError) {
        console.warn('Erro ao remover acessos do cliente:', accessError);
      }

      // Delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', client.id);

      if (profileError) throw profileError;

      // Note: We cannot delete the auth user from the client side
      // In a production environment, you would need a server-side function
      // or use Supabase's admin functions to delete the auth user

      toast({
        title: "Cliente excluído com sucesso!",
        description: "O cliente foi removido do sistema."
      });

      fetchClients();
      fetchProjectAccess();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente",
        variant: "destructive"
      });
    }
  };

  const handlePasswordChange = (client: Profile) => {
    setPasswordClient(client);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordClient) return;

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos de senha",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Iniciando alteração direta de senha para:', passwordClient.email);
      
      // Chamar API serverless segura passando token do admin no header
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Sessão inválida. Faça login novamente.');
      }

      // Chamar Supabase Edge Function (update-password)
      const { error: fnError } = await supabase.functions.invoke('update-password', {
        body: {
          userId: passwordClient.user_id,
          newPassword,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Falha ao alterar senha');
      }

      toast({
        title: 'Senha alterada com sucesso!',
        description: `A senha do cliente ${passwordClient.name} foi atualizada diretamente.`,
      });

      setShowPasswordForm(false);
      setPasswordClient(null);
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      // Fallback: fluxo de reset por email
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          passwordClient.email,
          {
            redirectTo: `${window.location.origin}/auth/callback`,
          }
        );

        if (resetError) throw resetError;

        toast({
          title: 'Email de redefinição enviado',
          description: `Não foi possível alterar diretamente. Um email foi enviado para ${passwordClient.email} com link para redefinir a senha.`,
          variant: 'default',
        });
      } catch (fallbackErr) {
        toast({
          title: 'Erro',
          description:
            'Não foi possível alterar a senha. Verifique a configuração do servidor (service_role) e tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">Carregando clientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold">Gerenciar Clientes</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Dialog open={showNewClientForm} onOpenChange={setShowNewClientForm}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo cliente para adicioná-lo ao sistema.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nome completo"
                      value={newClientData.name}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      value={newClientData.username}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  
                   <div className="space-y-2">
                     <Label htmlFor="password">Senha * (mínimo 6 caracteres)</Label>
                     <Input
                       id="password"
                       type="password"
                       placeholder="senha do cliente"
                       value={newClientData.password}
                       onChange={(e) => setNewClientData(prev => ({ ...prev, password: e.target.value }))}
                       required
                       minLength={6}
                     />
                   </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      id="grantAccess"
                      type="checkbox"
                      checked={newClientData.grantAccess}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, grantAccess: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="grantAccess">Conceder acesso a um projeto</Label>
                  </div>
                  
                  {newClientData.grantAccess && (
                    <div className="space-y-2">
                      <Label htmlFor="projectId">Projeto</Label>
                      <Select
                        value={newClientData.projectId}
                        onValueChange={(value) => setNewClientData(prev => ({ ...prev, projectId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um projeto" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">
                      Cadastrar Cliente
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetNewClientForm();
                        setShowNewClientForm(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showEditClientForm} onOpenChange={setShowEditClientForm}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Editar Cliente</DialogTitle>
                  <DialogDescription>
                    Modifique as informações do cliente selecionado.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateClient} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome *</Label>
                    <Input
                      id="edit-name"
                      type="text"
                      placeholder="Nome completo"
                      value={newClientData.name}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                   <div className="space-y-2">
                     <Label htmlFor="edit-username">Username *</Label>
                     <Input
                       id="edit-username"
                       type="text"
                       placeholder="username"
                       value={newClientData.username}
                       onChange={(e) => setNewClientData(prev => ({ ...prev, username: e.target.value }))}
                       required
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="edit-password">Alterar Senha</Label>
                     <Input
                       id="edit-password"
                       type="password"
                       placeholder="Para alterar senha, cliente deve usar 'Esqueci minha senha'"
                       disabled
                       className="bg-muted"
                     />
                     <p className="text-xs text-muted-foreground">
                       Por motivos de segurança, alterações de senha devem ser feitas pelo próprio cliente através da opção "Esqueci minha senha" na tela de login.
                     </p>
                   </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">
                      Salvar Alterações
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetNewClientForm();
                        setShowEditClientForm(false);
                        setEditingClient(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showPasswordForm} onOpenChange={setShowPasswordForm}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Alterar Senha do Cliente</DialogTitle>
                  <DialogDescription>
                    Digite uma nova senha para o cliente selecionado.
                  </DialogDescription>
                </DialogHeader>
                {passwordClient && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium">{passwordClient.name}</p>
                    <p className="text-xs text-muted-foreground">{passwordClient.email}</p>
                  </div>
                )}
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha *</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Digite a nova senha (mínimo 6 caracteres)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha *</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Digite novamente a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Como funciona:</strong> O sistema tentará alterar a senha diretamente. 
                      Se não for possível, um email de redefinição será enviado para o cliente.
                      Certifique-se de comunicar a nova senha ao cliente de forma segura.
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">
                      Alterar Senha
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordClient(null);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button
              onClick={() => setShowAccessForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Conceder Acesso
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showAccessForm && (
          <Card className="mb-8 bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Conceder Acesso ao Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGrantAccess} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Cliente</label>
                    <Select
                      value={selectedClient}
                      onValueChange={setSelectedClient}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.user_id}>
                            {client.name} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Projeto</label>
                    <Select
                      value={selectedProject}
                      onValueChange={setSelectedProject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit">Conceder Acesso</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAccessForm(false);
                      setSelectedClient('');
                      setSelectedProject('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {clients.map((client) => {
            const clientAccess = getClientAccess(client.user_id);
            
            return (
              <Card key={client.id} className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{client.email}</span>
                        <span>•</span>
                        <span>@{client.username}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Switch
                        checked={client.is_active}
                        onCheckedChange={() => toggleClientStatus(client.id, client.is_active)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePasswordChange(client)}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Senha
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClient(client)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Acessos aos Projetos:</h4>
                      {clientAccess.length > 0 ? (
                        <div className="space-y-2">
                          {clientAccess.map((access) => (
                            <div
                              key={access.id}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  {access.is_active ? (
                                    <UserCheck className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <UserX className="w-4 h-4 text-red-500" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {access.projects?.name}
                                  </span>
                                </div>
                                {access.last_login_at && (
                                  <span className="text-xs text-muted-foreground">
                                    Último acesso: {new Date(access.last_login_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <Switch
                                checked={access.is_active}
                                onCheckedChange={() => toggleProjectAccess(access.id, access.is_active)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nenhum acesso a projetos concedido
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {clients.length === 0 && (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Users className="w-16 h-16 text-muted-foreground" />
                <div className="text-lg font-medium">Nenhum cliente encontrado</div>
                <p className="text-muted-foreground text-sm">
                  Os clientes aparecerão aqui quando se cadastrarem no sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};