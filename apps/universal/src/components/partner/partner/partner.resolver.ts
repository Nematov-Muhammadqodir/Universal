import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PartnerService } from './partner.service';
import { Partner } from 'apps/universal/src/libs/dto/partner/partner';
import {
  PartnerInput,
  PartnerLoginInput,
} from 'apps/universal/src/libs/dto/partner/partner.input';

@Resolver()
export class PartnerResolver {
  constructor(private readonly partnerService: PartnerService) {}

  @Mutation(() => Partner)
  public async partnerSignup(
    @Args('input') input: PartnerInput,
  ): Promise<Partner> {
    console.log('Mutation signup');
    console.log('Input', input);

    return await this.partnerService.partnerSignup(input);
  }

  @Mutation(() => Partner)
  public async partnerLogin(
    @Args('input') input: PartnerLoginInput,
  ): Promise<Partner> {
    console.log('Mutation partnerLogin');
    console.log('Input', input);

    return await this.partnerService.partnerLogin(input);
  }
}
