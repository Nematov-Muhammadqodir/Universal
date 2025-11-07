import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { Guest } from '../../libs/dto/user/user';
import { GuestInput } from '../../libs/dto/user/user.input';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => Guest)
  public async guestSignup(@Args('input') input: GuestInput): Promise<Guest> {
    console.log('Mutation signup');
    console.log('Input', input);

    return await this.memberService.guestSignup(input);
  }
}
