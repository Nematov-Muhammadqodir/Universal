import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class WithoutGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext | any): Promise<boolean> {
    console.info('--- @guard() Authentication [WithoutGuard] ---');

    if (context.contextType === 'graphql') {
      const request = context.getArgByIndex(2).req,
        bearerToken = request.headers.authorization;
      console.log('request context.getArgByIndex(2', request.headers);
      if (bearerToken) {
        try {
          const token = bearerToken.split(' ')[1],
            authMember = await this.authService.verifyToken(token);

          request.body.authMember = authMember;
        } catch (err) {
          request.body.authMember = null;
        }
      } else request.body.authMember = null;

      console.log(
        'memberNick[without] =>',
        request.body.authMember?._id ?? 'none',
      );
      return true;
    }
    return false;
    // description => http, rpc, gprs and etc are ignored
  }
}
