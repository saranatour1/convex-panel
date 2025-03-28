/**
 * Updates specified fields for given document IDs in a table
 * @param table - The table name
 * @param ids - Array of document IDs to update
 * @param fields - Record of field names and their new values
 * @param adminClient - The Convex admin client instance
 * @returns The result of the mutation
 */
export const patchDocumentFields = async (
  table: string, 
  ids: string[], 
  fields: Record<string, any>,
  adminClient: any
) => {
  if (!adminClient) {
    throw new Error("Admin client is not available");
  }
  
  try {
    const result = await adminClient.mutation(
      "_system/frontend/patchDocumentsFields" as any,
      {
        table,
        componentId: null,
        ids,
        fields
      }
    );
    
    return result;
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

/**
 * Deletes documents from a table
 * @param table - The table name
 * @param ids - Array of document IDs to delete
 * @param adminClient - The Convex admin client instance
 * @returns The result of the mutation
 */
export const deleteDocuments = async (
  table: string,
  ids: string[],
  adminClient: any,
  componentId: string | null = null
) => {
  if (!adminClient) {
    throw new Error("Admin client is not available");
  }

  try {
    const result = await adminClient.mutation(
      "_system/frontend/deleteDocuments" as any,
      {
        toDelete: ids.map(id => ({ tableName: table, id })),
        componentId
      }
    );

    return result;
  } catch (error) {
    console.error("Error deleting documents:", error);
    throw error;
  }
};
