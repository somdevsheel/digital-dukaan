import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { RegisterBusinessDto } from "../application/dto/register-business.dto";
import { UpdateBusinessDto } from "../application/dto/update-business.dto";
import { ReplaceBusinessHoursDto } from "../application/dto/business-hours.dto";
import { UpsertBankDetailDto } from "../application/dto/bank-detail.dto";
import { AddBusinessMediaDto, RecordBusinessDocumentDto, RequestBusinessUploadUrlDto } from "../application/dto/business-media.dto";
import { RegisterBusinessUseCase } from "../application/use-cases/register-business.use-case";
import { BusinessProfileUseCase } from "../application/use-cases/business-profile.use-case";
import { StaffUseCase } from "../application/use-cases/staff.use-case";

// Nested routes use :businessId (not :id) deliberately — PermissionGuard matches a
// business-scoped grant against request.params.businessId (Architecture §9).
@ApiTags("merchant/business")
@Controller("merchant/businesses")
export class MerchantBusinessController {
  constructor(
    private readonly registerBusiness: RegisterBusinessUseCase,
    private readonly profile: BusinessProfileUseCase,
    private readonly staff: StaffUseCase,
  ) {}

  @Post()
  async register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterBusinessDto) {
    return this.registerBusiness.execute(user.userId, dto);
  }

  // No @RequirePermission — deliberately unscoped by businessId, since the entire point
  // is discovering which business(es) the caller has *any* grant for. Every business.manage
  // fetch further down this controller is what actually gates per-business access.
  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.staff.listMyBusinesses(user.userId);
  }

  @RequirePermission("business.manage")
  @Get(":businessId")
  getMine(@Param("businessId") businessId: string) {
    return this.profile.getById(businessId);
  }

  @RequirePermission("business.manage")
  @Patch(":businessId")
  update(@Param("businessId") businessId: string, @Body() dto: UpdateBusinessDto) {
    return this.profile.update(businessId, dto);
  }

  @RequirePermission("business.manage")
  @Post(":businessId/upload-url")
  createUploadUrl(@Param("businessId") businessId: string, @Body() dto: RequestBusinessUploadUrlDto) {
    return this.profile.createUploadUrl(businessId, dto.folder, dto.fileName, dto.contentType);
  }

  @RequirePermission("business.manage")
  @Get(":businessId/hours")
  listHours(@Param("businessId") businessId: string) {
    return this.profile.listHours(businessId);
  }

  @RequirePermission("business.manage")
  @Patch(":businessId/hours")
  replaceHours(@Param("businessId") businessId: string, @Body() dto: ReplaceBusinessHoursDto) {
    return this.profile.replaceHours(businessId, dto.days);
  }

  @RequirePermission("business.manage")
  @Get(":businessId/media")
  listMedia(@Param("businessId") businessId: string) {
    return this.profile.listMedia(businessId);
  }

  @RequirePermission("business.manage")
  @Post(":businessId/media")
  addMedia(@Param("businessId") businessId: string, @Body() dto: AddBusinessMediaDto) {
    return this.profile.addMedia(businessId, dto.type, dto.url, dto.sortOrder ?? 0);
  }

  @RequirePermission("business.manage")
  @Delete(":businessId/media/:mediaId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMedia(@Param("mediaId") mediaId: string): Promise<void> {
    await this.profile.removeMedia(mediaId);
  }

  @RequirePermission("business.manage")
  @Get(":businessId/documents")
  listDocuments(@Param("businessId") businessId: string) {
    return this.profile.listDocuments(businessId);
  }

  @RequirePermission("business.manage")
  @Post(":businessId/documents")
  recordDocument(@Param("businessId") businessId: string, @Body() dto: RecordBusinessDocumentDto) {
    return this.profile.recordDocument(businessId, dto.type, dto.fileUrl);
  }

  @RequirePermission("business.manage")
  @Get(":businessId/bank-details")
  getBankDetail(@Param("businessId") businessId: string) {
    return this.profile.getBankDetail(businessId);
  }

  @RequirePermission("business.manage")
  @Post(":businessId/bank-details")
  upsertBankDetail(@Param("businessId") businessId: string, @Body() dto: UpsertBankDetailDto) {
    return this.profile.upsertBankDetail(businessId, dto);
  }
}
