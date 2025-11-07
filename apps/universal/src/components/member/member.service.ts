import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Guest } from '../../libs/dto/user/user';
import { AuthService } from '../auth/auth.service';
import { Model } from 'mongoose';
import { GuestInput, GuestLoginInput } from '../../libs/dto/user/user.input';
import { Message } from '../../libs/enums/common.enum';
import { GuestStatus } from '../../libs/enums/user.enum';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Guest') private readonly guestModel: Model<Guest>,
    private authService: AuthService,
  ) {}

  public async guestSignup(input: GuestInput): Promise<Guest> {
    input.guestPassword = await this.authService.hashPassword(
      input.guestPassword,
    );

    const isSameEmail = await this.guestModel
      .findOne({ guestEmail: input.guestEmail })
      .exec();

    const isSamePhone = await this.guestModel
      .findOne({ guestPhone: input.guestPhone })
      .exec();

    if (isSameEmail || isSamePhone) {
      throw new BadRequestException(Message.PLEASE_ENTER_VALID_CREDENTIALS);
    }

    console.log('guestSignup signup', input);

    try {
      const result: Guest = await this.guestModel.create(input);
      //TODO: Authentication with tokens
      result.accessToken = await this.authService.createToken(result);

      return result;
    } catch (err) {
      console.log('Error, signup', err.message);
      throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
    }
  }

  public async guestLogin(input: GuestLoginInput): Promise<Guest> {
    console.log('guestLogin signup', input);
    const { guestEmail, guestPassword } = input;
    const response: Guest | null = await this.guestModel
      .findOne({ guestEmail: guestEmail })
      .select('+guestPassword')
      .exec();

    if (!response || response.guestStatus === GuestStatus.DELETE) {
      throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
    } else if (response.guestStatus === GuestStatus.BLOCK) {
      throw new InternalServerErrorException(Message.BLOCKED_USER);
    }

    const isMatch = await this.authService.comparePassword(
      guestPassword,
      response.guestPassword,
    );
    if (!isMatch)
      throw new InternalServerErrorException(Message.WRONG_PASSWORD);
    response.accessToken = await this.authService.createToken(response);
    return response;
  }
}
