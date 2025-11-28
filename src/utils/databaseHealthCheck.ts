import { supabase } from "@/integrations/supabase/client";

export class DatabaseHealthCheck {
  private static checkedTables = new Set<string>();
  
  /**
   * Check if a table exists and is accessible
   */
  static async checkTableExists(tableName: string): Promise<boolean> {
    // Cache results to avoid repeated checks
    if (this.checkedTables.has(tableName)) {
      return true;
    }
    
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        // Check if it's a table not found error
        if (
          error.code === "42P01" ||
          error.message?.includes("relation") ||
          error.message?.includes("does not exist")
        ) {
          return false;
        }
        // Other errors might be temporary, so don't mark as missing
        return false;
      }
      
      // Table exists and is accessible
      this.checkedTables.add(tableName);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Clear the cache of checked tables
   */
  static clearCache(): void {
    this.checkedTables.clear();
  }
}
