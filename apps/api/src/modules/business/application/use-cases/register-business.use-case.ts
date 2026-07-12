import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  BUSINESS_REPOSITORY,
  type BusinessRecord,
  type BusinessRepository,
} from "../../domain/repositories/business.repository";
import { STAFF_REPOSITORY, type StaffRepository } from "../../domain/repositories/staff.repository";
import { TAXONOMY_REPOSITORY, type TaxonomyRepository } from "../../domain/repositories/taxonomy.repository";
import { ROLE_REPOSITORY, type RoleRepository } from "../../../identity/domain/repositories/role.repository";
import { TOKEN_ISSUER, type TokenIssuerPort } from "../../../identity/domain/services/token-issuer.port";
import { NotFoundException } from "../../../../common/errors/app.errors";
import { SlugAlreadyTakenException } from "../../domain/errors/business.errors";
import type { RegisterBusinessDto } from "../dto/register-business.dto";

export interface RegisterBusinessResult {
  business: BusinessRecord;
  /** Fresh access token carrying the new BUSINESS_OWNER grant — see TokenIssuerPort.issueAccessToken. */
  accessToken: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class RegisterBusinessUseCase {
  constructor(
    @Inject(BUSINESS_REPOSITORY) private readonly businesses: BusinessRepository,
    @Inject(STAFF_REPOSITORY) private readonly staff: StaffRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(TOKEN_ISSUER) private readonly tokenIssuer: TokenIssuerPort,
    private readonly events: EventEmitter2,
  ) {}

  async execute(ownerUserId: string, dto: RegisterBusinessDto): Promise<RegisterBusinessResult> {
    const businessType = await this.taxonomy.findBusinessTypeById(dto.businessTypeId);
    if (!businessType) throw new NotFoundException("Business type");
    const city = await this.taxonomy.findCityById(dto.cityId);
    if (!city) throw new NotFoundException("City");

    // Base slug from name, disambiguated with a numeric suffix on collision — kept simple
    // and deterministic rather than a random suffix, since a predictable /2 /3 reads better
    // in a URL than a random string for a small number of same-name collisions.
    const baseSlug = slugify(dto.name);
    if (!baseSlug) throw new SlugAlreadyTakenException();
    let slug = baseSlug;
    for (let suffix = 2; await this.businesses.slugExists(slug); suffix++) {
      slug = `${baseSlug}-${suffix}`;
    }

    const business = await this.businesses.create({ ...dto, ownerUserId, slug });

    // Registrant becomes BUSINESS_OWNER immediately — verification (Admin) gates going
    // *live* in discovery, not the owner's ability to start building their catalog.
    await this.staff.invite(business.id, ownerUserId, "BUSINESS_OWNER");

    // Re-mint the caller's access token with the new grant baked in — without this, the
    // owner's existing JWT has no BUSINESS_OWNER permission for this business until their
    // next login/refresh, and every subsequent call in this same flow (add products, etc.)
    // would 403 despite the registration having just succeeded.
    const grants = await this.roles.resolveGrantsForUser(ownerUserId);
    const accessToken = await this.tokenIssuer.issueAccessToken(ownerUserId, grants);

    this.events.emit("business.registered", { businessId: business.id });
    return { business, accessToken };
  }
}
