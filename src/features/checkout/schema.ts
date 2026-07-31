import { z } from "zod";

export const checkoutSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  paymentMode: z.enum(["upi", "cash"]),
  remarks: z.string().optional()
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
