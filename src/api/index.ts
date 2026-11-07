export {
  GET as getProductsRoute,
  POST as createProductRoute,
  expressHandlers as productExpressHandlers,
  type ApiResponse,
} from './products';

export {
  GET as getSaftRoute,
  expressSaftHandler,
} from './saft';

export {
  POST as onboardingRoute,
  provisionTenant,
  expressOnboardingHandler,
  type TenantProvisioningPayload,
  type TenantProvisioningResult,
} from './onboarding';

export {
  POST as uploadProductImageRoute,
  uploadProductImage,
  expressUploadHandler,
  type ProductImageUploadResult,
} from './upload/product-image';

export {
  POST as registerCashMovementRoute,
  expressCashMovementHandler,
} from './cashMovements';

export {
  POST as closeShiftRoute,
  expressCloseShiftHandler,
} from './shiftClose';

export {
  expressSendAuditEmailHandler,
  expressSendShiftReportZEmailHandler,
  sendAuditReportEmail,
  sendShiftReportZEmail,
} from './email';



