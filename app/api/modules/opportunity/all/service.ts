import { OpportunityClubRepository } from "../clubs/repository.js";
import { OpportunityClubService } from "../clubs/service.js";
import { OpportunityEventRepository } from "../events/repository.js";
import { OpportunityEventService } from "../events/service.js";
import { OpportunityRouteRepository } from "../routes/repository.js";
import { OpportunityRouteService } from "../routes/service.js";
import { OpportunityVenueRepository } from "../venues/repository.js";
import { OpportunityVenueService } from "../venues/service.js";

export class AllOpportunitiesService {
  private readonly eventService: OpportunityEventService;
  private readonly clubService: OpportunityClubService;
  private readonly routeService: OpportunityRouteService;
  private readonly venueService: OpportunityVenueService;

  constructor() {
    this.eventService = new OpportunityEventService(
      new OpportunityEventRepository(),
    );
    this.clubService = new OpportunityClubService(
      new OpportunityClubRepository(),
    );
    this.routeService = new OpportunityRouteService(
      new OpportunityRouteRepository(),
    );
    this.venueService = new OpportunityVenueService(
      new OpportunityVenueRepository(),
    );
  }

  async getAll() {
    const [events, clubs, routes, venues] = await Promise.all([
      this.eventService.getAll(),
      this.clubService.getAll(),
      this.routeService.getAll(),
      this.venueService.getAll(),
    ]);
    return { events, clubs, routes, venues };
  }
}
