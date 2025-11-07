import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Guest } from '../../libs/dto/user/user';
import { AuthService } from '../auth/auth.service';
import { Model } from 'mongoose';
import { GuestInput } from '../../libs/dto/user/user.input';
import { Message } from '../../libs/enums/common.enum';

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

    console.log('Service signup', input);

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
}
