import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@negocio.com' })
  @IsEmail({}, { message: 'Ingresa un email válido' })
  email: string;

  @ApiProperty({ example: 'MiClave123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
