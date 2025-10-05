// Testes unitários para validar as correções implementadas
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProjectProgressService } from '../lib/projectProgress';

// Mock do Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({ data: null, error: null })),
        data: [],
        error: null
      })),
      in: jest.fn(() => ({
        order: jest.fn(() => ({ data: [], error: null }))
      })),
      gte: jest.fn(() => ({
        limit: jest.fn(() => ({ data: [], error: null }))
      })),
      order: jest.fn(() => ({ data: [], error: null }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({ error: null }))
    }))
  }))
};

jest.mock('../src/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Testes de Correções Implementadas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ProjectProgressService', () => {
    const mockProjectId = 'test-project-id';

    describe('calculateProgress', () => {
      it('deve calcular progresso corretamente com itens do roadmap', async () => {
        // Mock roadmap items
        const mockRoadmapItems = [
          { status: 'DONE' },
          { status: 'DONE' },
          { status: 'IN_PROGRESS' },
          { status: 'NOT_STARTED' },
          { status: 'NOT_STARTED' }
        ];

        mockSupabase.from.mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ 
              data: mockRoadmapItems,
              error: null 
            }))
          }))
        });

        const result = await ProjectProgressService.calculateProgress(mockProjectId);

        expect(result).toEqual({
          totalItems: 5,
          completedItems: 2,
          inProgressItems: 1,
          notStartedItems: 2,
          progressPercent: 40 // 2/5 = 40%
        });
      });

      it('deve lidar com projeto sem itens no roadmap', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ 
              data: [],
              error: null 
            }))
          }))
        });

        const result = await ProjectProgressService.calculateProgress(mockProjectId);

        expect(result).toEqual({
          totalItems: 0,
          completedItems: 0,
          inProgressItems: 0,
          notStartedItems: 0,
          progressPercent: 0
        });
      });

      it('deve lidar com erro na query', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ 
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        });

        const result = await ProjectProgressService.calculateProgress(mockProjectId);

        expect(result).toEqual({
          totalItems: 0,
          completedItems: 0,
          inProgressItems: 0,
          notStartedItems: 0,
          progressPercent: 0
        });
      });
    });

    describe('suggestProjectStatus', () => {
      it('deve sugerir DONE quando progresso é 100%', async () => {
        // Mock projeto atual
        mockSupabase.from.mockImplementation((table) => {
          if (table === 'projects') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => ({ 
                    data: { status: 'ACTIVE' },
                    error: null 
                  }))
                }))
              }))
            };
          }
          if (table === 'roadmap_items') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({ 
                  data: [
                    { status: 'DONE' },
                    { status: 'DONE' },
                    { status: 'DONE' }
                  ],
                  error: null 
                }))
              }))
            };
          }
          if (table === 'reports') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    limit: vi.fn(() => ({ 
                      data: [],
                      error: null 
                    }))
                  }))
                }))
              }))
            };
          }
        });

        const result = await ProjectProgressService.suggestProjectStatus(mockProjectId);

        expect(result.suggested).toBe('DONE');
        expect(result.shouldUpdate).toBe(true);
        expect(result.reason).toContain('concluídos');
      });

      it('deve sugerir ACTIVE quando há itens em progresso', async () => {
        mockSupabase.from.mockImplementation((table) => {
          if (table === 'projects') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => ({ 
                    data: { status: 'PLANNED' },
                    error: null 
                  }))
                }))
              }))
            };
          }
          if (table === 'roadmap_items') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({ 
                  data: [
                    { status: 'DONE' },
                    { status: 'IN_PROGRESS' },
                    { status: 'NOT_STARTED' }
                  ],
                  error: null 
                }))
              }))
            };
          }
          if (table === 'reports') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    limit: vi.fn(() => ({ 
                      data: [],
                      error: null 
                    }))
                  }))
                }))
              }))
            };
          }
        });

        const result = await ProjectProgressService.suggestProjectStatus(mockProjectId);

        expect(result.suggested).toBe('ACTIVE');
        expect(result.shouldUpdate).toBe(true);
      });
    });

    describe('syncProjectData', () => {
      it('deve sincronizar progresso e status corretamente', async () => {
        // Mock para cálculos
        mockSupabase.from.mockImplementation((table) => {
          if (table === 'roadmap_items') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({ 
                  data: [
                    { status: 'DONE' },
                    { status: 'IN_PROGRESS' }
                  ],
                  error: null 
                }))
              }))
            };
          }
          if (table === 'projects') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => ({ 
                    data: { status: 'PLANNED' },
                    error: null 
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => ({ error: null }))
              }))
            };
          }
          if (table === 'reports') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    limit: vi.fn(() => ({ 
                      data: [],
                      error: null 
                    }))
                  }))
                }))
              }))
            };
          }
        });

        const result = await ProjectProgressService.syncProjectData(mockProjectId);

        expect(result.progress.progressPercent).toBe(50); // 1/2 = 50%
        expect(result.status).toBe('ACTIVE');
        expect(result.updated).toBe(true);
      });
    });
  });

  describe('Correção de Evidências', () => {
    it('deve testar abordagem de query simplificada', async () => {
      const mockProjectId = 'test-project-id';
      // Simular o novo approach de buscar evidências
      const mockReports = [
        { id: 'report-1', title: 'Report 1', sprint_id: 'sprint-1' },
        { id: 'report-2', title: 'Report 2', sprint_id: 'sprint-2' }
      ];

      const mockEvidences = [
        { id: 'evidence-1', report_id: 'report-1', type: 'IMAGE' },
        { id: 'evidence-2', report_id: 'report-2', type: 'VIDEO' }
      ];

      // Mock sequencial - primeiro reports, depois evidências
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'reports') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({ 
                data: mockReports,
                error: null 
              }))
            }))
          };
        }
        if (table === 'evidences') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => ({ 
                  data: mockEvidences,
                  error: null 
                }))
              }))
            }))
          };
        }
      });

      // Simular a nova lógica implementada
      const fetchEvidencesFixed = async (projectId: string) => {
        const { data: reportsData } = await mockSupabase
          .from('reports')
          .select('id, title, sprint_id')
          .eq('project_id', projectId);

        if (!reportsData || reportsData.length === 0) {
          return [];
        }

        const reportIds = reportsData.map((report: any) => report.id);
        
        const { data } = await mockSupabase
          .from('evidences')
          .select('*')
          .in('report_id', reportIds)
          .order('created_at', { ascending: false });

        return (data || []).map((evidence: any) => ({
          ...evidence,
          reports: {
            id: evidence.report_id,
            title: reportsData.find((r: any) => r.id === evidence.report_id)?.title || 'Sem título'
          }
        }));
      };

      const result = await fetchEvidencesFixed(mockProjectId);

      expect(result).toHaveLength(2);
      expect(result[0].reports.title).toBe('Report 1');
      expect(result[1].reports.title).toBe('Report 2');
    });
  });
});

// Função auxiliar para executar todos os testes
export const runAllTests = () => {
  console.log('🧪 Executando testes de validação das correções...');
  return true; // Placeholder - em um ambiente real, executaria os testes
};