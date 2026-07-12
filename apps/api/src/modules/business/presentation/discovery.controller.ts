import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../../common/decorators/public.decorator";
import { SearchBusinessesDto } from "../application/dto/search-businesses.dto";
import { DiscoveryUseCase } from "../application/use-cases/discovery.use-case";

@ApiTags("discovery")
@Controller()
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryUseCase) {}

  @Public()
  @Get("business-types")
  listBusinessTypes() {
    return this.discovery.listBusinessTypes();
  }

  @Public()
  @Get("cities")
  listCities() {
    return this.discovery.listCities();
  }

  @Public()
  @Get("businesses")
  search(@Query() query: SearchBusinessesDto) {
    return this.discovery.search(query);
  }

  @Public()
  @Get("businesses/:slug")
  getBySlug(@Param("slug") slug: string) {
    return this.discovery.getBySlug(slug);
  }

  @Public()
  @Get("businesses/:id/products")
  listProducts(@Param("id") id: string, @Query("categoryId") categoryId?: string) {
    return this.discovery.listProducts(id, categoryId);
  }

  @Public()
  @Get("businesses/:id/services")
  listServices(@Param("id") id: string, @Query("categoryId") categoryId?: string) {
    return this.discovery.listServices(id, categoryId);
  }
}
