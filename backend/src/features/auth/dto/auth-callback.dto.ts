import { IsNotEmpty, IsString } from 'class-validator';

export class AuthCallbackDto {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}
