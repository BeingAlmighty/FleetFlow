import { z } from "zod";

export const checkinSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  remarks: z.string().optional()
});

export type CheckinFormValues = z.infer<typeof checkinSchema>;
