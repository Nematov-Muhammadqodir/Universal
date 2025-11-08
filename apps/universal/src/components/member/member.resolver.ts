import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { Guest } from '../../libs/dto/user/user';
import { GuestInput, GuestLoginInput } from '../../libs/dto/user/user.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => Guest)
  public async guestSignup(@Args('input') input: GuestInput): Promise<Guest> {
    console.log('Mutation signup');
    console.log('Input', input);

    return await this.memberService.guestSignup(input);
  }

  @Mutation(() => Guest)
  public async guestLogin(
    @Args('input') input: GuestLoginInput,
  ): Promise<Guest> {
    console.log('Mutation signup');
    console.log('Input', input);

    return await this.memberService.guestLogin(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => String)
  public async checkAuth(
    @AuthMember('guestName') guestName: string,
  ): Promise<string> {
    console.log('Query checkAuth');
    return `Hi ${guestName}, your authentication is valid!`;
  }
}
