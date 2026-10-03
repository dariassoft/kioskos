import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateSystemSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  value: string;
}