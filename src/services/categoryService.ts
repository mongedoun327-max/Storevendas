import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

/**
 * Opção A: Reatribuir produtos para outra categoria e eliminar
 * Executa a RPC no Supabase/Postgres que transfere os produtos vinculados
 * para outra categoria (ou null = "Sem Categoria") e em seguida remove a categoria.
 */
export async function reassignAndDeleteCategory(categoryId: string, targetCategoryId: string | null) {
  const { error } = await supabase.rpc('delete_category_and_reassign', {
    p_category_id: categoryId,
    p_target_category_id: targetCategoryId, // null envia os produtos para "Sem Categoria"
  });

  if (error) throw new Error(error.message);
}

/**
 * Opção B: Eliminar diretamente
 * O ON DELETE SET NULL configurado nas chaves estrangeiras do Postgres atuará automaticamente,
 * desvinculando os produtos da categoria apagada.
 */
export async function deleteCategoryDirect(categoryId: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) throw new Error(error.message);
}

export default {
  reassignAndDeleteCategory,
  deleteCategoryDirect,
};
