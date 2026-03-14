import { IsString, IsNumber, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustPointsDto {
  @ApiProperty({ example: 'p1-uuid-0001', description: 'Target player ID' })
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @ApiProperty({ example: 100, description: 'Points to add (positive) or remove (negative)' })
  @IsNumber()
  points!: number;

  @ApiProperty({ example: 'Manual adjustment for missed hand', description: 'Reason for adjustment' })
  @IsString()
  @MinLength(3)
  reason!: string;
}
