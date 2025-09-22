import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, Trash2, Eye, EyeOff } from 'lucide-react';
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
  sprints?: {
    id: string;
    sprint_number: number;
  };
}

interface AdminComentariosViewProps {
  projectId: string;
}

export const AdminComentariosView = ({ projectId }: AdminComentariosViewProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [projectId, showHidden]);

  const fetchComments = async () => {
    try {
      // Buscar comentários do projeto
      const query = supabase
        .from('comments')
        .select(`
          *,
          sprints(
            id,
            sprint_number
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!showHidden) {
        query.eq('is_visible', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os comentários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (commentId: string, currentVisibility: boolean) => {
    const action = currentVisibility ? 'ocultar' : 'mostrar';
    if (!confirm(`Tem certeza que deseja ${action} este comentário?`)) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_visible: !currentVisibility })
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Comentário ${currentVisibility ? 'ocultado' : 'restaurado'} com sucesso!`
      });

      fetchComments();
    } catch (error) {
      console.error('Erro ao alterar visibilidade do comentário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a visibilidade do comentário",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gerenciar Comentários</h3>
          <p className="text-muted-foreground">
            Visualizar e moderar os comentários dos clientes nas sprints.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHidden(!showHidden)}
          className={showHidden ? 'bg-yellow-500/10 border-yellow-500' : ''}
        >
          {showHidden ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Ocultar comentários invisíveis
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Mostrar comentários ocultos
            </>
          )}
        </Button>
      </div>

      {comments.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">
              {showHidden ? 'Nenhum comentário oculto' : 'Nenhum comentário ainda'}
            </h4>
            <p className="text-muted-foreground text-sm">
              {showHidden 
                ? 'Não há comentários ocultos neste projeto.'
                : 'Os comentários dos clientes aparecerão aqui quando forem enviados nas sprints.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <Card 
              key={comment.id} 
              className={`bg-card/80 backdrop-blur-sm border-border/50 ${
                !comment.is_visible ? 'opacity-60 border-yellow-500/50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">
                        Sprint {comment.sprints?.sprint_number || '?'}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(comment.created_at).toLocaleDateString('pt-BR')}</span>
                        {!comment.is_visible && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              Oculto
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(comment.id, comment.is_visible)}
                      className={comment.is_visible ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {comment.is_visible ? (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Mostrar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comment content in markdown */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {comment.content_md}
                    </pre>
                  </div>
                </div>

                {/* Author info */}
                <div className="text-xs text-muted-foreground">
                  ID do Autor: {comment.author_user_id}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};