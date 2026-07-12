export interface BusinessTypeRecord {
  id: string;
  name: string;
  commerceModel: "PRODUCT" | "SERVICE";
  icon: string | null;
  sortOrder: number;
}

export interface CityRecord {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
}

/** Port — small, admin-managed reference tables. Grouped in one repository since neither
 *  has enough independent write-side logic to warrant its own file (both are simple lookup
 *  lists maintained by Admin, per PRD Admin Panel: Categories). */
export interface TaxonomyRepository {
  listBusinessTypes(): Promise<BusinessTypeRecord[]>;
  findBusinessTypeById(id: string): Promise<BusinessTypeRecord | null>;
  listActiveCities(): Promise<CityRecord[]>;
  findCityById(id: string): Promise<CityRecord | null>;
}

export const TAXONOMY_REPOSITORY = Symbol("TAXONOMY_REPOSITORY");
