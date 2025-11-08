import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { Guest } from '../../libs/dto/user/user';
import { GuestInput, GuestLoginInput } from '../../libs/dto/user/user.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../libs/enums/user.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GuestUpdateInput } from '../../libs/dto/user/user.update';
import { ObjectId } from 'mongoose';

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

  @Roles(UserRole.ADMIN, UserRole.HOTEL_OWNER, UserRole.GUEST)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async checkAuthRole(@AuthMember() authMember: Guest): Promise<string> {
    console.log('Query: checkAuthRoles');

    return `Hi ${authMember.guestName}, you are ${authMember.userRole} (memberId: ${authMember._id})`;
  }

  @Roles(UserRole.GUEST)
  @UseGuards(RolesGuard)
  @Mutation(() => Guest)
  public async updateGuest(
    @Args('input') input: GuestUpdateInput,
    @AuthMember('_id') guestId: ObjectId,
  ) {
    console.log('Mutation: updateGuest');
    console.log('Input', input);

    delete input._id;
    console.log('guestId TYPE', typeof guestId);
    return await this.memberService.updateGuest(guestId, input);
  }
}
