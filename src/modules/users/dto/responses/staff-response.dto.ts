import { ApiProperty } from '@nestjs/swagger';

export class StaffResponseDto {
  @ApiProperty({ example: 'a6b544fb-8f48-489b-8517-ba32fbd76ccc' })
  id!: string;

  @ApiProperty({ example: 'staff@example.com' })
  email!: string;

  @ApiProperty({ example: 'staff' })
  role!: string;

  @ApiProperty({ example: 'a6b544fb-8f48-489b-8517-ba32fbd76ccc' })
  storeId!: string;

  @ApiProperty({ example: 'Staff Member' })
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
