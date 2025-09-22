import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User, Calendar, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

interface ComentariosViewProps {
  projectId: string;
}

export const ComentariosView = ({ projectId }: ComentariosViewProps) => {
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        // Buscar comentários diretamente do projeto
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('project_id', projectId)
          .eq('is_visible', true) // Apenas comentários visíveis
          .order('created_at', { ascending: false });

        if (error) throw error;
        setComments(data || []);
      } catch (error) {
        console.error('Erro ao buscar comentários:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [projectId]);

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

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">Nenhum comentário ainda</h4>
              <p className="text-muted-foreground text-sm">
                Seja o primeiro a deixar um comentário sobre o projeto.
              </p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        Cliente - {comment.author_user_id.slice(0, 8)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(comment.created_at)}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">Comentário</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content_md}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};