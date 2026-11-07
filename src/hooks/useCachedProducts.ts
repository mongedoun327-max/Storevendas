"use client";

import { useCallback, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { offlineDb } from "@/lib/db/offlineDb";
import { syncCatalogFromSupabase } from "@/services/productCacheService";

export function useCachedProducts(
  searchTerm: string = "",
  selectedCategoryId: string | null = null
) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshCatalog = useCallback(async (): Promise<void> => {
    if (typeof navigator === "undefined" || !navigator.onLine) return;

    setIsRefreshing(true);
    try {
      await syncCatalogFromSupabase();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  const products = useLiveQuery(async () => {
    const collection = selectedCategoryId
      ? offlineDb.products.where("categoryId").equals(selectedCategoryId)
      : offlineDb.products.toCollection();
    let result = await collection.toArray();
    const term = searchTerm.trim().toLowerCase();

    if (term) {
      result = result.filter(
        (product) => product.name.toLowerCase().includes(term)
          || Boolean(product.barcode?.toLowerCase().includes(term))
      );
    }

    return result;
  }, [searchTerm, selectedCategoryId]) ?? [];

  const categories = useLiveQuery(
    () => offlineDb.categories.toArray(),
    []
  ) ?? [];

  return {
    products,
    categories,
    isRefreshing,
    refreshCatalog,
  };
}
