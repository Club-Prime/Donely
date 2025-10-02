
// Teste de conexão com Supabase
import { supabase } from './src/integrations/supabase/client.js';

async function testDatabase() {
  console.log("🔍 Testando conexão com Supabase...");
  
  try {
    // Teste 1: Verificar se consegue conectar
    const { data, error } = await supabase.from('profiles').select('count').limit(0);
    if (error) {
      console.log("❌ Erro na tabela profiles:", error.message);
    } else {
      console.log("✅ Tabela profiles existe e é acessível");
    }
    
    // Teste 2: Verificar outras tabelas principais
    const tables = ['projects', 'sprints', 'roadmap_items', 'evidences', 'comments'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count').limit(0);
      if (error) {
        console.log(`❌ Erro na tabela ${table}:`, error.message);
      } else {
        console.log(`✅ Tabela ${table} existe e é acessível`);
      }
    }
    
    // Teste 3: Verificar auth
    const { data: { user } } = await supabase.auth.getUser();
    console.log("👤 Status de autenticação:", user ? "Usuário logado" : "Não logado");
    
  } catch (err) {
    console.error("💥 Erro geral:", err);
  }
}

testDatabase();
