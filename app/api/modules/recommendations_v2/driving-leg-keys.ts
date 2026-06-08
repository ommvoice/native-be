import type { OpportunityRecordType } from "../../types/db.js";

export function legKey(type: OpportunityRecordType, opportunityId: string): string {
  return `${type}:${opportunityId}`;
}
