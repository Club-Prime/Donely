import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, User, Calendar, Clock, Filter, SortAsc, SortDesc, Search, Reply, Shield, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface Comment {
  id: string;
  sprint_id: string;
  project_id: string;
  author_user_id: string;
  content_md: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

interface CommentReply {
  id: string;
  comment_id: string;
  author_user_id: string;
  content_md: string;
  is_from_admin: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

interface ComentariosViewProps {
  projectId: string;
  isAdminView?: boolean;
}

export const ComentariosView = ({ projectId, isAdminView = false }: ComentariosViewProps) => {
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [commentReplies, setCommentReplies] = useState<Record<string, CommentReply[]>>({});
  const [newComment, setNewComment] = useState('');
  const [newReplies, setNewReplies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'mine'>('all');

  // Apply filters and search
  useEffect(() => {
    let filtered = [...comments];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(comment =>
        comment.content_md.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply user filter
    if (filterBy === 'mine') {
      filtered = filtered.filter(comment => comment.author_user_id === profile?.user_id);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredComments(filtered);
  }, [comments, searchTerm, sortBy, filterBy, profile?.user_id]);

  useEffect(() => {
    const fetchCommentsAndReplies = async () => {
      try {
        // Buscar comentários diretamente do projeto
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('project_id', projectId)
          .eq('is_visible', true)
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;
        setComments(commentsData || []);

        // Buscar respostas para todos os comentários
        if (commentsData && commentsData.length > 0) {
          const commentIds = commentsData.map(c => c.id);
          const { data: repliesData, error: repliesError } = await supabase
            .from('comment_replies')
            .select('*')
            .in('comment_id', commentIds)
            .eq('is_visible', true)
            .order('created_at', { ascending: true });

          if (repliesError) {
            console.error('Erro ao buscar respostas:', repliesError);
          } else {
            // Organizar respostas por comment_id
            const repliesByComment: Record<string, CommentReply[]> = {};
            (repliesData || []).forEach(reply => {
              if (!repliesByComment[reply.comment_id]) {
                repliesByComment[reply.comment_id] = [];
              }
              repliesByComment[reply.comment_id].push(reply);
            });
            setCommentReplies(repliesByComment);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar comentários:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommentsAndReplies();
  }, [projectId]);

  const handleSubmitReply = async (commentId: string) => {
    const replyContent = newReplies[commentId];
    if (!replyContent?.trim() || !profile) {
      toast({
        title: "Erro",
        description: "Digite uma resposta válida",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);

      // Verificar se a tabela comment_replies existe, se não, usar uma abordagem alternativa
      const { error } = await supabase
        .from('comment_replies')
        .insert([{
          comment_id: commentId,
          author_user_id: profile.user_id,
          content_md: replyContent.trim(),
          is_from_admin: isAdminView,
          is_visible: true
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Resposta enviada com sucesso!"
      });

      // Limpar o campo de resposta
      setNewReplies(prev => ({ ...prev, [commentId]: '' }));
      setReplyingTo(null);

      // Recarregar respostas
      const { data: updatedReplies, error: fetchError } = await supabase
        .from('comment_replies')
        .select('*')
        .eq('comment_id', commentId)
        .eq('is_visible', true)
        .order('created_at', { ascending: true });

      if (!fetchError) {
        setCommentReplies(prev => ({
          ...prev,
          [commentId]: updatedReplies || []
        }));
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a resposta",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !profile) {
      toast({
        title: "Erro",
        description: "Digite um comentário válido",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);

      // Buscar uma sprint do projeto para anexar o comentário
      const { data: sprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sprintsError) throw sprintsError;

      if (!sprints || sprints.length === 0) {
        toast({
          title: "Erro",
          description: "Ainda não há sprints para este projeto",
          variant: "destructive"
        });
        return;
      }

      // Criar o comentário
      const { error } = await supabase
        .from('comments')
        .insert([{
          sprint_id: sprints[0].id,
          project_id: projectId,
          author_user_id: profile.user_id,
          content_md: newComment.trim(),
          is_visible: true
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comentário enviado com sucesso!"
      });

      setNewComment('');

      // Recarregar comentários
      const { data: updatedComments, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (!fetchError) {
        setComments(updatedComments || []);
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o comentário",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!profile) return;

    try {
      // Soft delete - marcar como não visível
      const { error } = await supabase
        .from('comments')
        .update({ is_visible: false })
        .eq('id', commentId)
        .or(`author_user_id.eq.${profile.user_id}${isAdminView ? ',project_id.eq.' + projectId : ''}`); // Autor ou admin pode excluir

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comentário excluído com sucesso!"
      });

      // Remover o comentário da lista local
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comentário",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReply = async (replyId: string, commentId: string) => {
    if (!profile) return;

    try {
      // Soft delete - marcar como não visível
      const { error } = await supabase
        .from('comment_replies')
        .update({ is_visible: false })
        .eq('id', replyId)
        .or(`author_user_id.eq.${profile.user_id}${isAdminView ? ',is_from_admin.eq.true' : ''}`); // Autor ou admin pode excluir

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Resposta excluída com sucesso!"
      });

      // Atualizar as respostas do comentário específico
      setCommentReplies(prev => ({
        ...prev,
        [commentId]: prev[commentId]?.filter(reply => reply.id !== replyId) || []
      }));
    } catch (error) {
      console.error('Erro ao excluir resposta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a resposta",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Comentários do Projeto</h3>
        <p className="text-muted-foreground">
          Suas observações, dúvidas e feedback sobre o desenvolvimento do projeto.
        </p>
      </div>

      {/* New Comment Form */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Novo Comentário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite seu comentário, observação ou pergunta..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
            disabled={submitting}
          />
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {profile?.username && (
                <span>Postando como: <strong>{profile.username}</strong></span>
              )}
            </div>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Enviando...' : 'Enviar Comentário'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar comentários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterBy} onValueChange={(value: 'all' | 'mine') => setFilterBy(value)}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="mine">Meus</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest') => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  {sortBy === 'newest' ? <SortDesc className="w-4 h-4 mr-2" /> : <SortAsc className="w-4 h-4 mr-2" />}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">
                {comments.length === 0 ? 'Nenhum comentário ainda' : 'Nenhum comentário encontrado'}
              </h4>
              <p className="text-muted-foreground text-sm">
                {comments.length === 0
                  ? 'Seja o primeiro a deixar um comentário sobre o projeto.'
                  : 'Tente ajustar os filtros de busca.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredComments.length} comentário{filteredComments.length !== 1 ? 's' : ''} encontrado{filteredComments.length !== 1 ? 's' : ''}
                {searchTerm && ` para "${searchTerm}"`}
              </p>
            </div>
            {filteredComments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Main Comment */}
                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {comment.author_user_id === profile?.user_id ? 'Você' : 'Cliente'}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(comment.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {comment.author_user_id === profile?.user_id && (
                          <Badge variant="outline" className="text-xs">Seu comentário</Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">Comentário</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">
                      {comment.content_md}
                    </p>

                    {/* Reply and Delete Buttons */}
                    <div className="flex justify-end gap-2">
                      {(comment.author_user_id === profile?.user_id || isAdminView) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="gap-2"
                      >
                        <Reply className="w-4 h-4" />
                        Responder
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <Card className={`${
                    isAdminView 
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                      : 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                  } ml-8`}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <Textarea
                          placeholder={
                            isAdminView 
                              ? "Digite sua resposta como administrador..." 
                              : "Digite sua resposta..."
                          }
                          value={newReplies[comment.id] || ''}
                          onChange={(e) => setNewReplies(prev => ({ ...prev, [comment.id]: e.target.value }))}
                          className="min-h-[80px]"
                          disabled={submitting}
                        />
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <span>Respondendo como: <strong>Administrador</strong></span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setNewReplies(prev => ({ ...prev, [comment.id]: '' }));
                              }}
                              disabled={submitting}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!newReplies[comment.id]?.trim() || submitting}
                              size="sm"
                              className="gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                              <Send className="w-4 h-4" />
                              {submitting ? 'Enviando...' : 'Enviar Resposta'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Replies */}
                {commentReplies[comment.id] && commentReplies[comment.id].length > 0 && (
                  <div className="ml-8 space-y-2">
                    {commentReplies[comment.id].map((reply) => (
                      <Card key={reply.id} className={`border-l-4 ${reply.is_from_admin ? 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10' : 'border-l-green-500 bg-green-50/30 dark:bg-green-950/10'}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${reply.is_from_admin ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'}`}>
                              {reply.is_from_admin ? (
                                <Shield className="w-4 h-4 text-blue-600" />
                              ) : (
                                <User className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {reply.is_from_admin ? 'Administrador' : 'Cliente'}
                                </span>
                                <Badge variant={reply.is_from_admin ? "default" : "secondary"} className="text-xs">
                                  {reply.is_from_admin ? 'Resposta Admin' : 'Resposta'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {reply.content_md}
                              </p>
                              {/* Delete Button for Replies */}
                              {(reply.author_user_id === profile?.user_id || (isAdminView && reply.is_from_admin)) && (
                                <div className="flex justify-end mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteReply(reply.id, comment.id)}
                                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Excluir
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};