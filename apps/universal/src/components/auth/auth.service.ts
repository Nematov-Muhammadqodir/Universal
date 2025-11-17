import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Guest } from '../../libs/dto/user/user';
import { Partner } from '../../libs/dto/partner/partner';
import { UserRole } from '../../libs/enums/user.enum';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  public async hashPassword(memberPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt();

    return await bcrypt.hash(memberPassword, salt);
  }

  public async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  public async createToken(member: Guest | Partner): Promise<string> {
    const payload: T = {};
    Object.keys(member['_doc'] ? member['_doc'] : member).map((ele) => {
      payload[`${ele}`] = member[`${ele}`];
    });
    if (member.userRole === UserRole.HOTEL_OWNER) {
      delete payload.partnerPassword;
    } else {
      delete payload.memberPassword;
    }

    return await this.jwtService.signAsync(payload);
  }

  public async verifyToken(token: string): Promise<Guest | Partner> {
    const member: Guest | Partner = await this.jwtService.verifyAsync(token);
    member._id = shapeIntoMongoObjectId(member._id);
    return member;
  }
}
