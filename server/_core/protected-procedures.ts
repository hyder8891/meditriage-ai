import { publicProcedure } from "./trpc";
import { authMiddleware, patientMiddleware, clinicianMiddleware, adminMiddleware } from "./auth-middleware";

/**
 * Protected procedure that requires authentication
 */
export const authenticatedProcedure = publicProcedure.use(authMiddleware);

/**
 * Protected procedure that requires patient role
 */
export const patientProcedure = publicProcedure.use(patientMiddleware);

/**
 * Protected procedure that requires clinician role
 */
export const clinicianProcedure = publicProcedure.use(clinicianMiddleware);

/**
 * Protected procedure that requires admin role
 */
export const adminProcedure = publicProcedure.use(adminMiddleware);
