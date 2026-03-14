import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TierOverrideDto {
  @ApiProperty({ example: 'p1-uuid-0001', description: 'Target player ID' })
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @ApiProperty({ example: 3, description: 'Tier to set (1=Bronze, 2=Silver, 3=Gold, 4=Platinum)' })
  @IsNumber()
  @Min(1)
  @Max(4)
  tier!: number;

  @ApiProperty({ example: 'VIP promotion for tournament winner', description: 'Reason for override' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: '2026-04-14T00:00:00Z', description: 'When the override expires' })
  @IsString()
  @IsNotEmpty()
  expiresAt!: string;
}
