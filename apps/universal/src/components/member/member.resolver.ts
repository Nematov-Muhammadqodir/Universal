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
import { WithoutGuard } from '../auth/guards/without.guard';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { Message } from '../../libs/enums/common.enum';
import {
  shapeIntoMongoObjectId,
  validMimeTypes,
} from '../../libs/config';
import { uploadStreamToCloudinary } from '../../libs/cloudinary';

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
    console.log('Mutation guestLogin');
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

  @UseGuards(AuthGuard)
  @Mutation(() => Guest)
  public async changePassword(
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
    @AuthMember('_id') guestId: ObjectId,
  ): Promise<Guest> {
    console.log('Mutation: changePassword');
    return await this.memberService.changePassword(
      guestId,
      oldPassword,
      newPassword,
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Guest)
  public async deleteAccount(
    @AuthMember('_id') guestId: ObjectId,
  ): Promise<Guest> {
    console.log('Mutation: deleteAccount');
    return await this.memberService.deleteAccount(guestId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Guest)
  public async getGuestProfile(
    @Args('memberId') input: string,
    @AuthMember('_id') guestId: ObjectId,
  ) {
    console.log('Query: getGuestProfile');
    const targetId = shapeIntoMongoObjectId(input);
    return await this.memberService.getGuestProfile(guestId, targetId);
  }

  //*=========================imageUploader👇🏻==============================

  @UseGuards(AuthGuard)
  @Mutation((returns) => String)
  public async imageUploader(
    @Args({ name: 'file', type: () => GraphQLUpload })
    { createReadStream, filename, mimetype }: FileUpload,
    @Args('target') target: String,
  ): Promise<string> {
    console.log('Mutation: imageUploader');

    if (!filename) throw new Error(Message.UPLOAD_FAILED);
    const validMime = validMimeTypes.includes(mimetype);
    if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

    try {
      const url = await uploadStreamToCloudinary(
        createReadStream(),
        String(target),
      );
      return url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw new Error(Message.UPLOAD_FAILED);
    }
  }

  //*===========================imagesUploader👇🏻===========================

  @UseGuards(AuthGuard)
  @Mutation((returns) => [String])
  public async imagesUploader(
    @Args('files', { type: () => [GraphQLUpload] })
    files: Promise<FileUpload>[],
    @Args('target') target: String,
  ): Promise<string[]> {
    console.log('Mutation: imagesUploader');

    const uploadedImages: string[] = [];
    const promisedList = files.map(
      async (img: Promise<FileUpload>, index: number): Promise<void> => {
        try {
          const { filename, mimetype, createReadStream } = await img;

          const validMime = validMimeTypes.includes(mimetype);
          if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

          const url = await uploadStreamToCloudinary(
            createReadStream(),
            String(target),
          );
          uploadedImages[index] = url;
        } catch (err) {
          console.error('Cloudinary upload error:', err);
        }
      },
    );

    await Promise.all(promisedList);
    return uploadedImages.filter(Boolean);
  }
}
