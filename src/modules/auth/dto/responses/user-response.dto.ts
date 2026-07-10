import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'a6b544fb-8f48-489b-8517-ba32fbd76ccc' })
  id!: string;

  @ApiProperty({ example: 'test@gmail.com' })
  email!: string;

  @ApiProperty({ example: 'customer' })
  role!: string;

  @ApiProperty({ example: null, nullable: true })
  storeId!: string | null;

  @ApiProperty({ example: 'John Doe' })
  fullName!: string;

  @ApiProperty({ example: null, nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: null, nullable: true })
  dob!: string | null;

  @ApiProperty({ example: null, nullable: true })
  gender!: string | null;

  @ApiProperty({ example: false })
  isBanned!: boolean;

  @ApiProperty({ example: '2026-07-08T07:31:57.613Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-08T07:31:57.613Z' })
  updatedAt!: string;
}
