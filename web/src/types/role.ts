export interface RoleItem {
  id: number;
  name: string;
  description?: string;
}

export interface RoleRequestPayload {
  name: string;
  description?: string;
}
