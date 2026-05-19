import type { OpportunityRecordType } from "@prisma/client";

export function legKey(type: OpportunityRecordType, opportunityId: string): string {
  return `${type}:${opportunityId}`;
}
