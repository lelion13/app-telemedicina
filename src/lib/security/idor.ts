/**
 * Revisión IDOR — helpers explícitos para validar pertenencia de recursos.
 * Todas las rutas empresa DEBEN filtrar por empresaId de sesión, nunca del body.
 */

export function assertEmpresaResource(
  resourceEmpresaId: string,
  sessionEmpresaId: string,
): boolean {
  return resourceEmpresaId === sessionEmpresaId;
}

export function buildEmpresaScopedQuery<T extends Record<string, unknown>>(
  empresaId: string,
  query: T,
): T & { empresaId: string } {
  return { ...query, empresaId };
}
